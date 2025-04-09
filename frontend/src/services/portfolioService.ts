import axios from 'axios';

const API_URL = '/api/portfolios';

interface Ticker {
  symbol: string;
  weight: number;
}

interface Portfolio {
  name: string;
  tickers: Ticker[];
}

/**
 * 提交投资组合到后端API
 * @param portfolio 投资组合数据
 * @returns Promise，包含API响应
 */
export const submitPortfolio = async (portfolio: Portfolio): Promise<any> => {
  try {
    const response = await axios.post(API_URL, portfolio);
    return response.data;
  } catch (error) {
    console.error('API调用失败:', error);
    throw new Error('无法提交投资组合');
  }
};

/**
 * 获取用户的投资组合列表
 * @returns Promise，包含投资组合数组
 */
export const getPortfolios = async (): Promise<Portfolio[]> => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('获取投资组合失败:', error);
    throw new Error('无法获取投资组合列表');
  }
}; 