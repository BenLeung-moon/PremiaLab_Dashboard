@echo off
setlocal enabledelayedexpansion

:: 定义颜色
set "GREEN=[92m"
set "BLUE=[94m"
set "RED=[91m"
set "NC=[0m"

:: 日志函数
:log
echo %GREEN%[INFO]%NC% %~1
exit /b 0

:error
echo %RED%[ERROR]%NC% %~1
exit /b 0

:info
echo %BLUE%[INFO]%NC% %~1
exit /b 0

:: 显示标题
echo =====================================
echo PremiaLab Portfolio AI Assistant
echo =====================================

:: 检查是否安装了必要的软件
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    call :error "Node.js 未安装，请安装 Node.js"
    pause
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    call :error "Python 未安装，请安装 Python"
    pause
    exit /b 1
)

:: 创建必要的目录结构
if not exist frontend\public mkdir frontend\public
if not exist backend\app\api mkdir backend\app\api
if not exist backend\app\models mkdir backend\app\models
if not exist backend\app\services mkdir backend\app\services

:: 启动前端
call :log "启动前端服务..."
cd frontend

:: 检查是否需要安装依赖
if not exist node_modules (
    call :info "安装前端依赖..."
    call npm install
)

:: 创建环境变量文件（如果不存在）
if not exist .env (
    call :info "创建前端环境变量文件..."
    echo VITE_API_URL=http://localhost:8000 > .env
)

:: 启动前端开发服务器
start "PremiaLab Frontend" cmd /c "npm run dev"
call :log "前端服务已启动"
cd ..

:: 启动后端
call :log "启动后端服务..."
cd backend

:: 检查是否存在虚拟环境，如果不存在则创建
if not exist venv (
    call :info "创建Python虚拟环境..."
    python -m venv venv
)

:: 创建环境变量文件（如果不存在）
if not exist .env (
    call :info "创建后端环境变量文件..."
    (
        echo DATABASE_URL=postgresql://user:password@localhost:5432/dbname
        echo SECRET_KEY=your_secret_key
    ) > .env
)

:: 激活虚拟环境并启动后端服务
start "PremiaLab Backend" cmd /c "call venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload"
call :log "后端服务已启动"
cd ..

:: 显示服务信息
call :info "服务已启动:"
call :info "- 前端: http://localhost:5173"
call :info "- 后端: http://localhost:8000"
echo.
echo 请勿关闭启动的命令窗口，关闭窗口将停止相应的服务
echo 按任意键关闭此窗口...

pause > nul 