# PremiaLab Dashboard 后端

投资组合分析仪表板的Python后端服务。

## 技术栈

- **FastAPI**: 现代、高性能、易于使用的Web框架
- **Pandas & NumPy**: 数据处理与数学计算
- **scikit-learn**: 机器学习功能，用于预测和风险分析
- **yfinance**: 获取市场数据
- **statsmodels**: 统计分析和因子模型实现

## 目录结构

```
backend/
├── app/                # 应用代码
│   ├── api/            # API路由定义
│   │   ├── endpoints/  # API端点实现
│   │   └── router.py   # API路由配置
│   ├── core/           # 核心配置
│   │   ├── config.py   # 应用配置
│   │   └── security.py # 安全配置
│   ├── models/         # 数据模型
│   │   ├── portfolio.py # 投资组合模型
│   │   └── factor.py   # 因子模型
│   ├── services/       # 业务逻辑
│   │   ├── portfolio.py # 投资组合服务
│   │   └── analysis.py  # 投资分析服务
│   ├── db/             # 数据库
│   │   └── database.py  # 数据库配置
│   ├── utils/          # 实用工具
│   │   ├── market_data.py # 市场数据获取
│   │   └── calculations.py # 计算工具
│   └── main.py         # 应用入口
├── tests/              # 测试
├── requirements.txt    # 依赖
└── README.md           # 文档
```

## 安装与运行

### 本地开发

1. 创建并激活虚拟环境:

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. 安装依赖:

```bash
pip install -r requirements.txt
```

3. 运行服务器:

```bash
uvicorn app.main:app --reload
```

服务器将在 http://localhost:8000 运行，API文档在 http://localhost:8000/docs

## API端点

### 投资组合管理

- `GET /api/portfolios` - 获取所有投资组合
- `GET /api/portfolios/{id}` - 获取特定投资组合
- `POST /api/portfolios` - 创建新投资组合
- `PUT /api/portfolios/{id}` - 更新投资组合
- `DELETE /api/portfolios/{id}` - 删除投资组合

### 分析服务

- `GET /api/analysis/performance/{portfolio_id}` - 获取绩效指标
- `GET /api/analysis/risk/{portfolio_id}` - 获取风险指标
- `GET /api/analysis/factors/{portfolio_id}` - 获取因子暴露
- `GET /api/analysis/trends/{portfolio_id}` - 获取历史趋势

## 数据模型

### 投资组合 (Portfolio)

```python
class Ticker(BaseModel):
    symbol: str
    weight: float

class Portfolio(BaseModel):
    id: Optional[str] = None
    name: str
    tickers: List[Ticker]
    created_at: Optional[datetime] = None
    user_id: Optional[str] = None
``` 