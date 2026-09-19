from flask import Blueprint, request, jsonify
from utils.helpers import read_json, write_json
from utils.validators import validate_email, validate_password
from utils.id_generator import generate_user_id
from config import USERS_FILE, ADMINS_FILE, ORGANIZATIONS_FILE

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/user/register', methods=['POST'])
def register_user():
    data = request.json
    users = read_json(USERS_FILE)

    if any(u['email'] == data['email'] for u in users):
        return jsonify({"error": "Email already exists"}), 400

    orgs = read_json(ORGANIZATIONS_FILE)
    org = next((o for o in orgs if o['organizationId'] == data['organizationId']), None)

    if not org or org['status'] != 'APPROVED':
         return jsonify({"error": "Invalid or unapproved organization"}), 400

    new_user = {
        "userId": generate_user_id(),
        "fullName": data['fullName'],
        "studentResidentId": data['studentResidentId'],
        "email": data['email'],
        "phone": data['phone'],
        "password": data['password'],
        "organizationId": data['organizationId'],
        "organizationName": org['name'],
        "category": org['category'],
        "role": "USER",
        "status": "ACTIVE"
    }

    users.append(new_user)
    write_json(USERS_FILE, users)

    return jsonify({"message": "User registered successfully", "user": new_user}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    requested_role = data.get('requestedRole') # 'USER' or 'SECONDARY_ADMIN'

    # 1. Check Admins Collection (Main Admin & Organizations)
    admins = read_json(ADMINS_FILE)
    admin = next((a for a in admins if a['email'] == email and a['password'] == password), None)

    if admin:
        # MAIN_ADMIN can login from ANY tab
        if admin['role'] == 'MAIN_ADMIN':
            return jsonify({"message": "Login successful", "user": admin}), 200

        # Organizations (SECONDARY_ADMIN) MUST use Organization tab AND be APPROVED
        if admin['role'] == 'SECONDARY_ADMIN':
            if requested_role != 'SECONDARY_ADMIN':
                return jsonify({"error": "Organization accounts must login through the Organization tab"}), 403

            if admin.get('status') != 'APPROVED':
                return jsonify({"error": "Your organization is pending approval or suspended. Please contact the platform admin."}), 403

            return jsonify({"message": "Login successful", "user": admin}), 200

    # 2. Check Users Collection
    users = read_json(USERS_FILE)
    user = next((u for u in users if u['email'] == email and u['password'] == password), None)

    if user:
        # Normal Users MUST use the User tab
        if requested_role != 'USER':
            return jsonify({"error": "User accounts must login through the User tab"}), 403

        if user.get('status') == 'SUSPENDED':
            return jsonify({"error": "Your account has been suspended. Please contact the administrator."}), 403

        return jsonify({"message": "Login successful", "user": user}), 200

    return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/profile/update', methods=['POST'])
def update_profile():
    data = request.json
    user_id = data.get('userId')
    role = data.get('role')

    if role == 'USER':
        users = read_json(USERS_FILE)
        updated = False
        for u in users:
            if u['userId'] == user_id:
                u['fullName'] = data.get('fullName', u['fullName'])
                u['phone'] = data.get('phone', u['phone'])
                if 'password' in data and data['password']:
                    u['password'] = data['password']
                updated = True
                user_data = u
                break
        if updated:
            write_json(USERS_FILE, users)
            return jsonify({"message": "Profile updated successfully", "user": user_data}), 200
        return jsonify({"error": "User not found"}), 404

    elif role == 'SECONDARY_ADMIN':
        from utils.helpers import db, get_current_date, get_current_time
        import uuid
        # Secondary Admins (Organizations) submit a request
        requests_col = db['profile_update_requests']
        requests_col.insert_one({
            "requestId": str(uuid.uuid4()),
            "organizationId": user_id,
            "organizationName": data.get('organizationName'),
            "ownerName": data.get('fullName'),
            "email": data.get('email'),
            "phone": data.get('phone'),
            "address": data.get('address'),
            "password": data.get('password'),
            "status": "PENDING",
            "date": get_current_date(),
            "time": get_current_time()
        })

        # Notify Main Admin
        from notification_utils import add_notification
        add_notification("ADM-001", f"New profile update request from organization {data.get('organizationName')}.", "INFO")

        return jsonify({"message": "Update request submitted. Waiting for admin approval."}), 200

    return jsonify({"error": "Invalid role"}), 400

@auth_bp.route('/profile/requests', methods=['GET'])
def get_profile_requests():
    from utils.helpers import db
    requests = list(db['profile_update_requests'].find({"status": "PENDING"}, {'_id': 0}))
    return jsonify(requests), 200

@auth_bp.route('/profile/requests/approve', methods=['POST'])
def approve_profile_request():
    from utils.helpers import db
    data = request.json
    request_id = data.get('requestId')

    req = db['profile_update_requests'].find_one({"requestId": request_id})
    if not req:
        return jsonify({"error": "Request not found"}), 404

    org_id = req['organizationId']

    # Update Admin collection
    admins = read_json(ADMINS_FILE)
    for a in admins:
        if a.get('organizationId') == org_id:
            a['fullName'] = req['ownerName']
            a['email'] = req['email']
            if req['password']: a['password'] = req['password']
            break
    write_json(ADMINS_FILE, admins)

    # Update Organization collection
    orgs = read_json(ORGANIZATIONS_FILE)
    for o in orgs:
        if o['organizationId'] == org_id:
            o['ownerName'] = req['ownerName']
            o['email'] = req['email']
            o['phone'] = req['phone']
            o['address'] = req['address']
            break
    write_json(ORGANIZATIONS_FILE, orgs)

    # Mark request as approved
    db['profile_update_requests'].update_one({"requestId": request_id}, {"$set": {"status": "APPROVED"}})

    # Notify Org Admin
    from notification_utils import add_notification
    add_notification(org_id, "Your profile update request has been APPROVED.", "SUCCESS")

    return jsonify({"message": "Profile update approved"}), 200

@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    users = read_json(USERS_FILE)
    return jsonify(users), 200

@auth_bp.route('/users/suspend', methods=['POST'])
def suspend_user():
    data = request.json
    user_id = data.get('userId')
    users = read_json(USERS_FILE)
    for u in users:
        if u['userId'] == user_id:
            u['status'] = 'SUSPENDED'
            break
    write_json(USERS_FILE, users)
    return jsonify({"message": "User suspended successfully"}), 200

@auth_bp.route('/users/activate', methods=['POST'])
def activate_user():
    data = request.json
    user_id = data.get('userId')
    users = read_json(USERS_FILE)
    for u in users:
        if u['userId'] == user_id:
            u['status'] = 'ACTIVE'
            break
    write_json(USERS_FILE, users)
    return jsonify({"message": "User activated successfully"}), 200

@auth_bp.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    users = read_json(USERS_FILE)
    users = [u for u in users if u['userId'] != user_id]
    write_json(USERS_FILE, users)
    return jsonify({"message": "User deleted successfully"}), 200

@auth_bp.route('/user/login', methods=['POST'])
def login_user():
    return login()

@auth_bp.route('/secondary-admin/login', methods=['POST'])
def login_secondary_admin():
    return login()

@auth_bp.route('/main-admin/login', methods=['POST'])
def login_main_admin():
    return login()
