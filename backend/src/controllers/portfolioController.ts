import { Request, Response } from 'express';
import Portfolio from '../models/Portfolio';

// 模拟数据库
let portfolios: Portfolio[] = [
  {
    id: 'port-1',
    name: '科技股组合',
    tickers: [
      { symbol: 'AAPL', weight: 0.25 },
      { symbol: 'MSFT', weight: 0.25 },
      { symbol: 'GOOGL', weight: 0.2 },
      { symbol: 'AMZN', weight: 0.15 },
      { symbol: 'META', weight: 0.15 }
    ],
    createdAt: new Date()
  },
  {
    id: 'port-2',
    name: '稳健型投资',
    tickers: [
      { symbol: 'VTI', weight: 0.4 },
      { symbol: 'BND', weight: 0.3 },
      { symbol: 'VXUS', weight: 0.2 },
      { symbol: 'GLD', weight: 0.1 }
    ],
    createdAt: new Date()
  }
];

// 获取所有投资组合
export const getAllPortfolios = (req: Request, res: Response) => {
  try {
    res.status(200).json(portfolios);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};

// 获取单个投资组合
export const getPortfolioById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 首先尝试通过ID查找
    const portfolio = portfolios.find(p => p.id === id);
    
    // 如果没找到，尝试通过索引查找（兼容旧行为）
    if (!portfolio && !isNaN(parseInt(id))) {
      const indexedPortfolio = portfolios[parseInt(id)];
      if (indexedPortfolio) {
        return res.status(200).json(indexedPortfolio);
      }
    }
    
    // 如果找到了通过ID匹配的投资组合，返回它
    if (portfolio) {
      return res.status(200).json(portfolio);
    }
    
    // 处理模拟数据，支持前端演示
    if (id === 'port-1' || id === 'port-2') {
      const mockPortfolio = {
        id: id,
        name: id === 'port-1' ? '科技股组合' : '多元化投资',
        tickers: id === 'port-1' ? 
          [
            { symbol: 'AAPL', weight: 0.3, name: "Apple Inc.", sector: "Technology" },
            { symbol: 'MSFT', weight: 0.3, name: "Microsoft Corp.", sector: "Technology" },
            { symbol: 'GOOGL', weight: 0.2, name: "Alphabet Inc.", sector: "Communication Services" },
            { symbol: 'AMZN', weight: 0.2, name: "Amazon.com Inc.", sector: "Consumer Discretionary" }
          ] : 
          [
            { symbol: 'SPY', weight: 0.4, name: "SPDR S&P 500 ETF", sector: "ETF" },
            { symbol: 'QQQ', weight: 0.3, name: "Invesco QQQ Trust", sector: "ETF" },
            { symbol: 'GLD', weight: 0.2, name: "SPDR Gold Shares", sector: "Commodities" },
            { symbol: 'VNQ', weight: 0.1, name: "Vanguard Real Estate ETF", sector: "Real Estate" }
          ],
        createdAt: new Date()
      };
      return res.status(200).json(mockPortfolio);
    }
    
    // 如果仍未找到投资组合，返回404错误
    return res.status(404).json({ message: '投资组合不存在' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};

// 创建新投资组合
export const createPortfolio = (req: Request, res: Response) => {
  try {
    const { name, tickers } = req.body;
    
    // 验证
    if (!name || !tickers || !Array.isArray(tickers)) {
      return res.status(400).json({ message: '无效的投资组合数据' });
    }
    
    // 验证权重总和
    const totalWeight = tickers.reduce((sum, ticker) => sum + ticker.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      return res.status(400).json({ 
        message: '权重总和必须为1',
        totalWeight
      });
    }
    
    const newPortfolio: Portfolio = {
      id: `port-${portfolios.length + 1}`,
      name,
      tickers,
      createdAt: new Date()
    };
    
    portfolios.push(newPortfolio);
    
    res.status(201).json({
      success: true,
      id: newPortfolio.id,
      message: '投资组合已成功创建',
      created_at: newPortfolio.createdAt.toISOString(),
      data: newPortfolio
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
}; 