import axios from 'axios';

// 接口定义
export interface Ticker {
  symbol: string;
  weight: number;
  name?: string;
  sector?: string;
  price?: number;
  change?: number;
}

export interface Portfolio {
  id?: string;
  name: string;
  tickers: Ticker[];
  created_at?: string;
}

export interface PerformanceData {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  monthlyReturns: Array<{month: string, return: number}>;
}

export interface AllocationData {
  sector: Array<{type: string, percentage: number}>;
  geography: Array<{region: string, percentage: number}>;
}

export interface RiskData {
  name: string;
  value: string;
  status: string;
  percentage: number;
}

export interface ComparisonData {
  metric: string;
  portfolio: string;
  benchmark: string;
  difference: string;
  positive: boolean;
}

export interface FactorData {
  name: string;
  exposure: number;
  positive: boolean;
}

export interface FactorsData {
  styleFactors: FactorData[];
  macroFactors: FactorData[];
}

export interface PortfolioAnalysis {
  performance: PerformanceData;
  allocation: AllocationData;
  risk: RiskData[];
  comparison: ComparisonData[];
  factors: FactorsData;
}

// API常量
const API_URL = '/api';

/**
 * 提交投资组合到后端
 */
export const submitPortfolio = async (portfolio: Portfolio): Promise<Portfolio> => {
  try {
    const response = await axios.post(`${API_URL}/portfolios`, portfolio);
    return response.data;
  } catch (error) {
    console.error('Failed to submit portfolio:', error);
    throw error;
  }
};

/**
 * 获取聊天消息相关的投资组合分析
 */
export const getChatPortfolioAnalysis = async (chatId: string): Promise<PortfolioAnalysis> => {
  try {
    const response = await axios.get(`${API_URL}/chat/${chatId}/portfolio-analysis`);
    return response.data;
  } catch (error) {
    console.error('获取聊天相关的投资组合分析失败:', error);
    throw error;
  }
};

/**
 * 获取用户的投资组合列表
 */
export const getPortfolioList = async (): Promise<Portfolio[]> => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 'port-1',
        name: '科技股组合',
        created_at: '2023-07-15T12:30:00Z',
        tickers: [
          { symbol: 'AAPL', weight: 0.3 },
          { symbol: 'MSFT', weight: 0.3 },
          { symbol: 'GOOGL', weight: 0.2 },
          { symbol: 'AMZN', weight: 0.2 }
        ]
      },
      {
        id: 'port-2',
        name: '多元化投资',
        created_at: '2023-07-10T09:45:00Z',
        tickers: [
          { symbol: 'SPY', weight: 0.4 },
          { symbol: 'QQQ', weight: 0.3 },
          { symbol: 'GLD', weight: 0.2 },
          { symbol: 'VNQ', weight: 0.1 }
        ]
      }
    ];
  } catch (error) {
    console.error('获取投资组合列表失败:', error);
    throw error;
  }
};

// 创建投资组合
export const createPortfolio = async (portfolio: Portfolio): Promise<Portfolio> => {
  try {
    const response = await axios.post(`${API_URL}/portfolios`, portfolio);
    return response.data;
  } catch (error) {
    console.error('创建投资组合失败:', error);
    throw error;
  }
};

// 获取所有投资组合
export const getPortfolios = async (): Promise<Portfolio[]> => {
  try {
    const response = await axios.get(`${API_URL}/portfolios`);
    return response.data;
  } catch (error) {
    console.error('获取投资组合列表失败:', error);
    throw error;
  }
};

// 获取单个投资组合
export const getPortfolio = async (portfolioId: string): Promise<Portfolio> => {
  try {
    const response = await axios.get(`${API_URL}/portfolios/${portfolioId}`);
    return response.data;
  } catch (error) {
    console.error(`获取投资组合 ${portfolioId} 失败:`, error);
    throw error;
  }
};

// 获取投资组合分析数据
export const getPortfolioAnalysis = async (portfolioId: string): Promise<PortfolioAnalysis> => {
  try {
    const response = await axios.get(`${API_URL}/portfolios/${portfolioId}/analyze`);
    return response.data;
  } catch (error) {
    console.error(`获取投资组合分析 ${portfolioId} 失败:`, error);
    throw error;
  }
};

