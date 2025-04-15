import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext';

interface Stock {
  symbol: string;
  weight: number;
}

interface Portfolio {
  name: string;
  tickers: Stock[];
}

interface ManualPortfolioBuilderProps {
  onCancel: () => void;
  onSubmit: (portfolio: Portfolio) => void;
  availableStocks?: {symbol: string, name: string}[];
}

const ManualPortfolioBuilder: React.FC<ManualPortfolioBuilderProps> = ({ 
  onCancel, 
  onSubmit,
  availableStocks = [] 
}) => {
  const { t } = useLanguage();
  const [portfolioName, setPortfolioName] = useState(t('portfolio.defaultName'));
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: '', weight: 100 }
  ]);
  const [stockSuggestions, setStockSuggestions] = useState<{symbol: string, name: string}[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [focusedStockIndex, setFocusedStockIndex] = useState(-1);

  // 添加股票
  const addStock = () => {
    // 重新计算平均权重
    const newCount = stocks.length + 1;
    const newWeight = parseFloat((100 / newCount).toFixed(2));
    
    // 更新所有现有股票的权重为平均值
    const updatedStocks = stocks.map(stock => ({
      ...stock, 
      weight: newWeight
    }));
    
    // 添加新股票
    setStocks([...updatedStocks, {symbol: '', weight: newWeight}]);
  };

  // 移除股票
  const removeStock = (index: number) => {
    if (stocks.length <= 1) return;
    
    const newStocks = [...stocks];
    newStocks.splice(index, 1);
    
    // 重新计算平均权重
    const newWeight = parseFloat((100 / newStocks.length).toFixed(2));
    setStocks(newStocks.map(stock => ({...stock, weight: newWeight})));
  };

  // 更新股票信息
  const updateStock = (index: number, field: 'symbol' | 'weight', value: string | number) => {
    const newStocks = [...stocks];
    
    if (field === 'weight') {
      // 限制权重为数字并保留2位小数
      let numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      // 确保权重不为负数且不超过100
      numValue = Math.max(0, Math.min(100, numValue));
      
      // 保留2位小数
      numValue = parseFloat(numValue.toFixed(2));
      
      newStocks[index] = { ...newStocks[index], weight: numValue };
    } else {
      newStocks[index] = { ...newStocks[index], [field]: value as string };
    }
    
    setStocks(newStocks);
  };

  // 处理股票代码联想
  const handleStockSymbolChange = (index: number, value: string) => {
    updateStock(index, 'symbol', value);
    setFocusedStockIndex(index);
    
    if (value.trim() && availableStocks.length > 0) {
      const suggestions = availableStocks
        .filter(stock => 
          stock.symbol.toLowerCase().includes(value.toLowerCase()) || 
          (stock.name && stock.name.toLowerCase().includes(value.toLowerCase()))
        )
        .slice(0, 5); // 限制建议数量
      
      setStockSuggestions(suggestions);
      setActiveSuggestionIndex(-1);
    } else {
      setStockSuggestions([]);
    }
  };

  // 选择股票建议
  const selectStockSuggestion = (stock: {symbol: string, name: string}) => {
    if (focusedStockIndex >= 0) {
      updateStock(focusedStockIndex, 'symbol', stock.symbol);
    }
    setStockSuggestions([]);
    setActiveSuggestionIndex(-1);
  };

  // 验证并提交
  const handleSubmit = () => {
    // 验证逻辑
    if (!portfolioName.trim()) {
      alert(t('portfolio.nameRequired'));
      return;
    }
    
    if (stocks.some(stock => !stock.symbol.trim())) {
      alert(t('portfolio.symbolRequired'));
      return;
    }
    
    // 检查权重总和是否接近100
    const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.5) {
      alert(`${t('portfolio.weightSumError')} ${totalWeight.toFixed(1)}%`);
      return;
    }
    
    // 创建投资组合对象
    const portfolio: Portfolio = {
      name: portfolioName,
      tickers: stocks.map(stock => ({
        symbol: stock.symbol.toUpperCase(),
        weight: stock.weight / 100 // 转换为小数
      }))
    };

    onSubmit(portfolio);
  };
  
  // 键盘导航股票建议
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (stockSuggestions.length === 0) return;
    
    // 上下键导航
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < stockSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : stockSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      selectStockSuggestion(stockSuggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setStockSuggestions([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">
        {t('portfolio.createNew')}
      </h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('portfolio.nameLabel')}
        </label>
        <input
          type="text"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder={t('portfolio.namePlaceholder')}
        />
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('portfolio.stocksLabel')}
          </label>
          <button
            type="button"
            onClick={addStock}
            className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {t('portfolio.addStock')}
          </button>
        </div>
        
        <div className="space-y-3">
          {stocks.map((stock, index) => (
            <div key={index} className="relative flex space-x-2">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={stock.symbol}
                    onChange={(e) => handleStockSymbolChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onBlur={() => setTimeout(() => setStockSuggestions([]), 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('portfolio.symbolPlaceholder')}
                  />
                  
                  {/* 股票联想下拉菜单 */}
                  {stockSuggestions.length > 0 && focusedStockIndex === index && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                      {stockSuggestions.map((suggestion, i) => (
                        <li
                          key={suggestion.symbol}
                          className={`px-3 py-2 cursor-pointer ${i === activeSuggestionIndex ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                          onClick={() => selectStockSuggestion(suggestion)}
                        >
                          <div className="font-medium">{suggestion.symbol}</div>
                          {suggestion.name && <div className="text-xs text-gray-500">{suggestion.name}</div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="w-32">
                <div className="relative">
                  <input
                    type="number"
                    value={stock.weight}
                    onChange={(e) => updateStock(index, 'weight', e.target.value)}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('portfolio.weightPlaceholder')}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
              </div>
              {stocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStock(index)}
                  className="px-2 py-2 text-red-500 hover:text-red-700 focus:outline-none"
                  title={t('portfolio.removeStock')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {t('portfolio.cancel')}
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {t('portfolio.submit')}
        </button>
      </div>
    </div>
  );
};

export default ManualPortfolioBuilder; 