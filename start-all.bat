@echo off
echo ========================================
echo M.A.S.T.E.R. System Starting...
echo ========================================
echo.

start "M.A.S.T.E.R. Backend" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 3 /nobreak >nul

start "M.A.S.T.E.R. Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ========================================
echo Both services starting...
echo.
echo Please open: http://localhost:3000
echo.
echo Keep both windows running
echo ========================================
pause