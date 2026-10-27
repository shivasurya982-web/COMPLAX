import pandas as pd
import os
import random
from flask import Blueprint, request, jsonify, send_file
from utils.helpers import read_json, write_json
from utils.id_generator import generate_dataset_request_id
from config import DATASET_REQUESTS_FILE, PENDING_DATASETS_DIR, APPROVED_DATASETS_DIR, ORGANIZATIONS_FILE
from notification_utils import add_notification

dataset_bp = Blueprint('dataset', __name__)

DATASET_PATH = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'complaint_priority_dataset.csv')

def generate_initial_dataset():
    if os.path.exists(DATASET_PATH):
        return

    os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)

    complaints_data = {
        "High": [
            "Fire alarm is not working in Block A",
            "Major water pipe has burst in the parking area",
            "Electrical short circuit in room 302",
            "Lift is stuck between 4th and 5th floor with people inside",
            "No water supply in the entire hostel building",
            "Main electrical panel is sparking and smelling like burnt plastic",
            "Security gate is broken and unauthorized people are entering",
            "Severe gas leak detected in the kitchen",
            "Ceiling slab fell in the common room",
            "Medical emergency, ambulance access blocked",
            "Transformer blast near office building",
            "Flood in the basement storage",
            "Elevator cable making strange noise and vibrating heavily",
            "Total power outage in the ICU wing",
            "Fire extinguisher is empty and fire started in trash bin"
        ],
        "Medium": [
            "Room fan is not working since morning",
            "Bathroom tap is leaking continuously",
            "WiFi is unstable in the library area",
            "Tube light is damaged in the hallway",
            "Door lock is difficult to operate and needs oiling",
            "AC is not cooling properly in the conference room",
            "Kitchen sink is clogged",
            "Window pane is cracked",
            "Pest problem in the cafeteria",
            "Intercom not working in flat 102",
            "Water heater not working in bathroom 2",
            "Printer is jammed in the office",
            "Carpeting is torn and causing tripping hazard",
            "Staircase lighting is very dim",
            "Gym equipment is broken"
        ],
        "Low": [
            "Room cleaning required for room 205",
            "Garbage has not been collected from the lobby",
            "Common area needs cleaning after the event",
            "Minor furniture damage on the study table",
            "Light brightness is low in the balcony",
            "Curtains need washing",
            "Garden grass needs cutting",
            "Wall paint is peeling off in the corner",
            "Clock in the lobby is showing wrong time",
            "Water cooler needs refilling",
            "Notice board is messy",
            "Plants in the office need watering",
            "Dust on the server racks",
            "Bicycle stand is disorganized",
            "Empty water bottles scattered in the parking"
        ]
    }

    dataset = []
    for _ in range(500):
        priority = random.choice(["High", "Medium", "Low"])
        complaint = random.choice(complaints_data[priority])
        variation = random.choice(["", " urgently.", " please fix.", " immediately.", " needs attention.", " ASAP."])
        dataset.append({"complaint": complaint + variation, "priority": priority})

    df = pd.DataFrame(dataset)
    df.to_csv(DATASET_PATH, index=False)
    print(f"Dataset generated at {DATASET_PATH}")

def load_dataset(path=DATASET_PATH):
    if os.path.exists(path):
        df = pd.read_csv(path)
        if 'complaint' in df.columns and 'priority' in df.columns:
            return df
        else:
            print("Existing dataset has wrong format. Regenerating...")
            os.remove(path)

    generate_initial_dataset()
    return pd.read_csv(path)

@dataset_bp.route('', methods=['GET'])
def get_all_datasets():
    requests = read_json(DATASET_REQUESTS_FILE)
    return jsonify(requests), 200

@dataset_bp.route('/pending', methods=['GET'])
def get_pending_datasets():
    requests = read_json(DATASET_REQUESTS_FILE)
    return jsonify([r for r in requests if r['status'] == 'PENDING']), 200

