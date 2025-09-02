from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from pathlib import Path

# Import route blueprints
from routes.auth import auth_bp
from routes.users import users_bp
from routes.projects import projects_bp
from routes.reference import reference_bp

app = Flask(__name__)

# Configure CORS
CORS(app, origins=['http://localhost:3000'], supports_credentials=True)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(projects_bp, url_prefix='/api/projects')
app.register_blueprint(reference_bp, url_prefix='/api/reference')

# Serve static files from the React app build folder
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """Serve React app for all unmatched routes"""
    build_dir = Path(__file__).parent.parent / 'frontend' / 'build'
    
    # If the file exists in build directory, serve it
    if path != "" and (build_dir / path).exists():
        return send_from_directory(str(build_dir), path)
    
    # Otherwise, serve index.html (for React Router)
    return send_from_directory(str(build_dir), 'index.html')

if __name__ == '__main__':
    print("🚀 Python Flask Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True) 