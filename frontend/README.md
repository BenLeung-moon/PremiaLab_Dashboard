# PremiaLab 前端

## 项目结构

```
frontend/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── features/        # 按功能模块组织的代码
│   │   ├── chat/        # 聊天相关功能
│   │   ├── dashboard/   # 仪表板相关功能
│   │   └── portfolio/   # 投资组合相关功能
│   │
│   ├── shared/          # 共享模块
│   │   ├── components/  # 共享UI组件
│   │   ├── hooks/       # 自定义钩子
│   │   ├── i18n/        # 国际化
│   │   ├── layouts/     # 布局组件
│   │   ├── services/    # API服务
│   │   └── utils/       # 工具函数
│   │
│   ├── styles/          # 全局样式
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 入口文件
│
├── package.json         # 依赖管理
└── README.md            # 项目说明
```

## 开发指南

### 目录结构说明

- `features/`: 按照功能模块组织的代码，每个模块包含与该功能相关的组件
  - `chat/`: 包含聊天界面和聊天相关功能
  - `dashboard/`: 包含仪表板和各类分析图表
  - `portfolio/`: 包含投资组合管理相关功能

- `shared/`: 包含可以在多个功能模块之间共享的代码
  - `components/`: 通用UI组件，如按钮、表单元素等
  - `layouts/`: 页面布局组件，如头部、侧边栏等
  - `services/`: API服务和数据访问层
  - `utils/`: 工具函数和辅助方法
  - `hooks/`: 自定义React钩子
  - `i18n/`: 国际化文件和翻译

### 导入约定

推荐使用索引文件进行导入，例如：

```tsx
// 推荐
import { Dashboard, PerformanceMetrics } from 'features/dashboard';

// 不推荐
import Dashboard from 'features/dashboard/Dashboard';
import PerformanceMetrics from 'features/dashboard/PerformanceMetrics';
```

### 样式管理

本项目使用TailwindCSS进行样式管理，样式文件位于`src/styles/`目录。

## 运行项目

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 构建生产版本
npm run build
``` 