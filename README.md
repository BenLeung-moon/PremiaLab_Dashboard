# PremiaLab Portfolio AI Assistant

[中文](#中文) | [English](#english)

## English

A modern portfolio analysis assistant powered by AI, providing intelligent investment insights and visualization.

### Features

- 💬 AI-powered chat interface for portfolio analysis
- 📊 Real-time portfolio data visualization
- 🌐 Multi-language support (English/Chinese)
- 🔄 Seamless integration with financial data sources
- 🔍 In-depth portfolio performance analysis

### Project Structure

```
premialab-portfolio-ai/
├── frontend/                # Frontend code (React + TypeScript)
│   ├── src/                 # Source code
│   │   ├── features/        # Feature-based code organization
│   │   │   └── chat/        # Chat interface and related features
│   │   │
│   │   ├── shared/          # Shared modules
│   │   │   ├── components/  # Shared UI components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── i18n/        # Internationalization
│   │   │   ├── layouts/     # Layout components
│   │   │   ├── services/    # API services
│   │   │   └── utils/       # Utility functions
│   │   │
│   │   ├── styles/          # Global styles
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Entry point
│   │
│   ├── public/              # Static assets
│   ├── index.html           # HTML template
│   └── package.json         # Frontend dependencies
│
├── backend/                 # Backend code (Python + FastAPI)
│   ├── app/                 # Application code
│   │   ├── api/             # API routes
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   └── main.py          # Entry point
│   └── requirements.txt     # Python dependencies
│
├── README.md                # Project documentation
├── start.sh                 # Unix/Linux/macOS startup script
└── start.bat                # Windows startup script
```

### Quick Start

#### One-click Startup

We provide convenient scripts to start both frontend and backend services with a single command:

**For Windows:**
```
start.bat
```

**For Unix/Linux/macOS:**
```
chmod +x start.sh
./start.sh
```

These scripts will:
1. Check for required software (Node.js and Python)
2. Create necessary directory structures if they don't exist
3. Install dependencies if needed
4. Set up environment files if they don't exist
5. Start both frontend and backend services

#### Manual Startup

If you prefer to start services manually:

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend will run at http://localhost:5173.

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend will run at http://localhost:8000.

### Environment Setup

Create `.env` files in both frontend and backend directories:

Frontend (.env):
```
VITE_API_URL=http://localhost:8000
```

Backend (.env):
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your_secret_key
```

## 中文

一个由AI驱动的现代投资组合分析助手，提供智能投资洞察和可视化功能。

### 功能特点

- 💬 AI驱动的投资组合分析对话界面
- 📊 实时投资组合数据可视化
- 🌐 多语言支持（中文/英文）
- 🔄 与金融数据源的无缝集成
- 🔍 深入的投资组合绩效分析

### 项目结构

```
premialab-portfolio-ai/
├── frontend/                # 前端代码 (React + TypeScript)
│   ├── src/                 # 源代码
│   │   ├── features/        # 按功能模块组织的代码
│   │   │   └── chat/        # 聊天界面和相关功能
│   │   │
│   │   ├── shared/          # 共享模块
│   │   │   ├── components/  # 共享UI组件
│   │   │   ├── hooks/       # 自定义React钩子
│   │   │   ├── i18n/        # 国际化
│   │   │   ├── layouts/     # 布局组件
│   │   │   ├── services/    # API服务
│   │   │   └── utils/       # 工具函数
│   │   │
│   │   ├── styles/          # 全局样式
│   │   ├── App.tsx          # 主应用组件
│   │   └── main.tsx         # 入口文件
│   │
│   ├── public/              # 静态资源
│   ├── index.html           # HTML模板
│   └── package.json         # 前端依赖
│
├── backend/                 # 后端代码 (Python + FastAPI)
│   ├── app/                 # 应用代码
│   │   ├── api/             # API路由
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   └── main.py          # 入口文件
│   └── requirements.txt     # Python依赖
│
├── README.md                # 项目说明
├── start.sh                 # Unix/Linux/macOS启动脚本 
└── start.bat                # Windows启动脚本
```

### 快速开始

#### 一键启动

我们提供了方便的脚本，可以用一个命令同时启动前端和后端服务：

**Windows系统:**
```
start.bat
```

**Unix/Linux/macOS系统:**
```
chmod +x start.sh
./start.sh
```

这些脚本将：
1. 检查必需的软件（Node.js和Python）
2. 如果不存在则创建必要的目录结构
3. 如果需要则安装依赖
4. 如果不存在则设置环境文件
5. 启动前端和后端服务

#### 手动启动

如果您更喜欢手动启动服务：

**前端:**
```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 运行。

**后端:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows系统: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端将在 http://localhost:8000 运行。

### 环境设置

在前端和后端目录中创建 `.env` 文件：

前端 (.env):
```
VITE_API_URL=http://localhost:8000
```

后端 (.env):
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your_secret_key
```

## License

MIT
