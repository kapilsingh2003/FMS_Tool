@echo off
echo ============================================================
echo Samsung FMS Portal - Frontend (React)
echo ============================================================

echo.
echo [1/3] Navigating to frontend directory...
cd frontend

echo.
echo [2/3] Installing frontend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Starting React development server...
echo ============================================================
echo 🚀 React Frontend is starting...
echo 📍 Frontend will be available at: http://localhost:3000
echo 🔗 Make sure the Python backend is running on port 5000
echo ============================================================
echo.

call npm start

pause
