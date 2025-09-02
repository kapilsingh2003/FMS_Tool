#!/usr/bin/env python3
"""
Samsung FMS Portal - Python Backend Startup Script
"""

import sys
import os
from pathlib import Path

# Add the current directory to the Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Import and run the Flask app
from app import app

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Samsung FMS Portal - Python Backend")
    print("=" * 60)
    print("✅ Starting Flask server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🔗 Frontend should connect to this endpoint")
    print("=" * 60)
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True) 