# PremiaLab Dashboard

投资组合分析仪表板，包含数据可视化和投资组合管理功能。

## 项目结构

```
premia-lab-dashboard/
├── frontend/               # 前端代码
│   ├── src/                # 源代码
│   │   ├── components/     # UI组件
│   │   ├── services/       # API服务
│   │   ├── App.tsx         # 主应用组件
│   │   └── main.tsx        # 入口文件
│   ├── public/             # 静态资源
│   ├── index.html          # HTML模板
│   └── package.json        # 前端依赖
│
├── backend/                # 后端代码
│   ├── src/                # 源代码
│   │   ├── controllers/    # API控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API路由
│   │   └── index.ts        # 入口文件
│   └── package.json        # 后端依赖
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

### 后端

```bash
cd backend
npm install
npm run dev
```

## 功能

- 投资组合创建与管理
- 绩效分析与可视化
- 风险评估
- 因子暴露分析
- 历史趋势查看
- 分析助手聊天功能 