interface Ticker {
  symbol: string;
  weight: number;
  name?: string;
  sector?: string;
  price?: number;
  change?: number;
}

interface Portfolio {
  id?: string;
  name: string;
  tickers: Ticker[];
  createdAt: Date;
  userId?: string;
}

// 这里只是一个简单的模型接口
// 实际应用中可能会使用Mongoose或其他ORM来定义
export default Portfolio; 