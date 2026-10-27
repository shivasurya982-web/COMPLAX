from flask import Blueprint, request, jsonify
import uuid
from utils.helpers import (
    read_json,
    write_json,
    read_db,
    write_db,
    update_db,
    hash_password,
    verify_password,
    get_current_date,
    get_current_time
)
from utils.validators import validate_email, validate_password
from utils.id_generator import generate_user_id
from config import USERS_FILE, ADMINS_FILE, ORGANIZATIONS_FILE
from notification_utils import add_notification

auth_bp = Blueprint('auth', __name__)

def sanitize_user(user_dict):
    """Return a safe copy of the user dictionary without password."""
    if not isinstance(user_dict, dict):
        return user_dict
    safe = dict(user_dict)
    safe.pop('password', None)
    return safe

@auth_bp.route('/user/register', methods=['POST'])
def register_user():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    full_name = data.get('fullName', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    org_id = data.get('organizationId')

    if not full_name or not email or not password or not org_id:
        return jsonify({"error": "Full name, email, password, and organization are required"}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email address format"}), 400

    if not validate_password(password):
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    users = read_json(USERS_FILE)

    if any(u.get('email', '').lower() == email for u in users):
        return jsonify({"error": "Email already exists"}), 400

    orgs = read_json(ORGANIZATIONS_FILE)
    org = next((o for o in orgs if o.get('organizationId') == org_id), None)

    if not org or org.get('status') != 'APPROVED':
        return jsonify({"error": "Invalid or unapproved organization"}), 400

    new_user = {
        "userId": generate_user_id(),
        "fullName": full_name,
        "studentResidentId": data.get('studentResidentId', '').strip(),
        "email": email,
        "phone": phone,
        "password": hash_password(password),
        "recoveryHint": data.get('recoveryHint', '').strip(),
        "organizationId": org_id,
        "organizationName": org.get('name', ''),
        "category": org.get('category', ''),
        "role": "USER",
        "status": "ACTIVE"
    }

    users.append(new_user)
    write_json(USERS_FILE, users)

    return jsonify({"message": "User registered successfully", "user": sanitize_user(new_user)}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    requested_role = data.get('requestedRole') # 'USER' or 'SECONDARY_ADMIN'

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # 1. Check Admins Collection (Main Admin & Organizations)
    admins = read_json(ADMINS_FILE)
    admin = next((a for a in admins if a.get('email', '').strip().lower() == email), None)

    if admin and verify_password(admin.get('password'), password):
        # MAIN_ADMIN can login from ANY tab
        if admin.get('role') == 'MAIN_ADMIN':
            return jsonify({"message": "Login successful", "user": sanitize_user(admin)}), 200

        # Organizations (SECONDARY_ADMIN) MUST use Organization tab AND be APPROVED
        if admin.get('role') == 'SECONDARY_ADMIN':
            if requested_role != 'SECONDARY_ADMIN':
                return jsonify({"error": "Organization accounts must login through the Organization tab"}), 403

            if admin.get('status') != 'APPROVED':
                return jsonify({"error": "Your organization is pending approval or suspended. Please contact the platform admin."}), 403

            return jsonify({"message": "Login successful", "user": sanitize_user(admin)}), 200

    # 2. Check Users Collection
    users = read_json(USERS_FILE)
    user = next((u for u in users if u.get('email', '').strip().lower() == email), None)

    if user and verify_password(user.get('password'), password):
        # Normal Users MUST use the User tab
        if requested_role != 'USER':
            return jsonify({"error": "User accounts must login through the User tab"}), 403

        if user.get('status') == 'SUSPENDED':
            return jsonify({"error": "Your account has been suspended. Please contact the administrator."}), 403

        return jsonify({"message": "Login successful", "user": sanitize_user(user)}), 200

    return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/profile/update', methods=['POST'])
def update_profile():
    data = request.json or {}
    user_id = data.get('userId')
    role = data.get('role')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    if role == 'USER':
        users = read_json(USERS_FILE)
        updated = False
        user_data = None
        for u in users:
            if u.get('userId') == user_id:
                if 'fullName' in data and data['fullName']:
                    u['fullName'] = data['fullName'].strip()
                if 'phone' in data and data['phone']:
                    u['phone'] = data['phone'].strip()
                if 'recoveryHint' in data:
                    u['recoveryHint'] = data['recoveryHint'].strip()
                if 'password' in data and data['password']:
                    u['password'] = hash_password(data['password'])
                updated = True
                user_data = sanitize_user(u)
                break
        if updated:
            write_json(USERS_FILE, users)
            return jsonify({"message": "Profile updated successfully", "user": user_data}), 200
        return jsonify({"error": "User not found"}), 404

    elif role == 'SECONDARY_ADMIN':
        admins = read_json(ADMINS_FILE)
        for a in admins:
            if a.get('organizationId') == user_id or a.get('userId') == user_id:
                if 'recoveryHint' in data:
                    a['recoveryHint'] = data['recoveryHint'].strip()
                break
        write_json(ADMINS_FILE, admins)

        # Secondary Admins submit profile update requests for platform admin approval
        request_obj = {
            "requestId": str(uuid.uuid4()),
            "organizationId": user_id,
            "organizationName": data.get('organizationName', '').strip(),
            "ownerName": data.get('fullName', '').strip(),
            "email": data.get('email', '').strip().lower(),
            "phone": data.get('phone', '').strip(),
            "address": data.get('address', '').strip(),
            "password": hash_password(data['password']) if data.get('password') else '',
            "recoveryHint": data.get('recoveryHint', '').strip(),
            "status": "PENDING",
            "date": get_current_date(),
            "time": get_current_time()
        }
        write_db('profile_update_requests', request_obj)

        # Notify Main Admin
        add_notification("ADM-001", f"New profile update request from organization {data.get('organizationName')}.", "INFO")

        return jsonify({"message": "Update request submitted. Waiting for admin approval."}), 200

    return jsonify({"error": "Invalid role"}), 400

@auth_bp.route('/profile/requests', methods=['GET'])
def get_profile_requests():
    role = request.headers.get('X-User-Role')
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform admins can view profile update requests"}), 403

    requests = read_db('profile_update_requests', {"status": "PENDING"})
    return jsonify(requests), 200

@auth_bp.route('/profile/requests/approve', methods=['POST'])
def approve_profile_request():
    role = request.headers.get('X-User-Role')
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform admins can approve profile update requests"}), 403

    data = request.json or {}
    request_id = data.get('requestId')

    requests = read_db('profile_update_requests', {"requestId": request_id})
    req = requests[0] if requests else None
    if not req:
        return jsonify({"error": "Request not found"}), 404

    org_id = req.get('organizationId')

    # Update Admin collection
    admins = read_json(ADMINS_FILE)
    for a in admins:
        if a.get('organizationId') == org_id:
            if req.get('ownerName'): a['fullName'] = req['ownerName']
            if req.get('email'): a['email'] = req['email']
            if req.get('password'): a['password'] = req['password']
            if req.get('recoveryHint'): a['recoveryHint'] = req['recoveryHint']
            break
    write_json(ADMINS_FILE, admins)

    # Update Organization collection
    orgs = read_json(ORGANIZATIONS_FILE)
    for o in orgs:
        if o.get('organizationId') == org_id:
            if req.get('ownerName'): o['ownerName'] = req['ownerName']
            if req.get('email'): o['email'] = req['email']
            if req.get('phone'): o['phone'] = req['phone']
            if req.get('address'): o['address'] = req['address']
            break
    write_json(ORGANIZATIONS_FILE, orgs)

    # Mark request as approved
    update_db('profile_update_requests', {"requestId": request_id}, {"status": "APPROVED"})

    # Notify Org Admin
    add_notification(org_id, "Your profile update request has been APPROVED.", "SUCCESS")

    return jsonify({"message": "Profile update approved"}), 200

@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    role = request.headers.get('X-User-Role')
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform admins can view all users"}), 403

    users = read_json(USERS_FILE)
    safe_users = [sanitize_user(u) for u in users]
    return jsonify(safe_users), 200

@auth_bp.route('/users/suspend', methods=['POST'])
def suspend_user():
    role = request.headers.get('X-User-Role')
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform admins can suspend users"}), 403

    data = request.json or {}
    user_id = data.get('userId')
    users = read_json(USERS_FILE)
    for u in users:
        if u.get('userId') == user_id:
            u['status'] = 'SUSPENDED'
            break
    write_json(USERS_FILE, users)
    return jsonify({"message": "User suspended successfully"}), 200

@auth_bp.route('/users/activate', methods=['POST'])
def activate_user():
    role = request.headers.get('X-User-Role')
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform admins can activate users"}), 403

    data = request.json or {}
    user_id = data.get('userId')
    users = read_json(USERS_FILE)
    for u in users:
        if u.get('userId') == user_id:
            u['status'] = 'ACTIVE'
            break
    write_json(USERS_FILE, users)
    return jsonify({"message": "User activated successfully"}), 200

@auth_bp.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    role = request.headers.get('X-User-Role')
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform admins can delete users"}), 403

    users = read_json(USERS_FILE)
    users = [u for u in users if u.get('userId') != user_id]
    write_json(USERS_FILE, users)
    return jsonify({"message": "User deleted successfully"}), 200

@auth_bp.route('/forgot-password/check-email', methods=['POST'])
def check_email_forgot_password():
    data = request.json or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({"error": "Please enter your email address."}), 400

    users = read_json(USERS_FILE)
    admins = read_json(ADMINS_FILE)

    account = next((u for u in users if u.get('email', '').lower() == email), None)
    if not account:
        account = next((a for a in admins if a.get('email', '').lower() == email), None)

    if not account:
        return jsonify({"error": "No account found with this email address."}), 404

    return jsonify({"message": "Email verified", "email": email}), 200

@auth_bp.route('/forgot-password/verify-hint', methods=['POST'])
def verify_hint_forgot_password():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    hint = data.get('recoveryHint', '').strip().lower()

    if not email or not hint:
        return jsonify({"error": "Email and recovery hint are required."}), 400

    users = read_json(USERS_FILE)
    admins = read_json(ADMINS_FILE)

    account = next((u for u in users if u.get('email', '').lower() == email), None)
    if not account:
        account = next((a for a in admins if a.get('email', '').lower() == email), None)

    if not account:
        return jsonify({"error": "Account not found."}), 404

    saved_hint = account.get('recoveryHint', '').strip().lower()

    if not saved_hint:
        return jsonify({"error": "No recovery hint was set for this account."}), 400

    if saved_hint != hint:
        return jsonify({"error": "Incorrect recovery hint. Please try again."}), 400

    return jsonify({"message": "Recovery hint verified successfully."}), 200

@auth_bp.route('/forgot-password/reset', methods=['POST'])
def reset_password_forgot_password():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    hint = data.get('recoveryHint', '').strip().lower()
    new_password = data.get('newPassword')

    if not new_password or len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    users = read_json(USERS_FILE)
    admins = read_json(ADMINS_FILE)

    hashed_pw = hash_password(new_password)

    # Check users
    for u in users:
        if u.get('email', '').lower() == email:
            if u.get('recoveryHint', '').strip().lower() == hint:
                u['password'] = hashed_pw
                write_json(USERS_FILE, users)
                return jsonify({"message": "Password reset successfully. You can now log in."}), 200
            else:
                return jsonify({"error": "Recovery hint verification failed."}), 400

    # Check admins
    for a in admins:
        if a.get('email', '').lower() == email:
            if a.get('recoveryHint', '').strip().lower() == hint:
                a['password'] = hashed_pw
                write_json(ADMINS_FILE, admins)
                return jsonify({"message": "Password reset successfully. You can now log in."}), 200
            else:
                return jsonify({"error": "Recovery hint verification failed."}), 400

    return jsonify({"error": "Account not found."}), 404

@auth_bp.route('/user/login', methods=['POST'])
def login_user():
    return login()

@auth_bp.route('/secondary-admin/login', methods=['POST'])
def login_secondary_admin():
    return login()

@auth_bp.route('/main-admin/login', methods=['POST'])
def login_main_admin():
    return login()

