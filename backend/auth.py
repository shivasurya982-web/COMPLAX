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
        "role": "USER"
    }

    users.append(new_user)
    write_json(USERS_FILE, users)

    return jsonify({"message": "User registered successfully", "user": new_user}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Check Admins first (Main Admin and Secondary Admin)
    admins = read_json(ADMINS_FILE)
    admin = next((a for a in admins if a['email'] == email and a['password'] == password), None)
    if admin:
        return jsonify({"message": "Login successful", "user": admin}), 200

    # Check Regular Users
    users = read_json(USERS_FILE)
    user = next((u for u in users if u['email'] == email and u['password'] == password), None)
    if user:
        return jsonify({"message": "Login successful", "user": user}), 200

    return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/user/login', methods=['POST'])
def login_user():
    return login()

@auth_bp.route('/secondary-admin/login', methods=['POST'])
def login_secondary_admin():
    return login()

@auth_bp.route('/main-admin/login', methods=['POST'])
def login_main_admin():
    return login()
