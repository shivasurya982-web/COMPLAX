import os
import json
import copy
from datetime import datetime
from pymongo import MongoClient, ReplaceOne
from config import MONGO_URI

# Storage Mode Flag
USE_MONGODB = False
db = None

# Attempt to connect to MongoDB Atlas Cloud with fallback on local DNS timeouts
try:
    client = MongoClient(
        MONGO_URI,
        maxPoolSize=50,
        minPoolSize=5,
        maxIdleTimeMS=45000,
        serverSelectionTimeoutMS=2000,
        connectTimeoutMS=2000
    )
    client.admin.command('ping')
    db = client.get_database()
    USE_MONGODB = True
    print("✅ Connected to MongoDB Atlas Cloud Database.")

    # Create indexes for optimal query speed in MongoDB Atlas
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
except Exception as e:
    USE_MONGODB = False
    db = None
    print("⚠️ MongoDB Atlas connection unavailable or DNS timed out. Using local database fallback.")

def get_db_collection(collection_name):
    """Returns a MongoDB Atlas collection or None if in local mode."""
    if USE_MONGODB and db is not None:
        return db[collection_name]
    return None

def read_db(collection_name, query=None):
    """Reads documents directly from MongoDB Atlas or local fallback."""
    if USE_MONGODB and db is not None:
        try:
            collection = db[collection_name]
            if query is None:
                query = {}
            return list(collection.find(query, {'_id': 0}))
        except Exception:
            pass

    from config import DATA_DIR
    file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if query:
                    return [d for d in data if all(d.get(k) == v for k, v in query.items())]
                return data
        except Exception:
            return []
    return []

def write_db(collection_name, data):
    """Inserts documents directly into MongoDB Atlas or local fallback."""
    if USE_MONGODB and db is not None:
        try:
            collection = db[collection_name]
            if isinstance(data, list):
                if not data:
                    return
                collection.insert_many(copy.deepcopy(data))
            else:
                collection.insert_one(copy.deepcopy(data))
            return
        except Exception:
            pass

    from config import DATA_DIR
    file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
    existing = read_db(collection_name)
    if isinstance(data, list):
        existing.extend(copy.deepcopy(data))
    else:
        existing.append(copy.deepcopy(data))

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(existing, f, indent=4)

def update_db(collection_name, query, update_data):
    """Updates documents in MongoDB Atlas or local fallback."""
    if USE_MONGODB and db is not None:
        try:
            collection = db[collection_name]
            collection.update_many(query, {'$set': update_data})
            return
        except Exception:
            pass

    data = read_db(collection_name)
    for d in data:
        if all(d.get(k) == v for k, v in query.items()):
            d.update(update_data)

    from config import DATA_DIR
    file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def delete_db(collection_name, query):
    """Deletes documents from MongoDB Atlas or local fallback."""
    if USE_MONGODB and db is not None:
        try:
            collection = db[collection_name]
            collection.delete_many(query)
            return
        except Exception:
            pass

    data = read_db(collection_name)
    filtered = [d for d in data if not all(d.get(k) == v for k, v in query.items())]

    from config import DATA_DIR
    file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, indent=4)

def read_json(file_path):
    """Reads collection directly from MongoDB Atlas or local fallback."""
    collection_map = {
        'users.json': 'users',
        'admins.json': 'admins',
        'organizations.json': 'organizations',
        'categories.json': 'categories',
        'complaints.json': 'complaints',
        'dataset_requests.json': 'dataset_requests',
        'notifications.json': 'notifications'
    }
    file_name = os.path.basename(file_path)
    collection_name = collection_map.get(file_name, file_name.replace('.json', ''))
    return read_db(collection_name)

def write_json(file_path, data):
    """Writes collection directly to MongoDB Atlas or local fallback."""
    collection_map = {
        'users.json': 'users',
        'admins.json': 'admins',
        'organizations.json': 'organizations',
        'categories.json': 'categories',
        'complaints.json': 'complaints',
        'dataset_requests.json': 'dataset_requests',
        'notifications.json': 'notifications'
    }
    file_name = os.path.basename(file_path)
    collection_name = collection_map.get(file_name, file_name.replace('.json', ''))

    if USE_MONGODB and db is not None:
        try:
            collection = db[collection_name]
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
                'notifications': 'notificationId'
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
            return
        except Exception:
            pass

    from config import DATA_DIR
    file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def get_current_date():
    return datetime.now().strftime("%d/%m/%Y")

def get_current_time():
    return datetime.now().strftime("%I:%M %p")
