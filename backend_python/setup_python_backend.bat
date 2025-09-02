@echo off
echo ============================================================
echo Samsung FMS Portal - Python Backend Setup
echo ============================================================

echo.
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Checking data directory...
if not exist "data" (
    echo ⚠️  Data directory not found, copying from Node.js backend...
    xcopy "..\backend\data" "data" /E /I /Y
) else (
    echo ✅ Data directory exists
)

echo.
echo [3/4] Testing Python backend...
python -c "import flask; print('✅ Flask is available')"

if %errorlevel% neq 0 (
    echo ❌ Flask is not properly installed
    pause
    exit /b 1
)

echo.
echo [4/4] Starting Python backend server...
echo ============================================================
echo 🚀 Python Backend is starting...
echo 📍 Server will be available at: http://localhost:5000
echo 🔗 Keep this window open while using the application
echo ============================================================
echo.

python start.py

pause 