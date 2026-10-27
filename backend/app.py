import os
import sys

# Ensure correct environment: if current Python lacks required dependencies, fallback to .venv
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_venv_py = os.path.join(_backend_dir, '.venv', 'Scripts', 'python.exe')
if os.path.exists(_venv_py) and os.path.abspath(sys.executable).lower() != os.path.abspath(_venv_py).lower():
    try:
        import flask
        import pymongo
        import sklearn
    except ImportError:
        try:
            import subprocess
            _cmd = [_venv_py] + sys.argv
            sys.exit(subprocess.run(_cmd).returncode)
        except Exception as e:
            print(f"[COMPLAX Warning] Failed to relaunch with .venv: {e}")

# Windows console encoding fix
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from flask import Flask, send_from_directory
from flask_cors import CORS

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
    from utils.helpers import read_json, write_json, db, hash_password
    admins = read_json(ADMINS_FILE)
    if not any(a.get('email') == 'admin@complax.com' for a in admins):
        admins.append({
            "userId": "ADM-001",
            "email": "admin@complax.com",
            "password": hash_password("admin123"),
            "fullName": "Main Admin",
            "role": "MAIN_ADMIN",
            "status": "APPROVED"
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
    if USE_MONGODB and db is not None:
        try:
            notifications_col = db['notifications']
            import re
            all_notifs = list(notifications_col.find({}))
            for n in all_notifs:
                if 'CMP-' in n.get('message', ''):
                    clean_msg = re.sub(r'CMP-[A-Z0-9]+ ', '', n['message']) # Remove with trailing space
                    clean_msg = re.sub(r'CMP-[A-Z0-9]+', '', clean_msg)     # Remove remaining
                    notifications_col.update_one({"_id": n['_id']}, {"$set": {"message": clean_msg}})
        except Exception:
            pass


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

    # Pre-warm default and approved organization ML models
    from ml_model import get_model_for_org, APPROVED_DATASETS_DIR
    print("[COMPLAX Backend] Pre-warming ML models...")
    get_model_for_org('default')

    if os.path.exists(APPROVED_DATASETS_DIR):
        for fname in os.listdir(APPROVED_DATASETS_DIR):
            if fname.endswith('.csv'):
                org_file_id = fname[:-4]
                print(f"[COMPLAX Backend] Loading approved organization model: '{org_file_id}'")
                get_model_for_org(org_file_id)

    # Initialize live suggestion service index
    from suggestion_service import get_suggestion_service
    get_suggestion_service(force_reload=True)

    # Pre-warm RAM Cache for sub-millisecond API response times
    print("[COMPLAX Backend] Pre-warming RAM cache...")
    from utils.helpers import read_db
    for col in ['users', 'admins', 'organizations', 'categories', 'complaints', 'dataset_requests', 'notifications']:
        read_db(col)
    print("[COMPLAX Backend] RAM cache warmed up. Ready for instant responses!")

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
