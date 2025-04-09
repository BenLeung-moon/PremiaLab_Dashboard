import { Request, Response } from 'express';
import Portfolio from '../models/Portfolio';

// 模拟数据库
let portfolios: Portfolio[] = [
  {
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
    const portfolio = portfolios[parseInt(id)];
    
    if (!portfolio) {
      return res.status(404).json({ message: '投资组合不存在' });
    }
    
    res.status(200).json(portfolio);
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
      name,
      tickers,
      createdAt: new Date()
    };
    
    portfolios.push(newPortfolio);
    
    res.status(201).json({
      success: true,
      id: portfolios.length - 1,
      message: '投资组合已成功创建',
      created_at: newPortfolio.createdAt.toISOString(),
      data: newPortfolio
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
}; 