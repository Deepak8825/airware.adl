@echo off
echo Starting AirWare Application...
echo.

echo [1/2] Starting Backend Service...
start "AirWare Backend" cmd /k "cd /d d:\airware\my-project\AQI\backend && call D:\airware\.venv\Scripts\activate.bat && python main.py"

echo [2/2] Starting Frontend Service...
timeout /t 3 /nobreak >nul
start "AirWare Frontend" cmd /k "cd /d d:\airware\my-project\AQI\front && npm run dev"

echo.
echo ✅ AirWare Application Started Successfully!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3001 (or 3000)
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to continue...
pause >nul