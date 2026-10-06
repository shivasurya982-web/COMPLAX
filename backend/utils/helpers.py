import os
import json
import copy
from datetime import datetime
from pymongo import MongoClient, ReplaceOne
from config import MONGO_URI

# Storage Mode Flag
USE_MONGODB = False
db = None

# Ultra-fast In-Memory Cache (RAM Cache) for sub-millisecond query speed
RAM_CACHE = {}

try:
    # Optimized MongoClient with sub-second timeout to prevent DNS/Network hangs
    client = MongoClient(
        MONGO_URI,
        maxPoolSize=50,
        minPoolSize=5,
        maxIdleTimeMS=45000,
        serverSelectionTimeoutMS=500,
        connectTimeoutMS=500
    )
    client.admin.command('ping')
    db = client.get_database()
    USE_MONGODB = True
    print("[COMPLAX Backend] Connected to MongoDB Cloud successfully.")

    # Create indexes for sub-millisecond query performance
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
    print("[COMPLAX Backend] Using ultra-fast Local JSON Storage mode.")

def get_db_collection(collection_name):
    """Returns a MongoDB collection or None if in JSON mode."""
    if USE_MONGODB:
        return db[collection_name]
    return None

def read_db(collection_name, query=None):
    """Reads documents from RAM cache, MongoDB, or local JSON file."""
    # Check RAM Cache first for sub-millisecond response time
    if collection_name in RAM_CACHE:
        data = RAM_CACHE[collection_name]
        if query:
            return [d for d in data if all(d.get(k) == v for k, v in query.items())]
        return copy.deepcopy(data)

    if USE_MONGODB:
        collection = db[collection_name]
        if query is None:
            query = {}
        data = list(collection.find(query, {'_id': 0}))
        if not query:
            RAM_CACHE[collection_name] = copy.deepcopy(data)
        return data
    else:
        from config import DATA_DIR
        file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    RAM_CACHE[collection_name] = copy.deepcopy(data)
                    if query:
                        return [d for d in data if all(d.get(k) == v for k, v in query.items())]
                    return data
            except Exception:
                return []
        RAM_CACHE[collection_name] = []
        return []

def write_db(collection_name, data):
    """Inserts documents and updates RAM cache instantly."""
    # Update RAM Cache immediately
    current = RAM_CACHE.get(collection_name, [])
    if isinstance(data, list):
        current.extend(copy.deepcopy(data))
    else:
        current.append(copy.deepcopy(data))
    RAM_CACHE[collection_name] = current

    if USE_MONGODB:
        collection = db[collection_name]
        if isinstance(data, list):
            if not data: return
            collection.insert_many(copy.deepcopy(data))
        else:
            collection.insert_one(copy.deepcopy(data))
    else:
        from config import DATA_DIR
        file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(current, f, separators=(',', ':'))

def update_db(collection_name, query, update_data):
    """Updates documents in RAM cache and persistent storage."""
    data = read_db(collection_name)
    for d in data:
        if all(d.get(k) == v for k, v in query.items()):
            d.update(update_data)
    RAM_CACHE[collection_name] = copy.deepcopy(data)

    if USE_MONGODB:
        collection = db[collection_name]
        collection.update_many(query, {'$set': update_data})
    else:
        from config import DATA_DIR
        file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, separators=(',', ':'))

def delete_db(collection_name, query):
    """Deletes documents from RAM cache and persistent storage."""
    data = read_db(collection_name)
    filtered = [d for d in data if not all(d.get(k) == v for k, v in query.items())]
    RAM_CACHE[collection_name] = copy.deepcopy(filtered)

    if USE_MONGODB:
        collection = db[collection_name]
        collection.delete_many(query)
    else:
        from config import DATA_DIR
        file_path = os.path.join(DATA_DIR, f"{collection_name}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(filtered, f, separators=(',', ':'))

def read_json(file_path):
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

    # Update RAM Cache immediately
    RAM_CACHE[collection_name] = copy.deepcopy(data)

    if USE_MONGODB:
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
    else:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, separators=(',', ':'))

def get_current_date():
    return datetime.now().strftime("%d/%m/%Y")

def get_current_time():
    return datetime.now().strftime("%I:%M %p")

