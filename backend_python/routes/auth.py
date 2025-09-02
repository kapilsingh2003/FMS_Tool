from flask import Blueprint, request, jsonify
from datetime import datetime
import time
import sys
import os

# Add the parent directory to the path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import data_manager

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """User signup endpoint - POST /api/auth/signup"""
    try:
        data = request.get_json()
        
        username = data.get('username')
        name = data.get('name')
        password = data.get('password')
        role = data.get('role')
        email = data.get('email')
        department = data.get('department')
        team = data.get('team')
        
        # Validate required fields
        if not username or not password:
            return jsonify({'message': 'Missing required fields.'}), 400
        
        # Load existing users
        users = data_manager.load_users()
        
        # Check if user already exists
        if any(user['username'] == username for user in users):
            return jsonify({'message': 'User already exists.'}), 400
        
        # Create new user
        new_user = {
            'id': int(time.time() * 1000),  # Millisecond timestamp like JavaScript Date.now()
            'username': username,
            'name': name,
            'password': password,  # ⚠️ Store hashed in production!
            'role': role,
            'email': email,
            'department': department,
            'team': team,
            'createdAt': datetime.now().isoformat() + 'Z'
        }
        
        # Add user to list and save
        users.append(new_user)
        
        if data_manager.save_users(users):
            return jsonify({'success': True, 'user': new_user})
        else:
            return jsonify({'message': 'Failed to save user data.'}), 500
            
    except Exception as e:
        print(f"Error in signup: {e}")
        return jsonify({'message': 'Internal server error.'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint - POST /api/auth/login"""
    try:
        data = request.get_json()
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'message': 'Username and password are required.'}), 400
        
        # Load users and find matching user
        users = data_manager.load_users()
        user = next((u for u in users if u['username'] == username and u['password'] == password), None)
        
        if not user:
            return jsonify({'message': 'Invalid credentials.'}), 401
        
        return jsonify({'success': True, 'user': user})
        
    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({'message': 'Internal server error.'}), 500 