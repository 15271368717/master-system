@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   M.A.S.T.E.R. System v2.0 安装程序
echo   多智能体协同任务调度系统
echo ========================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 建议以管理员身份运行此脚本
    echo.
)

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 检查 Python
echo [1/6] 检查 Python 环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python
    echo.
    echo 请先安装 Python 3.10+ 
    echo 下载地址: https://www.python.org/downloads/
    echo.
    echo 安装时请勾选 "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo [2/6] 安装后端依赖...
pip install fastapi uvicorn pydantic python-dotenv -q
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)

REM 检查 Node.js
echo [3/6] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    echo.
    echo 请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [4/6] 安装前端依赖...
if not exist "frontend\package.json" (
    echo [错误] 未找到前端目录
    pause
    exit /b 1
)
cd frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo [5/6] 创建启动脚本...
(
echo @echo off
echo cd /d %%~dp0backend
echo echo 启动后端服务...
echo python main.py
echo pause
) > start-backend.bat

(
echo @echo off
echo cd /d %%~dp0frontend
echo echo 启动前端服务...
echo npm run dev
echo pause
) > start-frontend.bat

echo [6/6] 完成安装！
echo.
echo ========================================
echo 安装完成！
echo.
echo 启动方式：
echo.
echo 方案1 - 分开启动:
echo   1. 双击 [start-backend.bat] 启动后端
echo   2. 双击 [start-frontend.bat] 启动前端
echo   3. 浏览器打开 http://localhost:3000
echo.
echo 方案2 - 一键启动:
echo   双击 [start-all.bat]
echo.
echo ========================================
echo.

REM 创建一键启动脚本
(
echo @echo off
echo start "M.A.S.T.E.R. Backend" cmd /k "cd /d %%~dp0backend ^&^& python main.py"
echo timeout /t 3 /nobreak >nul
echo start "M.A.S.T.E.R. Frontend" cmd /k "cd /d %%~dp0frontend ^&^& npm run dev"
echo cls
echo ========================================
echo M.A.S.T.E.R. System 启动中...
echo.
echo 请在浏览器打开: http://localhost:3000
echo.
echo 提示：两个窗口请保持运行
echo ========================================
echo pause
) > start-all.bat

echo 创建快捷方式...
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\M.A.S.T.E.R..lnk');$s.TargetPath='%SCRIPT_DIR%start-all.bat';$s.WorkingDirectory='%SCRIPT_DIR%';$s.Save()"

echo.
echo [完成] 已创建桌面快捷方式
echo.
pause