def get_auth_role_and_org():
    return request.headers.get('X-User-Role'), request.headers.get('X-Organization-Id')

@dataset_bp.route('/upload', methods=['POST'])
def upload_org_dataset():
    dataset_file = request.files.get('dataset')
    org_id = request.form.get('organizationId')
    org_name = request.form.get('organizationName', '')
    category = request.form.get('category', '')

    if not dataset_file:
        return jsonify({"error": "CSV dataset file is required"}), 400

    if not org_id:
        return jsonify({"error": "Organization ID is required"}), 400

    role, req_org = get_auth_role_and_org()
    if role == 'SECONDARY_ADMIN' and req_org and req_org != org_id:
        return jsonify({"error": "Forbidden: You cannot upload datasets for another organization"}), 403

    os.makedirs(PENDING_DATASETS_DIR, exist_ok=True)
    dataset_path = os.path.join(PENDING_DATASETS_DIR, f"{org_id}.csv")
    dataset_file.save(dataset_path)

    # Read CSV to validate structure and count rows
    try:
        df = pd.read_csv(dataset_path)
        cols_lower = [str(c).strip().lower() for c in df.columns]
        if 'complaint' not in cols_lower or 'priority' not in cols_lower:
            if os.path.exists(dataset_path):
                os.remove(dataset_path)
            return jsonify({"error": "Invalid CSV format. File must contain 'complaint' and 'priority' columns."}), 400
    except Exception as e:
        if os.path.exists(dataset_path):
            os.remove(dataset_path)
        return jsonify({"error": f"Failed to parse CSV file: {str(e)}"}), 400

    requests = read_json(DATASET_REQUESTS_FILE)
    existing_req = next((r for r in requests if r.get('organizationId') == org_id), None)

    req_id = existing_req['requestId'] if existing_req else generate_dataset_request_id()

    new_req_data = {
        "requestId": req_id,
        "organizationId": org_id,
        "organizationName": org_name,
        "category": category,
        "datasetName": f"{org_id}.csv",
        "rows": len(df),
        "columns": list(df.columns),
        "status": "PENDING"
    }

    if existing_req:
        requests = [r if r.get('organizationId') != org_id else new_req_data for r in requests]
    else:
        requests.append(new_req_data)

    write_json(DATASET_REQUESTS_FILE, requests)

    # Update organization dataset status
    orgs = read_json(ORGANIZATIONS_FILE)
    for o in orgs:
        if o.get('organizationId') == org_id:
            o['datasetStatus'] = 'PENDING'
            break
    write_json(ORGANIZATIONS_FILE, orgs)

    # Notify Main Admin
    add_notification("ADM-001", f"New dataset approval request from {org_name}.", "INFO")

    return jsonify({"message": "Dataset uploaded successfully! Waiting for admin approval.", "request": new_req_data}), 200

@dataset_bp.route('/approve', methods=['POST'])
def approve_dataset():
    role, _ = get_auth_role_and_org()
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform administrators can approve datasets"}), 403

    data = request.json or {}
    req_id = data.get('requestId')

    requests = read_json(DATASET_REQUESTS_FILE)
    req = next((r for r in requests if r['requestId'] == req_id), None)

    if req:
        req['status'] = 'APPROVED'
        org_id = req['organizationId']

        # Move file from pending to approved
        os.makedirs(APPROVED_DATASETS_DIR, exist_ok=True)
        src = os.path.join(PENDING_DATASETS_DIR, req['datasetName'])
        dest = os.path.join(APPROVED_DATASETS_DIR, f"{org_id}.csv")

        if os.path.exists(src):
            import shutil
            shutil.copy(src, dest)

            # Update organization dataset status
            orgs = read_json(ORGANIZATIONS_FILE)
            for o in orgs:
                if o['organizationId'] == org_id:
                    o['datasetStatus'] = 'APPROVED'
                    break
            write_json(ORGANIZATIONS_FILE, orgs)

            # Train organization specific model and update memory cache
            from ml_model import MLModel, MODEL_CACHE
            model = MLModel(org_id)
            model.train(dest)
            MODEL_CACHE[org_id] = model

            # Refresh live complaint suggestions index
            try:
                from suggestion_service import get_suggestion_service
                get_suggestion_service(force_reload=True)
            except Exception as e:
                print(f"[COMPLAX] Error refreshing suggestion service index: {e}")

            # Notify Organization Admin
            add_notification(org_id, "Your organization's dataset has been APPROVED and custom model training is complete.", "SUCCESS")

        write_json(DATASET_REQUESTS_FILE, requests)
        return jsonify({"message": "Dataset approved and model trained"}), 200

    return jsonify({"error": "Request not found"}), 404

