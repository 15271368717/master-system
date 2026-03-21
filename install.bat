@echo off
cd /d %~dp0

echo ========================================
echo M.A.S.T.E.R. System v2.1 Installer
echo ========================================
echo.

echo [1/5] Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

echo [2/5] Installing backend dependencies...
pip install fastapi uvicorn pydantic python-dotenv -q

echo [3/5] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Please install Node.js 18+ from nodejs.org
    pause
    exit /b 1
)

echo [4/5] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo [5/5] Creating startup scripts...
echo @start cmd /k "cd /d %%~dp0backend && python main.py" > start-backend.bat
echo @start cmd /k "cd /d %%~dp0frontend && npm run dev" > start-frontend.bat
echo @echo off > start-all.bat
echo start "M.A.S.T.E.R. Backend" cmd /k "cd /d %%~dp0backend ^&^& python main.py" >> start-all.bat
echo timeout /t 3 /nobreak >> start-all.bat
echo start "M.A.S.T.E.R. Frontend" cmd /k "cd /d %%~dp0frontend ^&^& npm run dev" >> start-all.bat

echo.
echo ========================================
echo INSTALL COMPLETE!
echo.
echo Open browser: http://localhost:3000
echo.
echo Double-click: start-all.bat
echo ========================================
pause