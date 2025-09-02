@echo off
echo ============================================================
echo Samsung FMS Portal - Python Backend
echo ============================================================

echo.
echo [1/3] Navigating to Python backend directory...
cd backend_python

echo.
echo [2/3] Installing Python dependencies...
pip install Flask==2.3.3 Flask-CORS==4.0.0 python-dotenv==1.0.0

if %errorlevel% neq 0 (
    echo ❌ Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Starting Python backend server...
echo ============================================================
echo 🚀 Python Backend is starting...
echo 📍 Backend will be available at: http://localhost:5000
echo 🔗 Keep this window open while using the application
echo ============================================================
echo.

python start.py

pause
