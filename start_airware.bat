@echo off
echo Starting AirWare Application...

REM Start Backend Service
echo Starting Backend Service...
start "AirWare Backend" cmd /c "cd /d d:\airware\my-project\AQI\backend && D:\airware\.venv\Scripts\python.exe main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend Service
echo Starting Frontend Service...
start "AirWare Frontend" cmd /c "cd /d d:\airware\my-project\AQI\front && npm run dev"

echo.
echo AirWare Services Starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul