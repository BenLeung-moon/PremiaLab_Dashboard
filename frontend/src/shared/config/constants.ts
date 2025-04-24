/**
 * 应用全局常量
 */

// API 基础URL - 确保在使用前处理正确
const getApiBaseUrl = () => {
  const envUrl = typeof process !== 'undefined' && process.env 
    ? process.env.NEXT_PUBLIC_API_URL 
    : undefined;
  
  if (envUrl) {
    console.log('Using environment API URL:', envUrl);
    return envUrl;
  }
  
  // 默认开发环境URL
  const defaultUrl = 'http://localhost:3001/api';
  console.log('Using default API URL:', defaultUrl);
  return defaultUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// 其他常量
export const APP_NAME = 'PremiaLab Dashboard';
export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'zh'];

// 风险指标状态颜色
export const RISK_STATUS_COLORS = {
  good: 'green',
  neutral: 'yellow',
  bad: 'red',
  low: 'green',
  medium: 'yellow',
  high: 'red'
};

// 资产类别颜色
export const ASSET_CLASS_COLORS = {
  Equity: '#4299E1',
  FixedIncome: '#48BB78',
  Alternative: '#ED8936',
  Cash: '#A0AEC0',
  Commodity: '#F6AD55',
  RealEstate: '#FC8181',
  Other: '#CBD5E0'
};

// 分析图表颜色
export const CHART_COLORS = {
  primary: '#3182CE',
  secondary: '#4FD1C5',
  tertiary: '#F6AD55',
  quaternary: '#FC8181',
  background: '#EDF2F7'
};

// 时间周期选项
export const TIME_PERIODS = [
  { value: 'ytd', label: 'YTD' },
  { value: '1year', label: '1 Year' },
  { value: '3year', label: '3 Years' },
  { value: '5year', label: '5 Years' },
]; 