@dataset_bp.route('/main/download', methods=['GET'])
def download_main_dataset():
    if not os.path.exists(DATASET_PATH):
        generate_initial_dataset()
    return send_file(DATASET_PATH, as_attachment=True, download_name="global_main_dataset.csv", mimetype="text/csv")

@dataset_bp.route('/<req_id>/download', methods=['GET'])
def download_dataset_file(req_id):
    requests = read_json(DATASET_REQUESTS_FILE)
    req = next((r for r in requests if r['requestId'] == req_id), None)

    if not req:
        return jsonify({"error": "Request not found"}), 404

    org_id = req['organizationId']
    role, req_org = get_auth_role_and_org()
    if role == 'SECONDARY_ADMIN' and req_org and req_org != org_id:
        return jsonify({"error": "Forbidden: You cannot access datasets from another organization"}), 403

    if req['status'] == 'APPROVED':
        path = os.path.join(APPROVED_DATASETS_DIR, f"{org_id}.csv")
    else:
        path = os.path.join(PENDING_DATASETS_DIR, req['datasetName'])

    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404

    download_name = f"{req.get('organizationName', org_id)}_dataset.csv".replace(' ', '_').lower()
    return send_file(path, as_attachment=True, download_name=download_name, mimetype="text/csv")

@dataset_bp.route('/main/content', methods=['GET'])
def get_main_dataset_content():
    if not os.path.exists(DATASET_PATH):
        generate_initial_dataset()

    df = pd.read_csv(DATASET_PATH)
    total_rows = len(df)

    include_stats = request.args.get('stats', 'false').lower() == 'true'
    stats = {}
    if include_stats and 'priority' in df.columns:
        p_counts = df['priority'].str.upper().value_counts().to_dict()
        stats = {
            'total': total_rows,
            'high': int(p_counts.get('HIGH', 0)),
            'medium': int(p_counts.get('MEDIUM', 0)),
            'low': int(p_counts.get('LOW', 0))
        }

    limit = request.args.get('limit', type=int)
    if limit and limit > 0:
        df_return = df.head(limit)
    elif limit != -1 and total_rows > 2000:
        # Default safety cap for browser UI to prevent Out of Memory crash
        df_return = df.head(2000)
    else:
        df_return = df

    data = df_return.to_dict(orient='records')

    if include_stats:
        return jsonify({"data": data, "stats": stats, "totalRows": total_rows}), 200

    return jsonify(data), 200

@dataset_bp.route('/main/content', methods=['POST'])
def update_main_dataset_content():
    role, _ = get_auth_role_and_org()
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform administrators can edit the global dataset"}), 403

    data = request.json
    df = pd.DataFrame(data)
    df.to_csv(DATASET_PATH, index=False)

    # Retrain default model
    from ml_model import MLModel, MODEL_CACHE
    model = MLModel('default')
    model.train(DATASET_PATH)
    MODEL_CACHE['default'] = model

    try:
        from suggestion_service import get_suggestion_service
        get_suggestion_service(force_reload=True)
    except Exception:
        pass

    return jsonify({"message": "Main dataset updated and model retrained", "rows": len(df)}), 200

