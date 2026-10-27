from flask import Blueprint, request, jsonify
from utils.helpers import read_json, write_json, get_current_date, get_current_time
from utils.id_generator import generate_complaint_id
from config import COMPLAINTS_FILE, ORGANIZATIONS_FILE, ADMINS_FILE, USERS_FILE
from ml_model import get_model_for_org
from dsa import PriorityQueue
from notification_utils import add_notification

complaint_bp = Blueprint('complaint', __name__)

def get_org_ids_for_org(org_id):
    """Helper to find all related org IDs and org names for a given org_id."""
    orgs = read_json(ORGANIZATIONS_FILE)
    admins = read_json(ADMINS_FILE)

    target_orgs = [o for o in orgs if o.get('organizationId') == org_id]
    target_admins = [a for a in admins if a.get('organizationId') == org_id or a.get('userId') == org_id]

    org_names = set()
    emails = set()

    for o in target_orgs:
        if o.get('name'): org_names.add(o['name'].strip().lower())
        if o.get('email'): emails.add(o['email'].strip().lower())

    for a in target_admins:
        if a.get('organizationName'): org_names.add(a['organizationName'].strip().lower())
        if a.get('email'): emails.add(a['email'].strip().lower())

    matching_ids = {org_id}

    for o in orgs:
        o_name = o.get('name', '').strip().lower()
        o_email = o.get('email', '').strip().lower()
        if (o_name and o_name in org_names) or (o_email and o_email in emails):
            if o.get('organizationId'): matching_ids.add(o['organizationId'])

    for a in admins:
        a_name = a.get('organizationName', '').strip().lower()
        a_email = a.get('email', '').strip().lower()
        if (a_name and a_name in org_names) or (a_email and a_email in emails):
            if a.get('organizationId'): matching_ids.add(a['organizationId'])

    return matching_ids, org_names

from suggestion_service import get_suggestion_service

@complaint_bp.route('/suggestions', methods=['GET'])
def get_complaint_suggestions():
    """Live complaint suggestions from authoritative dataset."""
    q = request.args.get('q', '').strip()
    org_id = request.args.get('orgId')
    try:
        limit = int(request.args.get('limit', 5))
    except (ValueError, TypeError):
        limit = 5

    if not q:
        return jsonify({"suggestions": []}), 200

    try:
        svc = get_suggestion_service()
        suggestions = svc.get_suggestions(query=q, org_id=org_id, limit=limit)
        return jsonify({"suggestions": suggestions}), 200
    except Exception as e:
        return jsonify({"suggestions": [], "error": str(e)}), 200

