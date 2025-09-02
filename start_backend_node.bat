@echo off
echo ============================================================
echo Samsung FMS Portal - Node.js Backend
echo ============================================================

echo.
echo [1/3] Navigating to Node.js backend directory...
cd backend

echo.
echo [2/3] Installing Node.js dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Starting Node.js backend server...
echo ============================================================
echo 🚀 Node.js Backend is starting...
echo 📍 Backend will be available at: http://localhost:5000
echo 🔗 Keep this window open while using the application
echo ============================================================
echo.

node server.js

pause
