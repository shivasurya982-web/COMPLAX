from flask import Blueprint, request, jsonify
import os
import pandas as pd
from utils.helpers import read_json, write_json
from utils.id_generator import generate_org_id, generate_dataset_request_id
from config import ORGANIZATIONS_FILE, ADMINS_FILE, PENDING_DATASETS_DIR, DATASET_REQUESTS_FILE

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

    if any(o['name'] == data['organizationName'] for o in orgs):
        return jsonify({"error": "Organization name already exists"}), 400

    org_id = generate_org_id()

    new_org = {
        "organizationId": org_id,
        "name": data['organizationName'],
        "category": data['category'],
        "ownerName": data['ownerFullName'],
        "email": data['email'],
        "phone": data['phone'],
        "address": data['address'],
        "status": "PENDING",
        "datasetStatus": "PENDING"
    }

    new_admin = {
        "userId": org_id, # Use same ID for simplicity
        "fullName": data['ownerFullName'],
        "email": data['email'],
        "password": data['password'],
        "role": "SECONDARY_ADMIN",
        "organizationId": org_id,
        "organizationName": data['organizationName'],
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
