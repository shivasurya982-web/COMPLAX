import os
import copy
from datetime import datetime
from pymongo import MongoClient
from config import MONGO_URI

# Initialize MongoDB Client
client = MongoClient(MONGO_URI)
db = client.get_database()

def get_db_collection(collection_name):
    """Returns a MongoDB collection."""
    return db[collection_name]

def read_db(collection_name, query=None):
    """Reads documents from a collection."""
    collection = db[collection_name]
    if query is None:
        query = {}
    return list(collection.find(query, {'_id': 0}))

def write_db(collection_name, data):
    """Inserts one or more documents into a collection without modifying original."""
    collection = db[collection_name]
    if isinstance(data, list):
        if not data: return
        collection.insert_many(copy.deepcopy(data))
    else:
        collection.insert_one(copy.deepcopy(data))

def update_db(collection_name, query, update_data):
    """Updates documents in a collection."""
    collection = db[collection_name]
    collection.update_many(query, {'$set': update_data})

def delete_db(collection_name, query):
    """Deletes documents from a collection."""
    collection = db[collection_name]
    collection.delete_many(query)

# Legacy support for internal logic that hasn't switched to explicit DB calls
def read_json(file_path):
    """Maps file paths to MongoDB collections for seamless migration."""
    collection_map = {
        'users.json': 'users',
        'admins.json': 'admins',
        'organizations.json': 'organizations',
        'categories.json': 'categories',
        'complaints.json': 'complaints',
        'dataset_requests.json': 'dataset_requests'
    }
    file_name = os.path.basename(file_path)
    collection_name = collection_map.get(file_name)
    if collection_name:
        return read_db(collection_name)
    return []

def write_json(file_path, data):
    """Maps file paths to MongoDB collections. NOTE: This resets the collection for JSON compatibility."""
    collection_map = {
        'users.json': 'users',
        'admins.json': 'admins',
        'organizations.json': 'organizations',
        'categories.json': 'categories',
        'complaints.json': 'complaints',
        'dataset_requests.json': 'dataset_requests'
    }
    file_name = os.path.basename(file_path)
    collection_name = collection_map.get(file_name)
    if collection_name:
        collection = db[collection_name]
        collection.delete_many({}) # Clear existing to maintain list-state logic
        if data:
            # We deepcopy to prevent MongoDB from adding '_id' (ObjectId) to our in-memory list
            collection.insert_many(copy.deepcopy(data))

def get_current_date():
    return datetime.now().strftime("%d/%m/%Y")

def get_current_time():
    return datetime.now().strftime("%H:%M")
