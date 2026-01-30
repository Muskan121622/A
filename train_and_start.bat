@echo off
echo ========================================
echo AgriSphere AI - Train Model and Start
echo ========================================
echo.

echo Step 1: Training Archive4 Model...
echo This may take 30-60 minutes...
echo.
python train_archive4_model.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Training failed or was skipped.
    echo Starting servers with existing models...
    echo.
    timeout /t 3 /nobreak >nul
)

echo.
echo Step 2: Starting Backend Server...
start "AgriSphere Backend" cmd /k "python api_server.py"
timeout /t 5 /nobreak >nul

echo Step 3: Starting Frontend Server...
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
