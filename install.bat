@echo off
cd /d %~dp0

echo ========================================
echo M.A.S.T.E.R. System v2.1 安装程序
echo ========================================
echo.

REM 检查是否以管理员运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [提示] 建议以管理员身份运行以获得最佳体验
    echo.
)

echo [1/7] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Python 未安装
    echo 请从 https://www.python.org/downloads/ 下载并安装 Python 3.10+
    echo 安装时请勾选 "Add Python to PATH"
    pause
    exit /b 1
)
echo     Python 已安装

echo [2/7] 升级 pip...
python -m pip install --upgrade pip -q

echo [3/7] 安装后端依赖...
pip install fastapi uvicorn[standard] pydantic python-dotenv openai anthropic aiohttp httpx -q
if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)
echo     后端依赖已安装

echo [4/7] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [警告] Node.js 未安装，前端将无法启动
    echo 如需前端界面，请从 https://nodejs.org/ 安装 Node.js 18+
) else (
    echo     Node.js 已安装
)

echo [5/7] 安装前端依赖...
if exist "frontend\package.json" (
    cd frontend
    call npm install --silent
    cd ..
    echo     前端依赖已安装
) else (
    echo [警告] 前端 package.json 未找到
)

echo [6/7] 创建配置文件...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy backend\.env.example backend\.env >nul
        echo     已创建配置文件 backend\.env
        echo.
        echo [重要] 请编辑 backend\.env 填入你的 API Keys
        echo.
    )
)

echo [7/7] 创建启动脚本...
echo @echo off > start-all.bat
echo title M.A.S.T.E.R. System >> start-all.bat
echo. >> start-all.bat
echo echo Starting M.A.S.T.E.R. System... >> start-all.bat
echo start "M.A.S.T.E.R. Backend" cmd /k "cd /d %%~dp0backend ^&^& python main.py" >> start-all.bat
echo timeout /t 2 /nobreak >> start-all.bat
echo start "M.A.S.T.E.R. Frontend" cmd /k "cd /d %%~dp0frontend ^&^& npm run dev" >> start-all.bat
echo. >> start-all.bat
echo echo System started! >> start-all.bat
echo echo Backend: http://localhost:8000 >> start-all.bat
echo echo Frontend: http://localhost:3000 >> start-all.bat
echo pause >> start-all.bat

echo.
echo ========================================
echo   安装完成! 
echo ========================================
echo.
echo 启动方式: 双击 start-all.bat
echo.
echo 访问地址:
echo   - 前端界面: http://localhost:3000
echo   - API 文档: http://localhost:8000/docs
echo.
echo 配置文件: backend\.env (需要填入 API Key)
echo.
echo 如需帮助: 查看 README.md
echo.
pause