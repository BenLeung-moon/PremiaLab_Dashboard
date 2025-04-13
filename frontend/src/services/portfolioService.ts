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
  // 添加不同时间段表现数据
  timeFrames?: {
    ytd: PerformanceTimeFrame;
    oneYear: PerformanceTimeFrame;
    threeYear: PerformanceTimeFrame;
    fiveYear: PerformanceTimeFrame;
    tenYear?: PerformanceTimeFrame; // 可选，有些投资组合可能没有10年数据
  };
}

// 定义不同时间段的表现数据结构
export interface PerformanceTimeFrame {
  return: number;           // 百分比收益率
  annualized?: number;      // 年化收益率
  benchmarkReturn: number;  // 基准收益率
  excessReturn: number;     // 超额收益率
  volatility?: number;      // 波动率
  sharpe?: number;          // 夏普比率
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
  rawExposure?: number;
  positive: boolean;
}

export interface FactorCorrelation {
  factor1: string;
  factor2: string;
  correlation: number;
}

export interface RiskContribution {
  name: string;
  contribution: number;
  displayName?: string;
}

export interface FactorsData {
  styleFactors: FactorData[];
  industryFactors: FactorData[];
  countryFactors: FactorData[];
  otherFactors: FactorData[];
  factorCorrelations?: FactorCorrelation[];
  riskContributions?: RiskContribution[];
  hasCorrelationData?: boolean;
}

export interface PortfolioAnalysis {
  performance: PerformanceData;
  allocation: AllocationData;
  risk: RiskData[];
  comparison: ComparisonData[];
  factors: FactorsData;
}

// API常量
const API_URL = 'http://localhost:3001/api';

/**
 * 提交投资组合到后端
 */
