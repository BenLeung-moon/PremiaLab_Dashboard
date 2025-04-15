// 导出所有dashboard组件
// 以下是dashboard组件，未来会逐步从src/components/dashboard移动过来
export { default as PortfolioAnalyzer } from './PortfolioAnalyzer';
export { default as FactorAnalysisPage } from './FactorAnalysisPage';
export { default as ChatBar } from './ChatBar';
export { default as RiskMetrics } from './RiskMetrics';
export { default as FactorExposure } from './FactorExposure';
export { default as HistoricalTrends } from './HistoricalTrends';
export { default as PerformanceMetrics } from './PerformanceMetrics';
export { default as AssetAllocation } from './AssetAllocation';
export { default as Comparison } from './Comparison';
export { default as PortfolioComposition } from './PortfolioComposition';
export * from '../'; // 导出features/dashboard目录下的组件 