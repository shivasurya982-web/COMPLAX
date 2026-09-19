from flask import Blueprint, request, jsonify
from utils.helpers import read_json, write_json, get_current_date, get_current_time
from utils.id_generator import generate_complaint_id
from config import COMPLAINTS_FILE
from ml_model import get_model_for_org
from dsa import PriorityQueue
from notification_utils import add_notification

complaint_bp = Blueprint('complaint', __name__)

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
        "organizationName": data['organizationName'],
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
    user_complaints = [c for c in complaints if c['userId'] == user_id]
    return jsonify(user_complaints), 200

@complaint_bp.route('/org/<org_id>', methods=['GET'])
def get_org_complaints(org_id):
    complaints = read_json(COMPLAINTS_FILE)
    org_complaints = [c for c in complaints if c['organizationId'] == org_id]
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
    org_complaints = [c for c in complaints if c['organizationId'] == org_id and c['status'] != 'Resolved']

    pq = PriorityQueue()
    for c in org_complaints:
        pq.insert(c, c['priority'])

    return jsonify(pq.get_all_sorted()), 200
