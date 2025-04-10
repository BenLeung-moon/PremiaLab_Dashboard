/**
 * PremiaLab Dashboard
 * 
 * 投资组合分析仪表板，包含数据可视化和投资组合管理功能。
 */

// 导出所有主要功能模块
export * from './src/features/dashboard';
export * from './src/features/chat';
export * from './src/features/portfolio';

// 导出共享组件
export * from './src/shared/components';
export * from './src/shared/layouts';

// 导出服务
export * from './src/shared/services';

// 单独导出主应用
export { default as App } from './src/App'; 