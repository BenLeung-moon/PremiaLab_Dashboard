# Financial Portfolio AI Assistant

[中文](#中文) | [English](#english)

## English

A modern portfolio analysis assistant powered by AI, providing intelligent investment insights and visualization.

### Features

- 💬 AI-powered chat interface for portfolio analysis
- 📊 Real-time portfolio data visualization
- 🌐 Multi-language support (English/Chinese)
- 🔄 Seamless integration with financial data sources
- 🔍 In-depth portfolio performance analysis
- 📈 SPX benchmark comparisons for portfolio evaluation
- ⏱️ Time-frame based historical trend analysis (YTD, 1Y, 3Y, 5Y)
- 🔄 Robust data handling with fallback mechanisms

### Project Structure

```
financial-portfolio-ai/
├── frontend/                # Frontend code (React + TypeScript)
│   ├── src/                 # Source code
│   │   ├── features/        # Feature-based code organization
│   │   │   ├── common/      # Common features
│   │   │   │   └── components/ # Shared UI components
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── LanguageSwitcher.tsx
│   │   │   │       └── ChatModeSwitcher.tsx
│   │   │   │
│   │   │   ├── dashboard/   # Dashboard features
│   │   │   │   └── components/ # Dashboard components
│   │   │   │
│   │   │   ├── chat/        # Chat interface and related features
│   │   │   │   ├── ChatHomePage.tsx
│   │   │   │   └── ChatBar.tsx
│   │   │   │
│   │   │   └── portfolio/   # Portfolio management features
│   │   │       └── components/ # Portfolio components
│   │   │           ├── ManualPortfolioBuilder.tsx
│   │   │           └── PortfolioInput.tsx
│   │   │
│   │   ├── shared/          # Shared utilities
│   │   │   ├── i18n/        # Internationalization
│   │   │   ├── utils/       # Utility functions
│   │   │   └── hooks/       # Custom React hooks
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
│   │   ├── api/             # API endpoints
│   │   │   ├── routes/      # Route handlers by domain
│   │   │   │   ├── portfolio.py     # Portfolio routes
│   │   │   │   ├── stocks.py        # Stocks data routes
│   │   │   │   └── analysis.py      # Analysis routes
│   │   │   └── router.py    # Main API router
│   │   │
│   │   ├── models/          # Data models
│   │   │   └── portfolio.py # Portfolio-related models
│   │   │
│   │   ├── services/        # Business logic
│   │   │   ├── portfolio_service.py  # Portfolio operations
│   │   │   ├── stocks_service.py     # Stock data operations
│   │   │   └── analysis_service.py   # Analysis operations
│   │   │
│   │   ├── utils/           # Utility functions
│   │   │   └── market_data.py # Market data functions
│   │   │
│   │   ├── data/            # Data storage
│   │   └── main.py          # Application entry point
│   │
│   └── requirements.txt     # Python dependencies
│
├── README.md                # Project documentation
├── start.sh                 # Unix/Linux/macOS startup script
└── start.bat                # Windows startup script
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite as build tool
- Zustand for state management
- Tailwind CSS for styling
- Material UI & Headless UI components
- Recharts & Chart.js for data visualization
- Axios & React Query for API communication
- React Router for routing

**Backend:**
- Python with FastAPI
- Pydantic for data validation
- Pandas for data processing
- NumPy for numerical operations
- JSON file-based data persistence

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
PORT=8000
ENVIRONMENT=development
```

### API Documentation

Once the backend is running, you can access the Swagger UI API documentation at:
http://localhost:8000/docs

The ReDoc documentation is available at:
http://localhost:8000/redoc

## 中文

一个由AI驱动的现代投资组合分析助手，提供智能投资洞察和可视化功能。

### 功能特点

- 💬 AI驱动的投资组合分析对话界面
- 📊 实时投资组合数据可视化
- 🌐 多语言支持（中文/英文）
- 🔄 与金融数据源的无缝集成
- 🔍 深入的投资组合绩效分析
- 📈 使用SPX作为基准进行投资组合评估
- ⏱️ 基于时间框架的历史趋势分析（年初至今、1年、3年、5年）
- 🔄 健壮的数据处理机制和备用解决方案

### 项目结构

```
financial-portfolio-ai/
├── frontend/                # 前端代码 (React + TypeScript)
│   ├── src/                 # 源代码
│   │   ├── features/        # 按功能模块组织的代码
│   │   │   ├── common/      # 共享功能
│   │   │   │   └── components/ # 共享UI组件
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── LanguageSwitcher.tsx
│   │   │   │       └── ChatModeSwitcher.tsx
│   │   │   │
│   │   │   ├── dashboard/   # 仪表盘功能
│   │   │   │   └── components/ # 仪表盘组件
│   │   │   │
│   │   │   ├── chat/        # 聊天功能
│   │   │   │   ├── ChatHomePage.tsx
│   │   │   │   └── ChatBar.tsx
│   │   │   │
│   │   │   └── portfolio/   # 投资组合功能
│   │   │       └── components/ # 投资组合组件
│   │   │           ├── ManualPortfolioBuilder.tsx
│   │   │           └── PortfolioInput.tsx
│   │   │
│   │   ├── shared/          # 共享工具
│   │   │   ├── i18n/        # 国际化
│   │   │   ├── utils/       # 工具函数
│   │   │   └── hooks/       # 自定义钩子
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
│   │   ├── api/             # API端点
│   │   │   ├── routes/      # 按领域划分的路由处理器
│   │   │   │   ├── portfolio.py     # 投资组合路由
│   │   │   │   ├── stocks.py        # 股票数据路由
│   │   │   │   └── analysis.py      # 分析路由
│   │   │   └── router.py    # 主API路由器
│   │   │
│   │   ├── models/          # 数据模型
│   │   │   └── portfolio.py # 投资组合相关模型
│   │   │
│   │   ├── services/        # 业务逻辑
│   │   │   ├── portfolio_service.py  # 投资组合操作
│   │   │   ├── stocks_service.py     # 股票数据操作
│   │   │   └── analysis_service.py   # 分析操作
│   │   │
│   │   ├── utils/           # 工具函数
│   │   │   └── market_data.py # 市场数据函数
│   │   │
│   │   ├── data/            # 数据存储
│   │   └── main.py          # 应用入口
│   │
│   └── requirements.txt     # Python依赖
│
├── README.md                # 项目说明
├── start.sh                 # Unix/Linux/macOS启动脚本 
└── start.bat                # Windows启动脚本
```

### 技术栈

**前端:**
- React 18 + TypeScript
- Vite 构建工具
- Zustand 状态管理
- Tailwind CSS 样式
- Material UI 和 Headless UI 组件
- Recharts 和 Chart.js 数据可视化
- Axios 和 React Query API通信
- React Router 路由

**后端:**
- Python + FastAPI
- Pydantic 数据验证
- Pandas 数据处理
- NumPy 数值计算
- JSON文件数据持久化

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
PORT=8000
ENVIRONMENT=development
```

### API文档

后端运行后，您可以访问Swagger UI API文档：
http://localhost:8000/docs

ReDoc文档可在以下位置访问：
http://localhost:8000/redoc

## License

MIT
