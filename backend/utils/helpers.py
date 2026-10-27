import os
import sys
import json
import copy
from datetime import datetime

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

from pymongo import MongoClient, ReplaceOne
from config import MONGO_URI

# MongoDB Connection
USE_MONGODB = bool(MONGO_URI)
db = None
client = None

def get_mongo_db():
    global client, db, USE_MONGODB
    if not MONGO_URI:
        raise RuntimeError("[COMPLAX] MONGO_URI is not set in backend/.env. MongoDB Atlas URI is required.")
    
    if db is not None:
        try:
            client.admin.command('ping')
            return db
        except Exception:
            pass

    # Connect / Reconnect to MongoDB Atlas
    try:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass
        client = MongoClient(
            MONGO_URI,
            maxPoolSize=50,
            maxIdleTimeMS=45000,
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=20000,
            socketTimeoutMS=30000,
            retryWrites=True
        )
        client.admin.command('ping')
        # Use default database specified in URI (complax_db) or fallback to 'complax_db'
        try:
            db = client.get_default_database()
        except Exception:
            db = None
        if db is None:
            db = client['complax_db']
            
        USE_MONGODB = True
        print(f"[COMPLAX] Successfully connected to MongoDB Atlas (Database: {db.name}).")

        # Ensure performance indexes
        try:
            db['complaints'].create_index([("organizationId", 1)])
            db['complaints'].create_index([("userId", 1)])
            db['users'].create_index([("email", 1)])
            db['users'].create_index([("userId", 1)])
            db['admins'].create_index([("email", 1)])
            db['admins'].create_index([("organizationId", 1)])
            db['notifications'].create_index([("userId", 1)])
        except Exception:
            pass
        return db
    except Exception as e:
        db = None
        raise RuntimeError(f"[COMPLAX] Failed to connect to MongoDB Atlas at {MONGO_URI}: {e}")

# Initial connection at startup
if MONGO_URI:
    try:
        get_mongo_db()
    except Exception as err:
        print(err)

def get_db_collection(collection_name):
    """Returns a MongoDB Atlas collection."""
    database = get_mongo_db()
    return database[collection_name]

def read_db(collection_name, query=None):
    """Reads documents directly and strictly from MongoDB Atlas."""
    database = get_mongo_db()
    collection = database[collection_name]
    q = query if query is not None else {}
    return list(collection.find(q, {'_id': 0}))

def write_db(collection_name, data):
    """Inserts documents directly and strictly into MongoDB Atlas."""
    database = get_mongo_db()
    collection = database[collection_name]
    if isinstance(data, list):
        if data:
            collection.insert_many(copy.deepcopy(data))
    else:
        collection.insert_one(copy.deepcopy(data))

def update_db(collection_name, query, update_data):
    """Updates documents directly and strictly in MongoDB Atlas."""
    database = get_mongo_db()
    collection = database[collection_name]
    collection.update_many(query, {'$set': update_data})

def delete_db(collection_name, query):
    """Deletes documents directly and strictly from MongoDB Atlas."""
    database = get_mongo_db()
    collection = database[collection_name]
    collection.delete_many(query)

def read_json(file_path):
    """Reads collection directly from MongoDB Atlas."""
    collection_map = {
        'users.json': 'users',
        'admins.json': 'admins',
        'organizations.json': 'organizations',
        'categories.json': 'categories',
        'complaints.json': 'complaints',
        'dataset_requests.json': 'dataset_requests',
        'notifications.json': 'notifications',
        'profile_update_requests.json': 'profile_update_requests'
    }
    file_name = os.path.basename(file_path)
    collection_name = collection_map.get(file_name, file_name.replace('.json', ''))
    return read_db(collection_name)

def write_json(file_path, data):
    """Writes collection directly and strictly to MongoDB Atlas."""
    collection_map = {
        'users.json': 'users',
        'admins.json': 'admins',
        'organizations.json': 'organizations',
        'categories.json': 'categories',
        'complaints.json': 'complaints',
        'dataset_requests.json': 'dataset_requests',
        'notifications.json': 'notifications',
        'profile_update_requests.json': 'profile_update_requests'
    }
    file_name = os.path.basename(file_path)
    collection_name = collection_map.get(file_name, file_name.replace('.json', ''))

    database = get_mongo_db()
    collection = database[collection_name]
    if not data:
        collection.delete_many({})
        return

    id_key_map = {
        'users': 'userId',
        'admins': 'userId',
        'organizations': 'organizationId',
        'categories': 'categoryId',
        'complaints': 'complaintId',
        'dataset_requests': 'requestId',
        'notifications': 'notificationId',
        'profile_update_requests': 'requestId'
    }
    id_key = id_key_map.get(collection_name)

    if id_key:
        ops = []
        current_ids = []
        for item in data:
            if isinstance(item, dict) and id_key in item:
                item_id = item[id_key]
                current_ids.append(item_id)
                ops.append(ReplaceOne({id_key: item_id}, copy.deepcopy(item), upsert=True))

        if ops:
            collection.bulk_write(ops, ordered=False)
            if current_ids:
                collection.delete_many({id_key: {"$nin": current_ids}})
    else:
        collection.delete_many({})
        if data:
            collection.insert_many(copy.deepcopy(data))

def get_current_date():
    return datetime.now().strftime("%d/%m/%Y")

def get_current_time():
    return datetime.now().strftime("%I:%M %p")

def hash_password(password):
    """Securely hash passwords using PBKDF2 / Scrypt."""
    if not password:
        return ''
    from werkzeug.security import generate_password_hash
    return generate_password_hash(str(password))

def verify_password(stored_password, provided_password):
    """Verify password with backward-compatibility for initial plain seed passwords."""
    if not stored_password or not provided_password:
        return False
    stored = str(stored_password)
    provided = str(provided_password)
    if stored.startswith('pbkdf2:') or stored.startswith('scrypt:'):
        from werkzeug.security import check_password_hash
        return check_password_hash(stored, provided)
    return stored == provided

