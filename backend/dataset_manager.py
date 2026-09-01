import pandas as pd
import os
import random
from flask import Blueprint, request, jsonify
from utils.helpers import read_json, write_json
from config import DATASET_REQUESTS_FILE, PENDING_DATASETS_DIR, APPROVED_DATASETS_DIR, ORGANIZATIONS_FILE

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

@dataset_bp.route('/approve', methods=['POST'])
def approve_dataset():
    data = request.json
    req_id = data['requestId']

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

            # Train organization specific model
            from ml_model import MLModel
            model = MLModel(org_id)
            model.train(dest)

        write_json(DATASET_REQUESTS_FILE, requests)
        return jsonify({"message": "Dataset approved and model trained"}), 200

    return jsonify({"error": "Request not found"}), 404

@dataset_bp.route('/main/content', methods=['GET'])
def get_main_dataset_content():
    if not os.path.exists(DATASET_PATH):
        generate_initial_dataset()

    df = pd.read_csv(DATASET_PATH)
    data = df.to_dict(orient='records')
    return jsonify(data), 200

@dataset_bp.route('/main/content', methods=['POST'])
def update_main_dataset_content():
    data = request.json
    df = pd.DataFrame(data)
    df.to_csv(DATASET_PATH, index=False)

    # Retrain default model
    from ml_model import MLModel
    model = MLModel('default')
    model.train(DATASET_PATH)

    return jsonify({"message": "Main dataset updated and model retrained", "rows": len(df)}), 200

@dataset_bp.route('/<req_id>/content', methods=['GET'])
def get_dataset_content(req_id):
    requests = read_json(DATASET_REQUESTS_FILE)
    req = next((r for r in requests if r['requestId'] == req_id), None)

    if not req:
        return jsonify({"error": "Request not found"}), 404

    org_id = req['organizationId']

    # Determine path based on status
    if req['status'] == 'APPROVED':
        path = os.path.join(APPROVED_DATASETS_DIR, f"{org_id}.csv")
    else:
        path = os.path.join(PENDING_DATASETS_DIR, req['datasetName'])

    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404

    df = pd.read_csv(path)
    # Return all rows for editing
    data = df.to_dict(orient='records')
    return jsonify(data), 200

@dataset_bp.route('/<req_id>/content', methods=['POST'])
def update_dataset_content(req_id):
    data = request.json # Expecting list of {complaint, priority}
    requests = read_json(DATASET_REQUESTS_FILE)
    req = next((r for r in requests if r['requestId'] == req_id), None)

    if not req:
        return jsonify({"error": "Request not found"}), 404

    org_id = req['organizationId']

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
        from ml_model import MLModel
        model = MLModel(org_id)
        model.train(path)

    return jsonify({"message": "Dataset updated successfully", "rows": len(df)}), 200

@dataset_bp.route('/reject', methods=['POST'])
def reject_dataset():
    data = request.json
    req_id = data['requestId']

    requests = read_json(DATASET_REQUESTS_FILE)
    for r in requests:
        if r['requestId'] == req_id:
            r['status'] = 'REJECTED'
            break
    write_json(DATASET_REQUESTS_FILE, requests)
    return jsonify({"message": "Dataset rejected"}), 200
