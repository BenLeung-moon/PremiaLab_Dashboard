import { useState } from 'react';
import { submitPortfolio } from '../../../shared/services/portfolioService';
import { StockSearch } from '../../../shared/components/StockSearch';
import { StockInfo } from '../../../shared/hooks/useStockSearch';

interface Ticker {
  symbol: string;
  weight: number;
  info?: StockInfo | null;
}

const PortfolioInput = () => {
  const [tickers, setTickers] = useState<Ticker[]>([{ symbol: '', weight: 0, info: null }]);
  const [portfolioName, setPortfolioName] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', message: string }>({ 
    type: 'none', 
    message: '' 
  });
  const [isLoading, setIsLoading] = useState(false);

  const addTicker = () => {
    setTickers([...tickers, { symbol: '', weight: 0, info: null }]);
  };

  const removeTicker = (index: number) => {
    const newTickers = [...tickers];
    newTickers.splice(index, 1);
    setTickers(newTickers);
  };

  const updateTickerWeight = (index: number, value: number) => {
    const newTickers = [...tickers];
    newTickers[index] = { ...newTickers[index], weight: value };
    setTickers(newTickers);
  };

  const handleStockSelect = (index: number, stock: StockInfo | null) => {
    if (stock) {
      const newTickers = [...tickers];
      newTickers[index] = { 
        ...newTickers[index], 
        symbol: stock.symbol,
        info: stock
      };
      setTickers(newTickers);
    }
  };

  const validatePortfolio = () => {
    if (!portfolioName.trim()) {
      setStatus({ type: 'error', message: '请输入投资组合名称' });
      return false;
    }
    
    // 检查是否有空的ticker
    if (tickers.some(ticker => !ticker.symbol.trim())) {
      setStatus({ type: 'error', message: '请填写所有股票代码' });
      return false;
    }
    
    // 检查权重总和是否为100%
    const totalWeight = tickers.reduce((sum, ticker) => sum + Number(ticker.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      setStatus({ type: 'error', message: `权重总和必须为100%，当前总和为${totalWeight.toFixed(2)}%` });
      return false;
    }
    
    return true;
  };

  const handleSubmitPortfolio = async () => {
    if (!validatePortfolio()) return;
    
    try {
      setIsLoading(true);
      // 创建要发送的数据
      const portfolioData = {
        name: portfolioName,
        tickers: tickers.map(t => ({
          symbol: t.symbol.toUpperCase(),
          weight: Number(t.weight) / 100 // 转换为小数
        }))
      };
      
      // 使用服务提交数据
      const response = await submitPortfolio(portfolioData);
      
      setStatus({ 
        type: 'success', 
        message: `投资组合已成功提交！ID: ${response.id}` 
      });
      
      // 重置表单
      setPortfolioName('');
      setTickers([{ symbol: '', weight: 0, info: null }]);
      
    } catch (error) {
      console.error('提交失败:', error);
      setStatus({ type: 'error', message: '提交失败，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">创建投资组合</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">投资组合名称</label>
        <input
          type="text"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="输入投资组合名称"
        />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">股票列表</h3>
          <button
            type="button"
            onClick={addTicker}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            添加股票
          </button>
        </div>
        
        <div className="space-y-3">
          {tickers.map((ticker, index) => (
            <div key={index} className="flex space-x-3">
              <div className="flex-1">
                <StockSearch 
                  value={ticker.info}
                  onChange={(stock) => handleStockSelect(index, stock)}
                  placeholder="股票代码 (例如: AAPL)"
                  label=""
                />
              </div>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    value={ticker.weight}
                    onChange={(e) => updateTickerWeight(index, parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="权重"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
              </div>
              {tickers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTicker(index)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  删除
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {status.type !== 'none' && (
        <div className={`p-3 rounded-md mb-4 ${
          status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status.message}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmitPortfolio}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {isLoading ? '提交中...' : '提交投资组合'}
        </button>
      </div>
    </div>
  );
};

export default PortfolioInput; 