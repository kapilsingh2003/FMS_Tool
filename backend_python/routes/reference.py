from flask import Blueprint, jsonify
import sys
import os

# Add the parent directory to the path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import data_manager

reference_bp = Blueprint('reference', __name__)

@reference_bp.route('/models', methods=['GET'])
def get_models():
    """Get models from models.csv - GET /api/reference/models"""
    try:
        models = data_manager.load_models()
        return jsonify(models)
    except Exception as e:
        print(f"Error reading models.csv: {e}")
        return jsonify({'message': 'Error reading models.csv'}), 500

@reference_bp.route('/branches', methods=['GET'])
def get_branches():
    """Get branches from branches.csv - GET /api/reference/branches"""
    try:
        branches = data_manager.load_branches()
        return jsonify(branches)
    except Exception as e:
        print(f"Error reading branches.csv: {e}")
        return jsonify({'message': 'Error reading branches.csv'}), 500 