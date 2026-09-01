from flask import Blueprint, request, jsonify
from utils.helpers import read_json, write_json
from utils.id_generator import generate_category_id
from config import CATEGORIES_FILE

category_bp = Blueprint('category', __name__)

@category_bp.route('', methods=['GET'])
def get_categories():
    categories = read_json(CATEGORIES_FILE)
    return jsonify(categories), 200

@category_bp.route('', methods=['POST'])
def add_category():
    data = request.json
    categories = read_json(CATEGORIES_FILE)

    if any(c['name'].lower() == data['name'].lower() for c in categories):
        return jsonify({"error": "Category already exists"}), 400

    new_cat = {
        "categoryId": generate_category_id(),
        "name": data['name'],
        "status": "ACTIVE"
    }

    categories.append(new_cat)
    write_json(CATEGORIES_FILE, categories)

    return jsonify(new_cat), 201

@category_bp.route('/<cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    categories = read_json(CATEGORIES_FILE)
    categories = [c for c in categories if c['categoryId'] != cat_id]
    write_json(CATEGORIES_FILE, categories)
    return jsonify({"message": "Category deleted"}), 200
