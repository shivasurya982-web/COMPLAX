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

@complaint_bp.route('', methods=['POST'])
def submit_complaint():
    # In a real app, we'd get user info from a token
    # For this project, we assume frontend sends it or we mock it
    data = request.json

    complaint_text = data['complaint']
    org_id = data['organizationId']

    # ML Prediction
    model = get_model_for_org(org_id)
    priority, confidence = model.predict(complaint_text)

    new_complaint = {
        "complaintId": generate_complaint_id(),
        "userId": data['userId'],
        "userName": data['userName'],
        "userPhone": data.get('userPhone', ''),
        "organizationId": org_id,
        "organizationName": data['organizationName'].strip() if data.get('organizationName') else '',
        "category": data['category'],
        "locationDetails": data.get('locationDetails', ''), # New field for Room No / Flat No
        "complaint": complaint_text,
        "date": get_current_date(),
        "time": get_current_time(),
        "priority": priority,
        "confidence": confidence,
        "status": "Analyzed"
    }

    complaints = read_json(COMPLAINTS_FILE)
    complaints.append(new_complaint)
    write_json(COMPLAINTS_FILE, complaints)

    # Notify Organization Admin
    add_notification(org_id, f"New {priority} priority complaint received from {data['userName']}.", "WARNING" if priority == "HIGH" else "INFO")

    return jsonify(new_complaint), 201

@complaint_bp.route('/user/<user_id>', methods=['GET'])
def get_user_complaints(user_id):
    complaints = read_json(COMPLAINTS_FILE)
    user_complaints = [c for c in complaints if c.get('userId') == user_id]
    return jsonify(user_complaints), 200

@complaint_bp.route('/org/<org_id>', methods=['GET'])
def get_org_complaints(org_id):
    complaints = read_json(COMPLAINTS_FILE)
    matching_ids, org_names = get_org_ids_for_org(org_id)

    org_complaints = []
    for c in complaints:
        c_org_id = c.get('organizationId')
        c_org_name = c.get('organizationName', '').strip().lower()
        if c_org_id in matching_ids or (c_org_name and c_org_name in org_names):
            org_complaints.append(c)

    return jsonify(org_complaints), 200

@complaint_bp.route('/<complaint_id>/resolve', methods=['PUT'])
def resolve_complaint(complaint_id):
    complaints = read_json(COMPLAINTS_FILE)
    user_id = None
    org_id = None
    org_name = ""
    user_name = ""
    for c in complaints:
        if c['complaintId'] == complaint_id:
            c['status'] = 'Resolved'
            user_id = c['userId']
            org_id = c['organizationId']
            org_name = c['organizationName']
            user_name = c['userName']
            break
    write_json(COMPLAINTS_FILE, complaints)

    if user_id:
        # Notify the user
        add_notification(user_id, f"Your complaint at {org_name} has been RESOLVED.", "SUCCESS")
        # Notify the organization admin
        add_notification(org_id, f"Complaint from {user_name} has been marked as RESOLVED.", "SUCCESS")

    return jsonify({"message": "Complaint resolved"}), 200

@complaint_bp.route('/<complaint_id>/acknowledge', methods=['PUT'])
def acknowledge_complaint(complaint_id):
    complaints = read_json(COMPLAINTS_FILE)
    user_id = None
    org_name = ""
    for c in complaints:
        if c['complaintId'] == complaint_id:
            c['status'] = 'Seen'
            user_id = c['userId']
            org_name = c['organizationName']
            break
    write_json(COMPLAINTS_FILE, complaints)

    if user_id:
        add_notification(user_id, f"{org_name} has NOTICED your complaint.", "INFO")

    return jsonify({"message": "Complaint acknowledged"}), 200

@complaint_bp.route('/<complaint_id>', methods=['DELETE'])
def delete_complaint(complaint_id):
    complaints = read_json(COMPLAINTS_FILE)

    # Find the complaint
    complaint = next((c for c in complaints if c['complaintId'] == complaint_id), None)

    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404

    # User requested: "after resolved my complaint i want to delete the my complaint"
    # So we check if it is resolved
    if complaint['status'] != 'Resolved':
        return jsonify({"error": "Only resolved complaints can be deleted"}), 400

    # Remove it
    complaints = [c for c in complaints if c['complaintId'] != complaint_id]
    write_json(COMPLAINTS_FILE, complaints)

    return jsonify({"message": "Complaint deleted successfully"}), 200

@complaint_bp.route('/org/<org_id>/queue', methods=['GET'])
def get_org_priority_queue(org_id):
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
        pq.insert(c, c['priority'])

    return jsonify(pq.get_all_sorted()), 200