export const submitPortfolio = async (portfolio: Portfolio, language?: string): Promise<Portfolio> => {
  try {
    // Add the current language as a query parameter if provided
    const queryParams = language ? `?lang=${language}` : '';
    const response = await axios.post(`${API_URL}/portfolios${queryParams}`, portfolio);
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
    const data = response.data;
    
    // 处理API响应中的数据结构差异
    // 确保risk是一个数组
    if (data.risk && !Array.isArray(data.risk)) {
      console.warn('API返回的risk不是数组格式，正在转换...');
      // 如果是对象，转换为数组
      if (typeof data.risk === 'object') {
        const riskArray: RiskData[] = [];
        for (const key in data.risk) {
          if (Object.prototype.hasOwnProperty.call(data.risk, key)) {
            const riskItem = data.risk[key];
            riskArray.push({
              name: key,
              value: typeof riskItem.value === 'string' ? riskItem.value : `${riskItem.value}`,
              status: riskItem.status || 'neutral',
              percentage: riskItem.percentage || 50
            });
          }
        }
        data.risk = riskArray;
      } else {
        // 如果不是对象也不是数组，设置为空数组
        data.risk = [];
      }
    }
    
    // 确保comparison是一个数组
    if (data.comparison && !Array.isArray(data.comparison)) {
      console.warn('API返回的comparison不是数组格式，正在转换...');
      // 如果是对象，转换为数组
      if (typeof data.comparison === 'object') {
        const comparisonArray: ComparisonData[] = [];
        for (const key in data.comparison) {
          if (Object.prototype.hasOwnProperty.call(data.comparison, key)) {
            const compItem = data.comparison[key];
            if (typeof compItem === 'object' && compItem !== null) {
              let portfolio = '';
              let benchmark = '';
              let difference = '';
              let positive = true;
              
              // 处理不同的数据格式
              if ('portfolio' in compItem && 'benchmark' in compItem) {
                portfolio = `${compItem.portfolio}`;
                benchmark = `${compItem.benchmark}`;
                
                // 计算差异
                if ('difference' in compItem) {
                  difference = compItem.difference;
                } else if ('excess' in compItem) {
                  difference = `${compItem.excess}`;
                  positive = compItem.excess >= 0;
                } else {
                  const portfolioVal = parseFloat(portfolio);
                  const benchmarkVal = parseFloat(benchmark);
                  if (!isNaN(portfolioVal) && !isNaN(benchmarkVal)) {
                    const diff = portfolioVal - benchmarkVal;
                    difference = diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
                    positive = diff >= 0;
                  }
                }
              } else if ('投资组合' in compItem && '基准' in compItem) {
                // 处理中文键名
                portfolio = `${compItem.投资组合}`;
                benchmark = `${compItem.基准}`;
                
                if ('差异' in compItem) {
                  difference = `${compItem.差异}`;
                } else if ('超额' in compItem) {
                  difference = `${compItem.超额}`;
                  positive = compItem.超额 >= 0;
                } else {
                  const portfolioVal = parseFloat(portfolio);
                  const benchmarkVal = parseFloat(benchmark);
                  if (!isNaN(portfolioVal) && !isNaN(benchmarkVal)) {
                    const diff = portfolioVal - benchmarkVal;
                    difference = diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
                    positive = diff >= 0;
                  }
                }
              }
              
              comparisonArray.push({
                metric: key,
                portfolio: portfolio,
                benchmark: benchmark,
                difference: difference,
                positive: positive
              });
            }
          }
        }
        data.comparison = comparisonArray;
      } else {
        // 如果不是对象也不是数组，设置为空数组
        data.comparison = [];
      }
    }
    
    return data;
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
      ],
      // 添加不同时间段表现数据
      timeFrames: {
        ytd: { 
          return: 8.4, 
          annualized: undefined, 
          benchmarkReturn: 5.2, 
          excessReturn: 3.2,
          volatility: 10.8,
          sharpe: 1.21
        },
        oneYear: { 
          return: 15.7, 
          annualized: 15.7, 
          benchmarkReturn: 12.5, 
          excessReturn: 3.2,
          volatility: 12.5,
          sharpe: 1.42
        },
        threeYear: { 
          return: 42.3, 
          annualized: 12.5, 
          benchmarkReturn: 35.6, 
          excessReturn: 6.7,
          volatility: 14.2,
          sharpe: 1.35
        },
        fiveYear: { 
          return: 78.6, 
          annualized: 12.3, 
          benchmarkReturn: 65.8, 
          excessReturn: 12.8,
          volatility: 15.1,
          sharpe: 1.28
        }
      }
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
        { name: 'size', exposure: 0.85, rawExposure: 0.80, positive: true },
        { name: 'value', exposure: -0.32, rawExposure: -0.30, positive: false },
        { name: 'momentum', exposure: 1.27, rawExposure: 1.20, positive: true },
        { name: 'quality', exposure: 0.53, rawExposure: 0.50, positive: true },
        { name: 'volatility', exposure: -0.21, rawExposure: -0.25, positive: false }
      ],
      industryFactors: [
        { name: 'technology', exposure: 0.92, rawExposure: 0.90, positive: true },
        { name: 'healthcare', exposure: 0.45, rawExposure: 0.45, positive: true },
        { name: 'financials', exposure: -0.18, rawExposure: -0.20, positive: false },
        { name: 'consumer', exposure: 0.22, rawExposure: 0.20, positive: true },
        { name: 'energy', exposure: -0.65, rawExposure: -0.60, positive: false }
      ],
      countryFactors: [
        { name: 'us', exposure: 0.78, rawExposure: 0.75, positive: true },
        { name: 'china', exposure: 0.52, rawExposure: 0.50, positive: true },
        { name: 'europe', exposure: -0.15, rawExposure: -0.15, positive: false },
        { name: 'japan', exposure: 0.08, rawExposure: 0.10, positive: true },
        { name: 'emergingmarkets', exposure: 0.31, rawExposure: 0.30, positive: true }
      ],
      otherFactors: [
        { name: 'liquidity', exposure: 0.24, rawExposure: 0.25, positive: true },
        { name: 'marketrisk', exposure: -0.35, rawExposure: -0.35, positive: false },
        { name: 'dividend', exposure: 0.12, rawExposure: 0.10, positive: true }
      ],
      factorCorrelations: [
        { factor1: 'value', factor2: 'growth', correlation: -0.65 },
        { factor1: 'value', factor2: 'quality', correlation: 0.45 },
        { factor1: 'momentum', factor2: 'volatility', correlation: -0.30 },
        { factor1: 'size', factor2: 'quality', correlation: 0.20 },
        { factor1: 'quality', factor2: 'volatility', correlation: -0.25 }
      ],
      riskContributions: [
        { name: 'value', contribution: 22.5 },
        { name: 'growth', contribution: 15.8 },
        { name: 'size', contribution: 12.7 },
        { name: 'momentum', contribution: 28.4 },
        { name: 'quality', contribution: 10.3 },
        { name: 'volatility', contribution: 10.3 }
      ],
      hasCorrelationData: true
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

// 添加缺失的函数
/**
 * 获取可用股票列表及名称
 */
export const getAvailableStocksWithNames = async (): Promise<{symbol: string, name: string}[]> => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      { symbol: 'AAPL', name: '苹果公司' },
      { symbol: 'MSFT', name: '微软公司' },
      { symbol: 'GOOGL', name: '谷歌' },
      { symbol: 'AMZN', name: '亚马逊' },
      { symbol: 'META', name: 'Meta平台' },
      { symbol: 'TSLA', name: '特斯拉' },
      { symbol: 'NVDA', name: '英伟达' },
      { symbol: 'JPM', name: '摩根大通' },
      { symbol: 'BAC', name: '美国银行' },
      { symbol: 'V', name: '维萨' }
    ];
  } catch (error) {
    console.error('获取可用股票列表失败:', error);
    throw error;
  }
};

/**
 * 股票名称映射
 */
export const stockNameMapping: Record<string, string> = {
  'AAPL': '苹果公司',
  'MSFT': '微软公司',
  'GOOGL': '谷歌',
  'AMZN': '亚马逊',
  'META': 'Meta平台',
  'TSLA': '特斯拉',
  'NVDA': '英伟达',
  'JPM': '摩根大通',
  'BAC': '美国银行',
  'V': '维萨'
}; 