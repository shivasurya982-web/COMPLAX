import os
import json
import copy
from datetime import datetime
from pymongo import MongoClient, ReplaceOne
from config import MONGO_URI

# Connect directly and exclusively to MongoDB Atlas Cloud
client = MongoClient(
    MONGO_URI,
    maxPoolSize=50,
    minPoolSize=5,
    maxIdleTimeMS=45000,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000
)

# Test connection on startup
client.admin.command('ping')
db = client.get_database()
print("✅ Strictly connected to MongoDB Atlas Cloud Database.")

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

def get_db_collection(collection_name):
    """Returns a MongoDB Atlas collection."""
    return db[collection_name]

def read_db(collection_name, query=None):
    """Reads documents directly from MongoDB Atlas."""
    collection = db[collection_name]
    if query is None:
        query = {}
    return list(collection.find(query, {'_id': 0}))

def write_db(collection_name, data):
    """Inserts documents directly into MongoDB Atlas."""
    collection = db[collection_name]
    if isinstance(data, list):
        if not data:
            return
        collection.insert_many(copy.deepcopy(data))
    else:
        collection.insert_one(copy.deepcopy(data))

def update_db(collection_name, query, update_data):
    """Updates documents directly in MongoDB Atlas."""
    collection = db[collection_name]
    collection.update_many(query, {'$set': update_data})

def delete_db(collection_name, query):
    """Deletes documents directly from MongoDB Atlas."""
    collection = db[collection_name]
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
        'notifications.json': 'notifications'
    }
    file_name = os.path.basename(file_path)
    collection_name = collection_map.get(file_name, file_name.replace('.json', ''))
    return read_db(collection_name)

def write_json(file_path, data):
    """Writes collection directly to MongoDB Atlas using bulk upsert."""
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

def get_current_date():
    return datetime.now().strftime("%d/%m/%Y")

def get_current_time():
    return datetime.now().strftime("%I:%M %p")
