from flask import Blueprint, request, jsonify
from datetime import datetime
import sys
import os

# Add the parent directory to the path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import data_manager

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def get_users():
    """Get all users (admin only) - GET /api/users"""
    try:
        users = data_manager.load_users()
        # Remove passwords from response for security
        safe_users = []
        for user in users:
            user_copy = user.copy()
            user_copy.pop('password', None)
            safe_users.append(user_copy)
        
        return jsonify(safe_users)
    except Exception as e:
        print(f"Error loading users: {e}")
        return jsonify({'message': 'Error loading users'}), 500

@users_bp.route('/<username>', methods=['GET'])
def get_user(username):
    """Get specific user (admin only) - GET /api/users/:username"""
    try:
        users = data_manager.load_users()
        user = next((u for u in users if u['username'] == username), None)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Remove password from response
        user_copy = user.copy()
        user_copy.pop('password', None)
        return jsonify(user_copy)
        
    except Exception as e:
        print(f"Error loading user: {e}")
        return jsonify({'message': 'Error loading user'}), 500

@users_bp.route('/<username>', methods=['PUT'])
def update_user(username):
    """Update user (admin only) - PUT /api/users/:username"""
    try:
        users = data_manager.load_users()
        user_index = next((i for i, u in enumerate(users) if u['username'] == username), None)
        
        if user_index is None:
            return jsonify({'message': 'User not found'}), 404
        
        update_data = request.get_json()
        password = update_data.pop('password', None)
        
        # Update user data
        updated_user = users[user_index].copy()
        updated_user.update(update_data)
        updated_user['updatedAt'] = datetime.now().isoformat() + 'Z'
        
        # Only update password if provided
        if password:
            updated_user['password'] = password  # In production, hash this!
        
        users[user_index] = updated_user
        
        if data_manager.save_users(users):
            # Remove password from response
            user_copy = updated_user.copy()
            user_copy.pop('password', None)
            return jsonify({'success': True, 'user': user_copy})
        else:
            return jsonify({'message': 'Failed to save user data.'}), 500
            
    except Exception as e:
        print(f"Error updating user: {e}")
        return jsonify({'message': 'Error updating user'}), 500

@users_bp.route('/<username>', methods=['DELETE'])
def delete_user(username):
    """Delete user (admin only) - DELETE /api/users/:username"""
    try:
        users = data_manager.load_users()
        user_index = next((i for i, u in enumerate(users) if u['username'] == username), None)
        
        if user_index is None:
            return jsonify({'message': 'User not found'}), 404
        
        deleted_user = users.pop(user_index)
        
        if data_manager.save_users(users):
            return jsonify({'success': True, 'message': 'User deleted successfully', 'user': deleted_user})
        else:
            return jsonify({'message': 'Failed to save user data.'}), 500
            
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({'message': 'Error deleting user'}), 500

@users_bp.route('/<username>/projects/<project_id>', methods=['POST'])
def add_user_to_project(username, project_id):
    """Add user to project - POST /api/users/:username/projects/:projectId"""
    try:
        users = data_manager.load_users()
        projects = data_manager.load_projects()
        
        user = next((u for u in users if u['username'] == username), None)
        project_index = next((i for i, p in enumerate(projects) if str(p['id']) == project_id), None)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if project_index is None:
            return jsonify({'message': 'Project not found'}), 404
        
        project = projects[project_index]
        
        # Initialize participants array if it doesn't exist
        if 'participants' not in project:
            project['participants'] = []
        
        # Add user to project if not already added
        if username not in project['participants']:
            project['participants'].append(username)
            projects[project_index] = project
            
            if data_manager.save_projects(projects):
                return jsonify({
                    'success': True,
                    'message': 'User added to project successfully',
                    'project': project
                })
            else:
                return jsonify({'message': 'Failed to save project data.'}), 500
        else:
            return jsonify({
                'success': True,
                'message': 'User already in project',
                'project': project
            })
            
    except Exception as e:
        print(f"Error adding user to project: {e}")
        return jsonify({'message': 'Error adding user to project'}), 500

@users_bp.route('/<username>/projects/<project_id>', methods=['DELETE'])
def remove_user_from_project(username, project_id):
    """Remove user from project - DELETE /api/users/:username/projects/:projectId"""
    try:
        users = data_manager.load_users()
        projects = data_manager.load_projects()
        
        user = next((u for u in users if u['username'] == username), None)
        project_index = next((i for i, p in enumerate(projects) if str(p['id']) == project_id), None)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if project_index is None:
            return jsonify({'message': 'Project not found'}), 404
        
        project = projects[project_index]
        
        if 'participants' in project and username in project['participants']:
            project['participants'].remove(username)
            projects[project_index] = project
            data_manager.save_projects(projects)
        
        return jsonify({
            'success': True,
            'message': 'User removed from project successfully',
            'project': project
        })
        
    except Exception as e:
        print(f"Error removing user from project: {e}")
        return jsonify({'message': 'Error removing user from project'}), 500

@users_bp.route('/<username>/projects', methods=['GET'])
def get_user_projects(username):
    """Get projects for a specific user - GET /api/users/:username/projects"""
    try:
        users = data_manager.load_users()
        projects = data_manager.load_projects()
        
        user = next((u for u in users if u['username'] == username), None)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Find projects where user is admin or participant
        user_projects = []
        for project in projects:
            if (project.get('adminId') == username or 
                (project.get('participants') and username in project['participants'])):
                user_projects.append(project)
        
        return jsonify(user_projects)
        
    except Exception as e:
        print(f"Error loading user projects: {e}")
        return jsonify({'message': 'Error loading user projects'}), 500 