@dataset_bp.route('/<req_id>/content', methods=['GET'])
def get_dataset_content(req_id):
    requests = read_json(DATASET_REQUESTS_FILE)
    req = next((r for r in requests if r['requestId'] == req_id), None)

    if not req:
        return jsonify({"error": "Request not found"}), 404

    org_id = req['organizationId']
    role, req_org = get_auth_role_and_org()
    if role == 'SECONDARY_ADMIN' and req_org and req_org != org_id:
        return jsonify({"error": "Forbidden: You cannot access datasets from another organization"}), 403

    # Determine path based on status
    if req['status'] == 'APPROVED':
        path = os.path.join(APPROVED_DATASETS_DIR, f"{org_id}.csv")
    else:
        path = os.path.join(PENDING_DATASETS_DIR, req['datasetName'])

    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404

    df = pd.read_csv(path)
    total_rows = len(df)

    include_stats = request.args.get('stats', 'false').lower() == 'true'
    stats = {}
    if include_stats and 'priority' in df.columns:
        p_counts = df['priority'].str.upper().value_counts().to_dict()
        stats = {
            'total': total_rows,
            'high': int(p_counts.get('HIGH', 0)),
            'medium': int(p_counts.get('MEDIUM', 0)),
            'low': int(p_counts.get('LOW', 0))
        }

    limit = request.args.get('limit', type=int)
    if limit and limit > 0:
        df_return = df.head(limit)
    elif limit != -1 and total_rows > 2000:
        # Default safety cap for browser UI to prevent Out of Memory crash
        df_return = df.head(2000)
    else:
        df_return = df

    data = df_return.to_dict(orient='records')

    if include_stats:
        return jsonify({"data": data, "stats": stats, "totalRows": total_rows}), 200

    return jsonify(data), 200

@dataset_bp.route('/<req_id>/content', methods=['POST'])
def update_dataset_content(req_id):
    data = request.json # Expecting list of {complaint, priority}
    requests = read_json(DATASET_REQUESTS_FILE)
    req = next((r for r in requests if r['requestId'] == req_id), None)

    if not req:
        return jsonify({"error": "Request not found"}), 404

    org_id = req['organizationId']
    role, req_org = get_auth_role_and_org()
    if role == 'SECONDARY_ADMIN' and req_org and req_org != org_id:
        return jsonify({"error": "Forbidden: You cannot modify datasets of another organization"}), 403

    # Determine path based on status
    if req['status'] == 'APPROVED':
        path = os.path.join(APPROVED_DATASETS_DIR, f"{org_id}.csv")
    else:
        path = os.path.join(PENDING_DATASETS_DIR, req['datasetName'])

    df = pd.DataFrame(data)
    df.to_csv(path, index=False)

    # Update row count in request
    req['rows'] = len(df)
    write_json(DATASET_REQUESTS_FILE, requests)

    # If approved, retrain model
    if req['status'] == 'APPROVED':
        from ml_model import MLModel, MODEL_CACHE
        model = MLModel(org_id)
        model.train(path)
        MODEL_CACHE[org_id] = model

        try:
            from suggestion_service import get_suggestion_service
            get_suggestion_service(force_reload=True)
        except Exception:
            pass

    return jsonify({"message": "Dataset updated successfully", "rows": len(df)}), 200

@dataset_bp.route('/reject', methods=['POST'])
def reject_dataset():
    role, _ = get_auth_role_and_org()
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform administrators can reject datasets"}), 403

    data = request.json or {}
    req_id = data.get('requestId')

    requests = read_json(DATASET_REQUESTS_FILE)
    for r in requests:
        if r['requestId'] == req_id:
            r['status'] = 'REJECTED'
            break
    write_json(DATASET_REQUESTS_FILE, requests)
    return jsonify({"message": "Dataset rejected"}), 200
