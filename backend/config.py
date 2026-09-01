import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

USERS_FILE = os.path.join(DATA_DIR, 'users.json')
ADMINS_FILE = os.path.join(DATA_DIR, 'admins.json')
ORGANIZATIONS_FILE = os.path.join(DATA_DIR, 'organizations.json')
CATEGORIES_FILE = os.path.join(DATA_DIR, 'categories.json')
COMPLAINTS_FILE = os.path.join(DATA_DIR, 'complaints.json')
DATASET_REQUESTS_FILE = os.path.join(DATA_DIR, 'dataset_requests.json')

PENDING_DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'pending')
APPROVED_DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'approved')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

SECRET_KEY = 'complax-secret-key'

# MongoDB Configuration
# IMPORTANT: Replace <db_password> with your actual password in the string below
MONGO_URI = "mongodb+srv://surya_123:COMPLAX123@cluster0.wq8dp1c.mongodb.net/complax_db?retryWrites=true&w=majority&appName=Cluster0"
