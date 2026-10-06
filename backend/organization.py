from flask import Blueprint, request, jsonify
import os
import pandas as pd
from utils.helpers import read_json, write_json
from utils.id_generator import generate_org_id, generate_dataset_request_id
from config import ORGANIZATIONS_FILE, ADMINS_FILE, PENDING_DATASETS_DIR, DATASET_REQUESTS_FILE
from notification_utils import add_notification

org_bp = Blueprint('organization', __name__)

@org_bp.route('', methods=['GET'])
def get_organizations():
    orgs = read_json(ORGANIZATIONS_FILE)
    return jsonify(orgs), 200

@org_bp.route('/approved', methods=['GET'])
def get_approved_organizations():
    orgs = read_json(ORGANIZATIONS_FILE)
    approved = [o for o in orgs if o['status'] == 'APPROVED']
    return jsonify(approved), 200

@org_bp.route('/register', methods=['POST'])
def register_org():
    # Multi-part form for dataset upload
    data = request.form
    dataset = request.files.get('dataset')

    orgs = read_json(ORGANIZATIONS_FILE)
    admins = read_json(ADMINS_FILE)

    org_name = data['organizationName'].strip()

    if any(o['name'].strip().lower() == org_name.lower() for o in orgs):
        return jsonify({"error": "Organization name already exists"}), 400

    org_id = generate_org_id()

    new_org = {
        "organizationId": org_id,
        "name": org_name,
        "category": data['category'],
        "ownerName": data['ownerFullName'],
        "email": data['email'].strip(),
        "phone": data['phone'],
        "address": data['address'],
        "status": "PENDING",
        "datasetStatus": "PENDING"
    }

    new_admin = {
        "userId": org_id, # Use same ID for simplicity
        "fullName": data['ownerFullName'],
        "email": data['email'].strip(),
        "password": data['password'],
        "recoveryHint": data.get('recoveryHint', ''),
        "role": "SECONDARY_ADMIN",
        "organizationId": org_id,
        "organizationName": org_name,
        "category": data['category'],
        "status": "PENDING"
    }

    if dataset:
        os.makedirs(PENDING_DATASETS_DIR, exist_ok=True)
        dataset_path = os.path.join(PENDING_DATASETS_DIR, f"{org_id}.csv")
        dataset.save(dataset_path)

        # Create dataset request
        df = pd.read_csv(dataset_path)
        requests = read_json(DATASET_REQUESTS_FILE)
        requests.append({
            "requestId": generate_dataset_request_id(),
            "organizationId": org_id,
            "organizationName": data['organizationName'],
            "category": data['category'],
            "datasetName": f"{org_id}.csv",
            "rows": len(df),
            "columns": list(df.columns),
            "status": "PENDING"
        })
        write_json(DATASET_REQUESTS_FILE, requests)

    orgs.append(new_org)
    admins.append(new_admin)

    write_json(ORGANIZATIONS_FILE, orgs)
    write_json(ADMINS_FILE, admins)

    # Notify Main Admin
    add_notification("ADM-001", f"New organization registration request from {data['organizationName']}.", "INFO")

    return jsonify({"message": "Registration submitted successfully. Waiting for Main Admin approval."}), 201

@org_bp.route('/approve', methods=['POST'])
def approve_org():
    data = request.json
    org_id = data['organizationId']

    orgs = read_json(ORGANIZATIONS_FILE)
    admins = read_json(ADMINS_FILE)

    for o in orgs:
        if o['organizationId'] == org_id:
            o['status'] = 'APPROVED'

    for a in admins:
        if a.get('organizationId') == org_id:
            a['status'] = 'APPROVED'

    write_json(ORGANIZATIONS_FILE, orgs)
    write_json(ADMINS_FILE, admins)

    return jsonify({"message": "Organization approved"}), 200

@org_bp.route('/reject', methods=['POST'])
def reject_org():
    data = request.json
    org_id = data['organizationId']

    orgs = read_json(ORGANIZATIONS_FILE)
    orgs = [o for o in orgs if o['organizationId'] != org_id]
    write_json(ORGANIZATIONS_FILE, orgs)

    return jsonify({"message": "Organization rejected"}), 200

@org_bp.route('/suspend', methods=['POST'])
def suspend_org():
    data = request.json
    org_id = data['organizationId']

    orgs = read_json(ORGANIZATIONS_FILE)
    for o in orgs:
        if o['organizationId'] == org_id:
            o['status'] = 'SUSPENDED'

    write_json(ORGANIZATIONS_FILE, orgs)
    return jsonify({"message": "Organization suspended"}), 200

@org_bp.route('/activate', methods=['POST'])
def activate_org():
    data = request.json
    org_id = data['organizationId']

    orgs = read_json(ORGANIZATIONS_FILE)
    for o in orgs:
        if o['organizationId'] == org_id:
            o['status'] = 'APPROVED'

    write_json(ORGANIZATIONS_FILE, orgs)
    return jsonify({"message": "Organization activated"}), 200

@org_bp.route('/<org_id>', methods=['DELETE'])
def delete_org(org_id):
    orgs = read_json(ORGANIZATIONS_FILE)
    admins = read_json(ADMINS_FILE)

    # Filter out the organization and its related admin
    orgs = [o for o in orgs if o['organizationId'] != org_id]
    admins = [a for a in admins if a.get('organizationId') != org_id]

    write_json(ORGANIZATIONS_FILE, orgs)
    write_json(ADMINS_FILE, admins)

    return jsonify({"message": "Organization deleted successfully"}), 200

@org_bp.route('/<org_id>/users', methods=['GET'])
def get_organization_users(org_id):
    from config import USERS_FILE
    users = read_json(USERS_FILE)
    org_users = [u for u in users if u.get('organizationId') == org_id]
    return jsonify(org_users), 200

@org_bp.route('/users/suspend', methods=['POST'])
def suspend_org_user():
    from config import USERS_FILE
    data = request.json or {}
    user_id = data.get('userId')
    org_id = data.get('organizationId')

    users = read_json(USERS_FILE)
    for u in users:
        if u.get('userId') == user_id and u.get('organizationId') == org_id:
            u['status'] = 'SUSPENDED'
            break
    write_json(USERS_FILE, users)
    return jsonify({"message": "User suspended successfully"}), 200

@org_bp.route('/users/activate', methods=['POST'])
def activate_org_user():
    from config import USERS_FILE
    data = request.json or {}
    user_id = data.get('userId')
    org_id = data.get('organizationId')

    users = read_json(USERS_FILE)
    for u in users:
        if u.get('userId') == user_id and u.get('organizationId') == org_id:
            u['status'] = 'ACTIVE'
            break
    write_json(USERS_FILE, users)
    return jsonify({"message": "User activated successfully"}), 200

@org_bp.route('/users/<user_id>', methods=['DELETE'])
def delete_org_user(user_id):
    from config import USERS_FILE
    users = read_json(USERS_FILE)
    users = [u for u in users if u.get('userId') != user_id]
    write_json(USERS_FILE, users)
    return jsonify({"message": "User removed successfully"}), 200

