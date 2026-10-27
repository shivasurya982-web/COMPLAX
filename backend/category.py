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
    role = request.headers.get('X-User-Role')
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform administrators can manage categories"}), 403

    data = request.json or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"error": "Category name is required"}), 400

    categories = read_json(CATEGORIES_FILE)

    if any(c['name'].lower() == name.lower() for c in categories):
        return jsonify({"error": "Category already exists"}), 400

    new_cat = {
        "categoryId": generate_category_id(),
        "name": name,
        "status": "ACTIVE"
    }

    categories.append(new_cat)
    write_json(CATEGORIES_FILE, categories)

    return jsonify(new_cat), 201

@category_bp.route('/<cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    role = request.headers.get('X-User-Role')
    if role and role != 'MAIN_ADMIN':
        return jsonify({"error": "Forbidden: Only platform administrators can manage categories"}), 403

    categories = read_json(CATEGORIES_FILE)
    categories = [c for c in categories if c['categoryId'] != cat_id]
    write_json(CATEGORIES_FILE, categories)
    return jsonify({"message": "Category deleted"}), 200
