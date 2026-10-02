from flask import Flask, send_from_directory
from flask_cors import CORS
import os
import sys

# Add current directory to path to allow imports when running as a script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auth import auth_bp
from organization import org_bp
from category import category_bp
from complaint import complaint_bp
from dataset_manager import dataset_bp, generate_initial_dataset
from notification_utils import notification_bp
from ml_model import MLModel

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(org_bp, url_prefix='/api/organizations')
app.register_blueprint(category_bp, url_prefix='/api/categories')
app.register_blueprint(complaint_bp, url_prefix='/api/complaints')
app.register_blueprint(dataset_bp, url_prefix='/api/datasets')
app.register_blueprint(notification_bp, url_prefix='/api/notifications')

@app.after_request
def add_performance_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

def init_app():
    # Ensure directories exist
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'models', 'default'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'datasets', 'pending'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'datasets', 'approved'), exist_ok=True)

    # Ensure Main Admin exists
    from config import ADMINS_FILE, USERS_FILE
    from utils.helpers import read_json, write_json, db
    admins = read_json(ADMINS_FILE)
    if not any(a['email'] == 'admin@complax.com' for a in admins):
        admins.append({
            "userId": "ADM-001",
            "email": "admin@complax.com",
            "password": "admin123",
            "fullName": "Main Admin",
            "role": "MAIN_ADMIN"
        })
        write_json(ADMINS_FILE, admins)

    # Data integrity fix: Ensure all admins and users have userId and status
    modified = False
    for a in admins:
        if 'userId' not in a and a.get('organizationId'):
            a['userId'] = a['organizationId']
            modified = True
        if 'status' not in a:
            a['status'] = 'APPROVED'
            modified = True
    if modified: write_json(ADMINS_FILE, admins)

    users = read_json(USERS_FILE)
    modified_users = False
    for u in users:
        if 'status' not in u:
            u['status'] = 'ACTIVE'
            modified_users = True
    if modified_users: write_json(USERS_FILE, users)

    # Data integrity fix: Sync organization IDs across users, complaints, admins, and orgs
    from config import ORGANIZATIONS_FILE, COMPLAINTS_FILE
    orgs = read_json(ORGANIZATIONS_FILE)
    complaints = read_json(COMPLAINTS_FILE)

    orgs_modified = False
    for o in orgs:
        if o.get('name') and o['name'] != o['name'].strip():
            o['name'] = o['name'].strip()
            orgs_modified = True
    if orgs_modified: write_json(ORGANIZATIONS_FILE, orgs)

    admins_modified = False
    for a in admins:
        if a.get('organizationName') and a['organizationName'] != a['organizationName'].strip():
            a['organizationName'] = a['organizationName'].strip()
            admins_modified = True
    if admins_modified: write_json(ADMINS_FILE, admins)

    email_to_org_id = {}
    name_to_org_id = {}
    for o in orgs:
        oid = o.get('organizationId')
        if o.get('email'): email_to_org_id[o['email'].strip().lower()] = oid
        if o.get('name'): name_to_org_id[o['name'].strip().lower()] = oid

    for a in admins:
        if a.get('role') == 'SECONDARY_ADMIN':
            oid = a.get('organizationId')
            if a.get('email') and a['email'].strip().lower() not in email_to_org_id:
                email_to_org_id[a['email'].strip().lower()] = oid
            if a.get('organizationName') and a['organizationName'].strip().lower() not in name_to_org_id:
                name_to_org_id[a['organizationName'].strip().lower()] = oid

    users_sync = False
    for u in users:
        if not u.get('organizationId'):
            u_name = u.get('organizationName', '').strip().lower()
            u_user_email = u.get('email', '').strip().lower()
            target_id = email_to_org_id.get(u_user_email) or name_to_org_id.get(u_name)
            if target_id:
                u['organizationId'] = target_id
                users_sync = True
    if users_sync: write_json(USERS_FILE, users)

    complaints_sync = False
    for c in complaints:
        if not c.get('organizationId'):
            c_name = c.get('organizationName', '').strip().lower()
            target_id = name_to_org_id.get(c_name)
            if target_id:
                c['organizationId'] = target_id
                complaints_sync = True
    if complaints_sync: write_json(COMPLAINTS_FILE, complaints)

    # Clean existing notifications (remove technical IDs)
    from utils.helpers import USE_MONGODB
    if USE_MONGODB:
        notifications_col = db['notifications']
        import re
        all_notifs = list(notifications_col.find({}))
        for n in all_notifs:
            if 'CMP-' in n['message']:
                clean_msg = re.sub(r'CMP-[A-Z0-9]+ ', '', n['message']) # Remove with trailing space
                clean_msg = re.sub(r'CMP-[A-Z0-9]+', '', clean_msg)     # Remove remaining
                notifications_col.update_one({"_id": n['_id']}, {"$set": {"message": clean_msg}})

    # Ensure Initial Categories exist
    from config import CATEGORIES_FILE
    categories = read_json(CATEGORIES_FILE)
    if not categories:
        initial_cats = [
            {"categoryId": "CAT001", "name": "Apartment", "status": "ACTIVE"},
            {"categoryId": "CAT002", "name": "Hostel", "status": "ACTIVE"},
            {"categoryId": "CAT003", "name": "PG", "status": "ACTIVE"},
            {"categoryId": "CAT004", "name": "College Hostel", "status": "ACTIVE"},
            {"categoryId": "CAT005", "name": "Office", "status": "ACTIVE"},
            {"categoryId": "CAT006", "name": "Residential Building", "status": "ACTIVE"}
        ]
        write_json(CATEGORIES_FILE, initial_cats)

    # Generate initial dataset if it doesn't exist
    generate_initial_dataset()

    # Train default model if it doesn't exist
    default_model = MLModel('default')
    if not default_model.load():
        print("Training default ML model...")
        default_model.train()
        print("Default ML model trained successfully.")

# Serve React Frontend in production
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'dist')
    if path != "" and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    elif os.path.exists(os.path.join(dist_dir, 'index.html')):
        return send_from_directory(dist_dir, 'index.html')
    return "COMPLAX API is running. Build frontend using 'npm run build' inside /frontend.", 200

if __name__ == '__main__':
    init_app()
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '0').lower() in ('1', 'true', 'yes', 'on')
    app.run(host=host, port=port, debug=debug)
