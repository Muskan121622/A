@echo off
echo ========================================
echo AgriSphere AI - Complete Startup
echo ========================================
echo.

echo Step 1: Starting Backend Server...
start "AgriSphere Backend" cmd /k "python api_server.py"
timeout /t 5 /nobreak >nul

echo Step 2: Starting Frontend Server...
start "AgriSphere Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo All servers started!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080
echo.
echo Voice Assistant: http://localhost:8080/voice-assistant
echo Disease Detection: http://localhost:8080/disease-detection
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:8080

echo.
echo To stop servers, close the terminal windows.
