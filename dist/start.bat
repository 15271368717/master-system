@echo off
echo ========================================
echo   M.A.S.T.E.R. System 启动器
echo   多智能体协同任务调度系统
echo ========================================
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.10+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/4] 检查依赖...
pip install fastapi uvicorn pydantic python-dotenv -q 2>nul

echo [2/4] 启动后端服务...
start "M.A.S.T.E.R. Backend" cmd /k "cd /d %~dp0backend && python main.py"

echo [3/4] 等待服务就绪...
timeout /t 3 /nobreak >nul

echo [4/4] 启动前端...
start "M.A.S.T.E.R. Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo ========================================
echo   启动完成！
echo.
echo   请在浏览器打开: http://localhost:3000
echo.
echo   后端 API: http://localhost:8000
echo   API 文档: http://localhost:8000/docs
echo ========================================
echo.
pause