@complaint_bp.route('/dataset-records/<record_id>', methods=['GET'])
def get_dataset_record(record_id):
    """Retrieve authoritative fields for a specific dataset record."""
    try:
        svc = get_suggestion_service()
        rec = svc.validate_record(record_id)
        if not rec:
            return jsonify({"error": "Dataset record not found"}), 404
        return jsonify({"record": rec}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@complaint_bp.route('/predict', methods=['POST'])
def predict_priority():
    """Predict complaint priority based on trained TF-IDF + Classifier model."""
    data = request.json or {}
    complaint_text = data.get('complaint', '').strip()
    org_id = data.get('organizationId', 'default')

    if not complaint_text:
        return jsonify({"priority": "Medium", "confidence": 0.5}), 200

    try:
        model = get_model_for_org(org_id)
        priority, confidence = model.predict(complaint_text)
        return jsonify({"priority": priority, "confidence": float(confidence)}), 200
    except Exception as e:
        return jsonify({"priority": "Medium", "confidence": 0.5, "fallback": True}), 200

@complaint_bp.route('', methods=['POST'])
def submit_complaint():
    data = request.json or {}
    complaint_text = data.get('complaint', '').strip()
    org_id = data.get('organizationId')

    if not complaint_text:
        return jsonify({"error": "Complaint description is required"}), 400

    if not org_id:
        return jsonify({"error": "Organization is required"}), 400

    # Authorization verification: ensure user belongs to this organization
    auth_user_id = request.headers.get('X-User-Id')
    auth_org_id = request.headers.get('X-Organization-Id')
    auth_role = request.headers.get('X-User-Role')

    if auth_role == 'USER' and auth_org_id and auth_org_id != org_id:
        return jsonify({"error": "Forbidden: You cannot submit complaints for another organization."}), 403

    user_id = auth_user_id if auth_user_id else data.get('userId', 'ANONYMOUS')

    selected_record_id = data.get('selectedRecordId')
    is_dataset_verified = False
    verified_dataset_complaint = None
    category = data.get('category', 'General')

    # Authoritative verification of selected dataset record
    if selected_record_id:
        svc = get_suggestion_service()
        verified_rec = svc.validate_record(selected_record_id)
        if verified_rec:
            # Strictly use authoritative priority from the dataset
            priority = verified_rec['priority']
            confidence = 1.0
            is_dataset_verified = True
            verified_dataset_complaint = verified_rec['complaint']
            if verified_rec.get('category'):
                category = verified_rec['category']
        else:
            return jsonify({"error": "Invalid dataset record reference. The selected record does not exist in the dataset."}), 400
    else:
        # Fallback to manual priority or ML prediction
        manual_priority = data.get('priority')
        if manual_priority and manual_priority in ['High', 'Medium', 'Low', 'HIGH', 'MEDIUM', 'LOW']:
            priority = manual_priority.capitalize()
            confidence = 1.0
        else:
            try:
                model = get_model_for_org(org_id)
                priority, confidence = model.predict(complaint_text)
            except Exception:
                priority = "Medium"
                confidence = 0.5

    new_complaint = {
        "complaintId": generate_complaint_id(),
        "userId": user_id,
        "userName": data.get('userName', 'Resident'),
        "userPhone": data.get('userPhone', ''),
        "organizationId": org_id,
        "organizationName": data.get('organizationName', '').strip(),
        "category": category,
        "locationDetails": data.get('locationDetails', '').strip(),
        "complaint": complaint_text,
        "date": get_current_date(),
        "time": get_current_time(),
        "priority": priority,
        "confidence": round(float(confidence), 2),
        "selectedRecordId": selected_record_id if is_dataset_verified else None,
        "isDatasetVerified": is_dataset_verified,
        "datasetComplaint": verified_dataset_complaint,
        "status": "Pending",
        "assignedTo": data.get('assignedTo', 'Unassigned'),
        "resolutionNotes": ""
    }

    complaints = read_json(COMPLAINTS_FILE)
    complaints.append(new_complaint)
    write_json(COMPLAINTS_FILE, complaints)

    # Notify Organization Admin
    add_notification(org_id, f"New {priority} priority complaint received from {new_complaint['userName']}.", "WARNING" if priority == "High" else "INFO")

    return jsonify(new_complaint), 201

def get_auth_context():
    """Extract authenticated user ID, role, and organization ID from request headers."""
    user_id = request.headers.get('X-User-Id')
    user_role = request.headers.get('X-User-Role')
    org_id = request.headers.get('X-Organization-Id')
    return user_id, user_role, org_id

@complaint_bp.route('/<complaint_id>', methods=['GET'])
def get_complaint_by_id(complaint_id):
    complaints = read_json(COMPLAINTS_FILE)
    complaint = next((c for c in complaints if c.get('complaintId') == complaint_id), None)
    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404

    # Security check: verify authorization
    user_id, user_role, req_org_id = get_auth_context()
    if user_role == 'USER' and user_id and complaint.get('userId') != user_id:
        return jsonify({"error": "Forbidden: You are not authorized to view this complaint"}), 403

    if user_role == 'SECONDARY_ADMIN' and req_org_id:
        matching_ids, org_names = get_org_ids_for_org(req_org_id)
        c_org_id = complaint.get('organizationId')
        c_org_name = complaint.get('organizationName', '').strip().lower()
        if c_org_id not in matching_ids and (not c_org_name or c_org_name not in org_names):
            return jsonify({"error": "Forbidden: You cannot access complaints from another organization"}), 403

    return jsonify(complaint), 200

@complaint_bp.route('/user/<user_id>', methods=['GET'])
def get_user_complaints(user_id):
    req_user_id, user_role, _ = get_auth_context()
    if user_role == 'USER' and req_user_id and req_user_id != user_id:
        return jsonify({"error": "Forbidden: You cannot access other users' complaints"}), 403

    complaints = read_json(COMPLAINTS_FILE)
    user_complaints = [c for c in complaints if c.get('userId') == user_id]
    return jsonify(user_complaints), 200

@complaint_bp.route('/org/<org_id>', methods=['GET'])
def get_org_complaints(org_id):
    _, user_role, req_org_id = get_auth_context()
    if user_role == 'SECONDARY_ADMIN' and req_org_id:
        matching_ids, org_names = get_org_ids_for_org(req_org_id)
        if org_id not in matching_ids:
            return jsonify({"error": "Forbidden: You are not authorized to access another organization's complaints"}), 403

    complaints = read_json(COMPLAINTS_FILE)
    matching_ids, org_names = get_org_ids_for_org(org_id)

    org_complaints = []
    for c in complaints:
        c_org_id = c.get('organizationId')
        c_org_name = c.get('organizationName', '').strip().lower()
        if c_org_id in matching_ids or (c_org_name and c_org_name in org_names):
            org_complaints.append(c)

    return jsonify(org_complaints), 200

@complaint_bp.route('/<complaint_id>/status', methods=['PUT'])
def update_complaint_status(complaint_id):
    data = request.json or {}
    new_status = data.get('status')
    notes = data.get('resolutionNotes', '').strip()
    assigned_to = data.get('assignedTo')
    priority_override = data.get('priority')

    complaints = read_json(COMPLAINTS_FILE)
    target = next((c for c in complaints if c.get('complaintId') == complaint_id), None)
    if not target:
        return jsonify({"error": "Complaint not found"}), 404

    # Authorization and multi-org isolation check
    user_id, user_role, req_org_id = get_auth_context()
    if user_role == 'SECONDARY_ADMIN' and req_org_id:
        matching_ids, org_names = get_org_ids_for_org(req_org_id)
        c_org_id = target.get('organizationId')
        c_org_name = target.get('organizationName', '').strip().lower()
        if c_org_id not in matching_ids and (not c_org_name or c_org_name not in org_names):
            return jsonify({"error": "Forbidden: You cannot modify complaints belonging to another organization"}), 403

    # Users can only reopen their own resolved complaints, not arbitrarily change statuses
    if user_role == 'USER':
        if target.get('userId') != user_id:
            return jsonify({"error": "Forbidden: You cannot modify another user's complaint"}), 403
        if new_status not in ['Reopened', 'Pending']:
            return jsonify({"error": "Users can only reopen complaints or leave them pending"}), 403

    valid_statuses = ['Pending', 'Seen', 'In Progress', 'Assigned', 'Resolved', 'Rejected', 'Reopened']
    if new_status and new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

    if new_status:
        target['status'] = new_status
    if notes:
        target['resolutionNotes'] = notes
    if assigned_to:
        target['assignedTo'] = assigned_to
    if priority_override:
        target['priority'] = priority_override.capitalize()

    target['updatedDate'] = get_current_date()
    target['updatedTime'] = get_current_time()

    write_json(COMPLAINTS_FILE, complaints)

    # Notify the user
    c_user_id = target.get('userId')
    if c_user_id:
        msg = f"Your complaint ({target.get('complaintId')}) status changed to '{target.get('status')}'."
        if notes:
            msg += f" Note: {notes}"
        add_notification(c_user_id, msg, "SUCCESS" if target.get('status') == 'Resolved' else "INFO")

    return jsonify({"message": "Complaint status updated", "complaint": target}), 200

@complaint_bp.route('/<complaint_id>/resolve', methods=['PUT'])
def resolve_complaint(complaint_id):
    data = request.json or {}
    notes = data.get('resolutionNotes', 'Resolved by organization')

    complaints = read_json(COMPLAINTS_FILE)
    target = next((c for c in complaints if c.get('complaintId') == complaint_id), None)
    if not target:
        return jsonify({"error": "Complaint not found"}), 404

    # Security check: org isolation
    user_id, user_role, req_org_id = get_auth_context()
    if user_role == 'SECONDARY_ADMIN' and req_org_id:
        matching_ids, org_names = get_org_ids_for_org(req_org_id)
        c_org_id = target.get('organizationId')
        c_org_name = target.get('organizationName', '').strip().lower()
        if c_org_id not in matching_ids and (not c_org_name or c_org_name not in org_names):
            return jsonify({"error": "Forbidden: You cannot resolve complaints belonging to another organization"}), 403

    target['status'] = 'Resolved'
    target['resolutionNotes'] = notes
    target['resolvedDate'] = get_current_date()
    target['resolvedTime'] = get_current_time()

    write_json(COMPLAINTS_FILE, complaints)

    user_id_target = target.get('userId')
    org_id = target.get('organizationId')
    org_name = target.get('organizationName', 'Organization')
    user_name = target.get('userName', 'Resident')

    if user_id_target:
        add_notification(user_id_target, f"Your complaint at {org_name} has been RESOLVED. {notes}", "SUCCESS")
    if org_id:
        add_notification(org_id, f"Complaint from {user_name} marked as RESOLVED.", "SUCCESS")

    return jsonify({"message": "Complaint resolved", "complaint": target}), 200

@complaint_bp.route('/<complaint_id>/acknowledge', methods=['PUT'])
def acknowledge_complaint(complaint_id):
    complaints = read_json(COMPLAINTS_FILE)
    target = next((c for c in complaints if c.get('complaintId') == complaint_id), None)
    if not target:
        return jsonify({"error": "Complaint not found"}), 404

    # Security check: org isolation
    _, user_role, req_org_id = get_auth_context()
    if user_role == 'SECONDARY_ADMIN' and req_org_id:
        matching_ids, org_names = get_org_ids_for_org(req_org_id)
        c_org_id = target.get('organizationId')
        c_org_name = target.get('organizationName', '').strip().lower()
        if c_org_id not in matching_ids and (not c_org_name or c_org_name not in org_names):
            return jsonify({"error": "Forbidden: You cannot modify complaints belonging to another organization"}), 403

    target['status'] = 'In Progress' if target.get('status') == 'Seen' else 'Seen'
    target['updatedDate'] = get_current_date()
    target['updatedTime'] = get_current_time()
    write_json(COMPLAINTS_FILE, complaints)

    user_id = target.get('userId')
    org_name = target.get('organizationName', 'Organization')
    if user_id:
        add_notification(user_id, f"{org_name} marked your complaint as {target['status']}.", "INFO")

    return jsonify({"message": f"Complaint marked as {target['status']}", "complaint": target}), 200

@complaint_bp.route('/<complaint_id>', methods=['DELETE'])
def delete_complaint(complaint_id):
    complaints = read_json(COMPLAINTS_FILE)
    complaint = next((c for c in complaints if c.get('complaintId') == complaint_id), None)

    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404

    user_id, user_role, req_org_id = get_auth_context()

    # User can delete/cancel their own pending complaint or delete resolved/rejected
    if user_role == 'USER':
        if complaint.get('userId') != user_id:
            return jsonify({"error": "Forbidden: You cannot delete another user's complaint"}), 403
        if complaint.get('status') not in ['Pending', 'Resolved', 'Rejected']:
            return jsonify({"error": "In-progress complaints cannot be deleted by complainant"}), 400

    # Org admin can only delete their own org complaints when resolved/rejected
    if user_role == 'SECONDARY_ADMIN':
        matching_ids, org_names = get_org_ids_for_org(req_org_id)
        c_org_id = complaint.get('organizationId')
        c_org_name = complaint.get('organizationName', '').strip().lower()
        if c_org_id not in matching_ids and (not c_org_name or c_org_name not in org_names):
            return jsonify({"error": "Forbidden: You cannot delete complaints from another organization"}), 403
        if complaint.get('status') not in ['Resolved', 'Rejected']:
            return jsonify({"error": "Only resolved or rejected complaints can be deleted"}), 400

    complaints = [c for c in complaints if c.get('complaintId') != complaint_id]
    write_json(COMPLAINTS_FILE, complaints)

    return jsonify({"message": "Complaint deleted successfully"}), 200

@complaint_bp.route('/org/<org_id>/queue', methods=['GET'])
def get_org_priority_queue(org_id):
    _, user_role, req_org_id = get_auth_context()
    if user_role == 'SECONDARY_ADMIN' and req_org_id:
        matching_ids, org_names = get_org_ids_for_org(req_org_id)
        if org_id not in matching_ids:
            return jsonify({"error": "Forbidden: You cannot access the priority queue of another organization"}), 403

    complaints = read_json(COMPLAINTS_FILE)
    matching_ids, org_names = get_org_ids_for_org(org_id)

    org_complaints = []
    for c in complaints:
        c_org_id = c.get('organizationId')
        c_org_name = c.get('organizationName', '').strip().lower()
        if (c_org_id in matching_ids or (c_org_name and c_org_name in org_names)) and c.get('status') != 'Resolved':
            org_complaints.append(c)

    pq = PriorityQueue()
    for c in org_complaints:
        pq.insert(c, c.get('priority', 'Medium'))

    return jsonify(pq.get_all_sorted()), 200

