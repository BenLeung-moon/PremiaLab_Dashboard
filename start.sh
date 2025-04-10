#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 日志函数
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# 显示标题
echo "====================================="
echo "PremiaLab Portfolio AI Assistant"
echo "====================================="

# 检查是否安装了必要的软件
if ! command -v node > /dev/null; then
  error "Node.js 未安装，请安装 Node.js"
  exit 1
fi

if ! command -v python3 > /dev/null; then
  error "Python 未安装，请安装 Python 3"
  exit 1
fi

# 创建必要的目录结构
mkdir -p frontend/public backend/app/{api,models,services}

# 启动前端
start_frontend() {
  log "启动前端服务..."
  cd frontend
  
  # 检查是否需要安装依赖
  if [ ! -d "node_modules" ]; then
    info "安装前端依赖..."
    npm install
  fi
  
  # 创建环境变量文件（如果不存在）
  if [ ! -f ".env" ]; then
    info "创建前端环境变量文件..."
    echo "VITE_API_URL=http://localhost:8000" > .env
  fi
  
  # 启动前端开发服务器
  npm run dev &
  FRONTEND_PID=$!
  log "前端服务已启动 (PID: $FRONTEND_PID)"
  cd ..
}

# 启动后端
start_backend() {
  log "启动后端服务..."
  cd backend
  
  # 检查是否存在虚拟环境，如果不存在则创建
  if [ ! -d "venv" ]; then
    info "创建Python虚拟环境..."
    python3 -m venv venv
  fi
  
  # 激活虚拟环境
  source venv/bin/activate
  
  # 检查是否需要安装依赖
  if ! pip freeze | grep -q "fastapi"; then
    info "安装后端依赖..."
    pip install -r requirements.txt
  fi
  
  # 创建环境变量文件（如果不存在）
  if [ ! -f ".env" ]; then
    info "创建后端环境变量文件..."
    echo "DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your_secret_key" > .env
  fi
  
  # 启动后端服务
  uvicorn app.main:app --reload &
  BACKEND_PID=$!
  log "后端服务已启动 (PID: $BACKEND_PID)"
  cd ..
}

# 清理函数
cleanup() {
  log "正在停止服务..."
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID
    log "前端服务已停止"
  fi
  
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID
    log "后端服务已停止"
  fi
  
  exit 0
}

# 注册清理函数
trap cleanup SIGINT SIGTERM

# 启动服务
start_frontend
start_backend

# 显示服务信息
info "服务已启动:"
info "- 前端: http://localhost:5173"
info "- 后端: http://localhost:8000"
info "按 Ctrl+C 停止所有服务"

# 保持脚本运行
while true; do
  sleep 1
done 