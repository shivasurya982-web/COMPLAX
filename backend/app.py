from flask import Flask
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
from ml_model import MLModel

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(org_bp, url_prefix='/api/organizations')
app.register_blueprint(category_bp, url_prefix='/api/categories')
app.register_blueprint(complaint_bp, url_prefix='/api/complaints')
app.register_blueprint(dataset_bp, url_prefix='/api/datasets')

def init_app():
    # Ensure directories exist
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'models', 'default'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'datasets', 'pending'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'datasets', 'approved'), exist_ok=True)

    # Ensure Main Admin exists
    from config import ADMINS_FILE
    from utils.helpers import read_json, write_json
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

if __name__ == '__main__':
    init_app()
    app.run(debug=True, port=5000)
