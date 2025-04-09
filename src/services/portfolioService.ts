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
    // 在实际应用中，这应该是一个实际的API调用
    // 例如: 
    // const response = await fetch('/api/portfolios', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(portfolio),
    // });
    // return await response.json();

    // 目前，我们只是模拟一个API调用
    console.log('投资组合数据已发送到API:', JSON.stringify(portfolio, null, 2));
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟API响应
    return {
      success: true,
      id: `portfolio_${Math.floor(Math.random() * 10000)}`,
      message: '投资组合已成功创建',
      created_at: new Date().toISOString(),
      data: portfolio
    };
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
  // 在实际应用中，这应该从API获取数据
  // 这里我们返回一些模拟数据
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      name: '科技股组合',
      tickers: [
        { symbol: 'AAPL', weight: 0.25 },
        { symbol: 'MSFT', weight: 0.25 },
        { symbol: 'GOOGL', weight: 0.2 },
        { symbol: 'AMZN', weight: 0.15 },
        { symbol: 'META', weight: 0.15 }
      ]
    },
    {
      name: '稳健型投资',
      tickers: [
        { symbol: 'VTI', weight: 0.4 },
        { symbol: 'BND', weight: 0.3 },
        { symbol: 'VXUS', weight: 0.2 },
        { symbol: 'GLD', weight: 0.1 }
      ]
    }
  ];
}; 