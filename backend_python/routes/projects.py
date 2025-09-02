from flask import Blueprint, request, jsonify
from datetime import datetime
import time
import sys
import os

# Add the parent directory to the path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import data_manager

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['GET'])
def get_projects():
    """Get all projects - GET /api/projects"""
    try:
        projects = data_manager.load_projects()
        return jsonify(projects)
    except Exception as e:
        print(f"Error loading projects: {e}")
        return jsonify({'message': 'Error loading projects'}), 500

@projects_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    """Get specific project - GET /api/projects/:id"""
    try:
        projects = data_manager.load_projects()
        
        # Find project by ID (convert to int for comparison)
        project = next((p for p in projects if str(p['id']) == project_id), None)
        
        if not project:
            return jsonify({'message': 'Project not found'}), 404
            
        return jsonify(project)
        
    except Exception as e:
        print(f"Error loading project: {e}")
        return jsonify({'message': 'Error loading project'}), 500

@projects_bp.route('/', methods=['POST'])
def create_project():
    """Create new project - POST /api/projects"""
    try:
        data = request.get_json()
        
        title = data.get('title')
        description = data.get('description')
        admin_name = data.get('adminName')
        admin_id = data.get('adminId')
        models = data.get('models', [])
        
        # Load existing projects
        projects = data_manager.load_projects()
        
        # Create new project
        new_project = {
            'id': int(time.time() * 1000),  # Millisecond timestamp like JavaScript Date.now()
            'title': title,
            'description': description,
            'adminName': admin_name,
            'adminId': admin_id,
            'models': models,
            'participants': [],  # Initialize empty participants array
            'createdDate': datetime.now().isoformat() + 'Z'
        }
        
        # Add project to list and save
        projects.append(new_project)
        
        if data_manager.save_projects(projects):
            return jsonify({'success': True, 'project': new_project})
        else:
            return jsonify({'message': 'Failed to save project data.'}), 500
            
    except Exception as e:
        print(f"Error creating project: {e}")
        return jsonify({'message': 'Error creating project'}), 500 