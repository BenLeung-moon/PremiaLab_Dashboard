# PremiaLab Dashboard 前端

基于React和TypeScript构建的现代化投资组合分析仪表板，使用Vite作为构建工具，提供数据可视化和投资组合管理功能。

## 项目结构

```
frontend/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── features/        # 按功能模块组织的代码
│   │   ├── common/      # 共享功能组件
│   │   │   └── components/ # 共享UI组件
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── LanguageSwitcher.tsx
│   │   │       └── ChatModeSwitcher.tsx
│   │   │
│   │   ├── dashboard/   # 仪表板相关功能
│   │   │   └── components/ # 仪表板组件
│   │   │
│   │   ├── chat/        # 聊天相关功能
│   │   │   ├── ChatHomePage.tsx
│   │   │   └── ChatBar.tsx
│   │   │
│   │   └── portfolio/   # 投资组合相关功能
│   │       ├── components/ # 投资组合组件
│   │       │   └── ManualPortfolioBuilder.tsx
│   │       └── PortfolioInput.tsx
│   │
│   ├── shared/          # 共享模块
│   │   ├── i18n/        # 国际化
│   │   ├── utils/       # 工具函数
│   │   └── hooks/       # 自定义钩子
│   │
│   ├── styles/          # 全局样式
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 入口文件
│
├── package.json         # 依赖管理
└── README.md            # 项目说明
```

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand
- **UI组件**:
  - TailwindCSS
  - Material UI
  - Headless UI
- **数据可视化**: 
  - Recharts
  - Chart.js
- **API通信**: Axios + React Query
- **路由**: React Router

## 快速开始

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 导入约定

项目使用基于功能的模块化结构，推荐使用索引文件进行导入：

```typescript
// 推荐
import { PortfolioAnalyzer } from '@/features/dashboard/components';

// 不推荐
import PortfolioAnalyzer from '@/features/dashboard/components/PortfolioAnalyzer';
```

## 特性

- **投资组合分析**: 图表和数据分析工具
- **多语言支持**: 支持中英文切换
- **响应式设计**: 适配桌面和移动设备
- **实时数据**: 通过API获取最新投资组合数据
- **AI辅助**: 聊天界面提供智能投资建议

## 开发规范

- 使用功能模块化结构
- 共享组件放在`features/common/components`
- 特定功能组件放在相应的功能目录下
- 使用TailwindCSS进行样式管理 