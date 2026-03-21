@echo off
echo M.A.S.T.E.R. System Starting...
echo.

REM Get current directory
set "DIR=%~dp0"
cd /d "%DIR%"

echo [1/4] Installing Python dependencies...
pip install fastapi uvicorn pydantic python-dotenv -q

echo [2/4] Starting backend...
if exist "backend\main.py" (
    start "M.A.S.T.E.R. Backend" cmd /k "cd /d "%DIR%backend" && python main.py"
) else (
    echo ERROR: backend folder not found
)

echo [3/4] Starting frontend...
if exist "frontend\package.json" (
    start "M.A.S.T.E.R. Frontend" cmd /k "cd /d "%DIR%frontend" && npm install && npm run dev"
) else (
    echo ERROR: frontend folder not found
)

echo.
echo ========================================
echo Done! Please open: http://localhost:3000
echo ========================================
pause