// 生成模拟的投资组合分析数据（用于开发和测试）
export const mockPortfolioAnalysis = (): PortfolioAnalysis => {
  // 生成过去180天的模拟价格数据
  const generateTimeseriesData = (startValue: number, volatility: number) => {
    const result = [];
    let currentValue = startValue;
    const now = new Date();
    
    for (let i = 180; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 随机波动
      const change = (Math.random() - 0.5) * volatility;
      currentValue = currentValue * (1 + change);
      
      result.push({
        date: dateStr,
        value: parseFloat(currentValue.toFixed(2))
      });
    }
    
    return result;
  };
  
  // 生成模拟数据
  return {
    performance: {
      totalReturn: 15.7,
      annualizedReturn: 12.3,
      volatility: 12.5,
      sharpeRatio: 1.42,
      maxDrawdown: -8.5,
      winRate: 58.2,
      monthlyReturns: [
        { month: '一月', return: 3.2 },
        { month: '二月', return: -1.8 },
        { month: '三月', return: 2.1 },
        { month: '四月', return: 4.5 },
        { month: '五月', return: -0.7 },
        { month: '六月', return: 2.9 }
      ]
    },
    allocation: {
      sector: [
        { type: '科技', percentage: 32.5 },
        { type: '医疗健康', percentage: 15.8 },
        { type: '金融', percentage: 12.3 },
        { type: '消费品', percentage: 10.5 },
        { type: '通信服务', percentage: 8.7 },
        { type: '工业', percentage: 7.9 },
        { type: '能源', percentage: 5.3 },
        { type: '材料', percentage: 4.2 },
        { type: '公用事业', percentage: 2.8 },
      ],
      geography: [
        { region: '美国', percentage: 45.7 },
        { region: '中国', percentage: 21.5 },
        { region: '欧洲', percentage: 15.8 },
        { region: '日本', percentage: 7.3 },
        { region: '新兴市场', percentage: 9.7 }
      ]
    },
    risk: [
      { name: '波动率', value: '12.5%', status: 'medium', percentage: 60 },
      { name: '最大回撤', value: '-8.5%', status: 'low', percentage: 40 },
      { name: '下行风险', value: '12.3%', status: 'medium', percentage: 55 },
      { name: '贝塔系数', value: '0.85', status: 'high', percentage: 75 },
      { name: 'VaR (95%)', value: '-2.8%', status: 'low', percentage: 30 },
      { name: '夏普比率', value: '1.42', status: 'medium', percentage: 65 }
    ],
    comparison: [
      { metric: '年化收益率', portfolio: '12.3%', benchmark: '10.2%', difference: '+2.1%', positive: true },
      { metric: '夏普比率', portfolio: '1.42', benchmark: '0.9', difference: '+0.52', positive: true },
      { metric: '最大回撤', portfolio: '-8.5%', benchmark: '-18.2%', difference: '+9.7%', positive: true },
      { metric: '波动率', portfolio: '12.5%', benchmark: '16.4%', difference: '+3.9%', positive: false },
      { metric: '贝塔系数', portfolio: '0.85', benchmark: '1.00', difference: '+0.15', positive: false },
      { metric: '年化α值', portfolio: '2.1%', benchmark: '0.0%', difference: '+2.1%', positive: true }
    ],
    factors: {
      styleFactors: [
        { name: '规模', exposure: 0.85, positive: true },
        { name: '价值', exposure: -0.32, positive: false },
        { name: '动量', exposure: 1.27, positive: true },
        { name: '质量', exposure: 0.53, positive: true },
        { name: '波动性', exposure: -0.21, positive: false }
      ],
      macroFactors: [
        { name: '经济增长', exposure: 1.32, positive: true },
        { name: '通货膨胀', exposure: -0.45, positive: false },
        { name: '利率风险', exposure: 0.78, positive: true },
        { name: '信用风险', exposure: 0.41, positive: true },
        { name: '新兴市场', exposure: 0.66, positive: true }
      ]
    }
  };
};

// 获取可用的股票数据
export const getStocksData = async (): Promise<Record<string, any>> => {
  try {
    const response = await axios.get(`${API_URL}/stocks-data`);
    return response.data;
  } catch (error) {
    console.error('获取股票数据失败:', error);
    throw error;
  }
}; 