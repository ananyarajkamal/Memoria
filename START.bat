@echo off
echo Starting Memoria - Your Personal AI Memory Assistant...
echo.

echo [1/3] Starting Backend Server...
cd "C:\Users\amiia\OneDrive\Desktop\Personal AI Memory Assistant\backend"
start "Backend Server" cmd /k "python app.py"

echo [2/3] Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend...
cd "C:\Users\amiia\OneDrive\Desktop\Personal AI Memory Assistant\frontend"
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
