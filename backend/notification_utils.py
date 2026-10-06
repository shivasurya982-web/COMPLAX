from utils.helpers import read_db, write_db, update_db, get_current_date, get_current_time, USE_MONGODB, db
import uuid
from flask import Blueprint, jsonify, request

notification_bp = Blueprint('notification', __name__)

def add_notification(user_id, message, type="INFO"):
    notif = {
        "notificationId": str(uuid.uuid4()),
        "userId": user_id,
        "message": message,
        "type": type,
        "date": get_current_date(),
        "time": get_current_time(),
        "isRead": False
    }
    write_db('notifications', notif)

@notification_bp.route('/<user_id>', methods=['GET'])
def get_notifications(user_id):
    notifications = read_db('notifications', {"userId": user_id})
    return jsonify(notifications[::-1]), 200

@notification_bp.route('/<user_id>/unread-count', methods=['GET'])
def get_unread_count(user_id):
    if USE_MONGODB:
        count = db['notifications'].count_documents({"userId": user_id, "isRead": False})
    else:
        notifications = read_db('notifications', {"userId": user_id})
        count = len([n for n in notifications if not n.get('isRead')])
    return jsonify({"count": count}), 200

@notification_bp.route('/read-all/<user_id>', methods=['PUT'])
def read_all_notifications(user_id):
    update_db('notifications', {"userId": user_id}, {"isRead": True})
    return jsonify({"message": "All marked as read"}), 200

@notification_bp.route('/<notification_id>', methods=['DELETE'])
def delete_single_notification(notification_id):
    if USE_MONGODB:
        db['notifications'].delete_one({"notificationId": notification_id})
    else:
        notifications = read_db('notifications')
        notifications = [n for n in notifications if n.get('notificationId') != notification_id]
        from utils.helpers import write_json
        from config import NOTIFICATIONS_FILE
        write_json(NOTIFICATIONS_FILE, notifications)
    return jsonify({"message": "Notification deleted"}), 200

@notification_bp.route('/clear/<user_id>', methods=['DELETE'])
def clear_user_notifications(user_id):
    if USE_MONGODB:
        db['notifications'].delete_many({"userId": user_id})
    else:
        notifications = read_db('notifications')
        notifications = [n for n in notifications if n.get('userId') != user_id]
        from utils.helpers import write_json
        from config import NOTIFICATIONS_FILE
        write_json(NOTIFICATIONS_FILE, notifications)
    return jsonify({"message": "All notifications cleared"}), 200
