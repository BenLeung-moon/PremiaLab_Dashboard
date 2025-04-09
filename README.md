# PremiaLab Dashboard

投资组合分析仪表板，包含数据可视化和投资组合管理功能。

## 项目结构

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

## 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:3000 运行。

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端将在 http://localhost:8000 运行。

## 前端 API 说明

前端通过 `src/services` 目录下的服务模块与后端通信。主要API包括：

### 投资组合管理 API

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

## 后端 API 说明

后端提供 RESTful API，使用 FastAPI 框架开发。

### 主要端点

- `GET /api/portfolios` - 获取所有投资组合
- `GET /api/portfolios/{id}` - 获取特定ID的投资组合
- `POST /api/portfolios` - 创建新投资组合
- `GET /api/health` - 健康检查

### 后端依赖

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

## 功能

- 投资组合创建与管理
- 绩效分析与可视化
- 风险评估
- 因子暴露分析
- 历史趋势查看
- 分析助手聊天功能 