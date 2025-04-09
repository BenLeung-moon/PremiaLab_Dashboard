# PremiaLab Dashboard

## 简体中文

投资组合分析仪表板，包含数据可视化和投资组合管理功能。

### 项目结构

```
premia-lab-dashboard/
├── frontend/               # 前端代码 (React + TypeScript)
│   ├── src/                # 源代码
│   │   ├── components/     # UI组件
│   │   ├── services/       # API服务
│   │   ├── App.tsx         # 主应用组件
│   │   └── main.tsx        # 入口文件
│   ├── public/             # 静态资源
│   ├── index.html          # HTML模板
│   └── package.json        # 前端依赖
│
├── backend/                # 后端代码 (Python + FastAPI)
│   ├── app/                # 应用代码
│   │   ├── api/            # API路由
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── main.py         # 入口文件
│   ├── requirements.txt    # Python依赖
│   └── README.md           # 后端说明
│
└── README.md               # 项目说明
```

### 快速开始

#### 前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:3000 运行。

#### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端将在 http://localhost:8000 运行。

### 前端 API 说明

前端通过 `src/services` 目录下的服务模块与后端通信。主要API包括：

#### 投资组合管理 API

`frontend/src/services/portfolioService.ts` 提供以下功能：

```typescript
// 提交新的投资组合
submitPortfolio(portfolio: Portfolio): Promise<any>

// 获取所有投资组合
getPortfolios(): Promise<Portfolio[]>
```

投资组合的数据结构：

```typescript
interface Portfolio {
  name: string;       // 投资组合名称
  tickers: Ticker[];  // 股票列表
}

interface Ticker {
  symbol: string;     // 股票代码
  weight: number;     // 权重 (0-1之间的小数)
}
```

### 后端 API 说明

后端提供 RESTful API，使用 FastAPI 框架开发。

#### 主要端点

- `GET /api/portfolios` - 获取所有投资组合
- `GET /api/portfolios/{id}` - 获取特定ID的投资组合
- `POST /api/portfolios` - 创建新投资组合
- `GET /api/health` - 健康检查

#### 后端依赖

后端项目主要依赖（见 `requirements.txt`）：

```
fastapi==0.95.1
uvicorn==0.22.0
pydantic==1.10.7
pandas==2.0.0
numpy==1.24.3
scikit-learn==1.2.2
python-dotenv==1.0.0
httpx==0.24.0
```

### 功能

- 投资组合创建与管理
- 绩效分析与可视化
- 风险评估
- 因子暴露分析
- 历史趋势查看
- 分析助手聊天功能

---

## English

Portfolio analysis dashboard with data visualization and portfolio management features.

### Project Structure

```
premia-lab-dashboard/
├── frontend/               # Frontend code (React + TypeScript)
│   ├── src/                # Source code
│   │   ├── components/     # UI components
│   │   ├── services/       # API services
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   ├── index.html          # HTML template
│   └── package.json        # Frontend dependencies
│
├── backend/                # Backend code (Python + FastAPI)
│   ├── app/                # Application code
│   │   ├── api/            # API routes
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── main.py         # Entry point
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
│
└── README.md               # Project documentation
```

### Quick Start

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at http://localhost:3000.

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend will run at http://localhost:8000.

### Frontend API Documentation

The frontend communicates with the backend through service modules in the `src/services` directory. Main APIs include:

#### Portfolio Management API

`frontend/src/services/portfolioService.ts` provides the following functions:

```typescript
// Submit a new portfolio
submitPortfolio(portfolio: Portfolio): Promise<any>

// Get all portfolios
getPortfolios(): Promise<Portfolio[]>
```

Portfolio data structure:

```typescript
interface Portfolio {
  name: string;       // Portfolio name
  tickers: Ticker[];  // Stock list
}

interface Ticker {
  symbol: string;     // Stock symbol
  weight: number;     // Weight (decimal between 0-1)
}
```

### Backend API Documentation

The backend provides RESTful APIs developed with the FastAPI framework.

#### Main Endpoints

- `GET /api/portfolios` - Get all portfolios
- `GET /api/portfolios/{id}` - Get a specific portfolio by ID
- `POST /api/portfolios` - Create a new portfolio
- `GET /api/health` - Health check

#### Backend Dependencies

Main backend dependencies (see `requirements.txt`):

```
fastapi==0.95.1
uvicorn==0.22.0
pydantic==1.10.7
pandas==2.0.0
numpy==1.24.3
scikit-learn==1.2.2
python-dotenv==1.0.0
httpx==0.24.0
```

### Features

- Portfolio creation and management
- Performance analysis and visualization
- Risk assessment
- Factor exposure analysis
- Historical trends viewing
- Analysis assistant chat functionality 