import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Link } from 'react-router-dom';
import PerformanceMetrics from './dashboard/PerformanceMetrics';
import FactorExposure from './dashboard/FactorExposure';
import RiskMetrics from './dashboard/RiskMetrics';
import HistoricalTrends from './dashboard/HistoricalTrends';
import AssetAllocation from './dashboard/AssetAllocation';
import Comparison from './dashboard/Comparison';
import ChatBar from './dashboard/ChatBar';
import PortfolioInput from './PortfolioInput';

interface Portfolio {
  id: string;
  name: string;
  created_at: string;
  tickers: {
    symbol: string;
    weight: number;
    name?: string;
    sector?: string;
    price?: number;
    change?: number;
  }[];
}

const mockPortfolio: Portfolio = {
  id: 'mock-1',
  name: '科技股投资组合',
  created_at: new Date().toISOString(),
  tickers: [
    { symbol: 'AAPL', weight: 0.40, name: 'Apple Inc.', sector: '科技', price: 173.57, change: 1.23 },
    { symbol: 'MSFT', weight: 0.30, name: 'Microsoft Corp.', sector: '科技', price: 402.28, change: -0.56 },
    { symbol: 'GOOGL', weight: 0.20, name: 'Alphabet Inc.', sector: '通信服务', price: 147.68, change: 0.34 },
    { symbol: 'AMZN', weight: 0.10, name: 'Amazon.com Inc.', sector: '消费者非必需品', price: 178.08, change: 2.12 }
  ]
};

const Dashboard: React.FC<{ portfolioId?: string }> = ({ portfolioId }) => {
  const { t } = useLanguage();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    // 模拟加载数据
    const loadPortfolio = async () => {
      setIsLoading(true);
      try {
        // 在实际应用中，这里会调用API获取投资组合数据
        // const response = await fetch(`/api/portfolios/${portfolioId}`);
        // const data = await response.json();
        
        // 使用模拟数据
        setTimeout(() => {
          setPortfolio(mockPortfolio);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('加载投资组合失败:', error);
        setIsLoading(false);
      }
    };

    loadPortfolio();
  }, [portfolioId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">加载投资组合数据...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-gray-600 mb-4">未找到投资组合数据</p>
        <Link 
          to="/" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          返回聊天
        </Link>
      </div>
    );
  }

  // 计算一些基本指标
  const totalValue = 10000; // 假设总价值为10000
  const dailyChange = portfolio.tickers.reduce(
    (sum, ticker) => sum + (ticker.change || 0) * ticker.weight, 
    0
  );
  
  const tabs = [
    { id: 'performance', label: t('dashboard.performance') },
    { id: 'allocation', label: t('dashboard.allocation') },
    { id: 'risk', label: t('dashboard.risk') },
    { id: 'comparison', label: t('dashboard.comparison') },
    { id: 'factors', label: '因子暴露' },
    { id: 'trends', label: '历史趋势' },
    { id: 'chat', label: 'AI助手' }
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-full px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{portfolio.name}</h1>
          <p className="text-sm text-gray-500">
            ID: {portfolio.id} | {t('chat.createdAt')}: {new Date(portfolio.created_at).toLocaleString()}
          </p>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 详细股票面板 - 始终显示 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            {activeTab === 'allocation' && <AssetAllocation portfolioId={portfolioId || 'test-123'} />}
            {activeTab === 'comparison' && <Comparison portfolioId={portfolioId || 'test-123'} />}
            
            {(activeTab === 'performance' || activeTab === 'factors' || activeTab === 'risk' || activeTab === 'trends') && (
              <div className="grid grid-cols-1 gap-6">
                {activeTab === 'performance' && <PerformanceMetrics />}
                {activeTab === 'factors' && <FactorExposure />}
                {activeTab === 'risk' && <RiskMetrics />}
                {activeTab === 'trends' && <HistoricalTrends />}
              </div>
            )}
            
            {activeTab === 'chat' && (
              <div className="h-[600px]">
                <ChatBar />
              </div>
            )}
          </div>

          {/* 右侧股票详情面板 */}
          <div className="space-y-6">
            {/* 股票持仓明细卡片 */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <h2 className="text-lg font-medium mb-4">{t('dashboard.holdings')}</h2>
              <div className="space-y-4">
                {portfolio.tickers.map(ticker => (
                  <div key={ticker.symbol} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">{ticker.symbol}</h3>
                        <p className="text-xs text-gray-500">{ticker.name}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${ticker.change && ticker.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {ticker.change && ticker.change >= 0 ? '+' : ''}{ticker.change ? (ticker.change * 100).toFixed(2) : 0}%
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">价格</span>
                      <span className="font-medium">${ticker.price?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">权重</span>
                      <span className="font-medium">{(ticker.weight * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">行业</span>
                      <span className="font-medium">{ticker.sector || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">市值</span>
                      <span className="font-medium">${(totalValue * ticker.weight).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 总览卡片 */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <h2 className="text-lg font-medium mb-4">{t('dashboard.overview')}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('dashboard.metrics')}</p>
                  <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('dashboard.performance')}</p>
                  <p className={`text-2xl font-bold ${dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dailyChange >= 0 ? '+' : ''}{(dailyChange * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* 返回按钮 */}
            <div className="flex justify-center">
              <Link 
                to="/" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                {t('chat.backToChat')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 辅助函数：为股票生成一致的颜色
function getColorForStock(symbol: string): string {
  const colors = [
    '#3B82F6', // blue-500
    '#EF4444', // red-500
    '#10B981', // green-500
    '#F59E0B', // amber-500
    '#8B5CF6', // purple-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
  ];
  
  // 简单的哈希函数来确定颜色
  const hash = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default Dashboard; 