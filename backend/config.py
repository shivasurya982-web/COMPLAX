import os

# Auto-load .env file if present (python-dotenv)
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(_env_path):
        load_dotenv(_env_path, override=True)
except ImportError:
    pass  # python-dotenv not installed; rely on system env vars

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

USERS_FILE = os.path.join(DATA_DIR, 'users.json')
ADMINS_FILE = os.path.join(DATA_DIR, 'admins.json')
ORGANIZATIONS_FILE = os.path.join(DATA_DIR, 'organizations.json')
CATEGORIES_FILE = os.path.join(DATA_DIR, 'categories.json')
COMPLAINTS_FILE = os.path.join(DATA_DIR, 'complaints.json')
DATASET_REQUESTS_FILE = os.path.join(DATA_DIR, 'dataset_requests.json')
NOTIFICATIONS_FILE = os.path.join(DATA_DIR, 'notifications.json')
PROFILE_REQUESTS_FILE = os.path.join(DATA_DIR, 'profile_update_requests.json')

PENDING_DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'pending')
APPROVED_DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'approved')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

SECRET_KEY = os.environ.get('SECRET_KEY', 'complax-secret-key-production-local-safe')

# MongoDB Configuration: can be set via MONGO_URI environment variable
# If omitted or unavailable, COMPLAX seamlessly uses local JSON persistent storage in DATA_DIR
MONGO_URI = os.environ.get('MONGO_URI', None)

