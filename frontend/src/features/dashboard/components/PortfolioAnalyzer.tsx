import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { getPortfolioAnalysis, PortfolioAnalysis } from '../../../shared/services/portfolioService';
import { formatNumber, formatPercent } from '../../../shared/utils/formatting';

// 导入components
import { 
  AssetAllocation, 
  RiskMetrics, 
  Comparison, 
  FactorExposure,
  PerformanceMetrics,
  HistoricalTrends
} from '../';

// API调用状态
type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

const PortfolioAnalyzer: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { t } = useLanguage();
  
  // 分析数据和API状态
  const [analysisData, setAnalysisData] = useState<PortfolioAnalysis | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // 当前选中的分析标签
  const [activeTab, setActiveTab] = useState<string>('performance');
  
  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      if (!portfolioId) return;
      
      setApiStatus('loading');
      try {
        // 获取数据（测试模式由服务层的TEST_MODE控制）
        console.log('正在获取投资组合分析数据，ID:', portfolioId);
        const data = await getPortfolioAnalysis(portfolioId);
        console.log('获取到的数据:', data);
        console.log('性能指标:', data.performance);
        
        // 替换性能指标数据的获取方式
        setAnalysisData(data);
        setApiStatus('success');
      } catch (error) {
        console.error('Error fetching portfolio analysis:', error);
        setApiStatus('error');
        setErrorMessage('无法加载分析数据。请检查API连接或稍后重试。');
      }
    };
    
    fetchData();
  }, [portfolioId]);
  
  // 分析标签列表
  const tabs = [
    { id: 'performance', label: t('dashboard.performance') },
    { id: 'allocation', label: t('dashboard.allocation') },
    { id: 'risk', label: t('dashboard.risk') },
    { id: 'factors', label: '因子暴露' },
    { id: 'trends', label: '历史趋势' }
  ];
  
  // 渲染加载状态
  if (apiStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">加载分析数据中...</p>
      </div>
    );
  }
  
  // 渲染错误状态
  if (apiStatus === 'error') {
    return (
      <div className="bg-red-50 text-red-700 p-8 rounded-lg text-center">
        <h3 className="text-lg font-medium mb-2">数据加载错误</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }
  
  // 如果没有数据，显示空状态
  if (!analysisData) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <p className="text-gray-600">无分析数据可用</p>
      </div>
    );
  }
  
  // 创建一个基本的UI来展示从API获取的性能指标
  const renderPerformanceData = () => {
    const p = analysisData.performance;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-white p-6 rounded-lg shadow">
        <div className="space-y-2">
          <div className="text-sm text-gray-500">总收益</div>
          <div className="text-2xl font-bold text-gray-900">{formatPercent(p.totalReturn)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500">年化收益</div>
          <div className="text-2xl font-bold text-gray-900">{formatPercent(p.annualizedReturn)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500">波动率</div>
          <div className="text-2xl font-bold text-gray-900">{formatPercent(p.volatility)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500">夏普比率</div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(p.sharpeRatio)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500">最大回撤</div>
          <div className="text-2xl font-bold text-red-600">{formatPercent(p.maxDrawdown)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500">胜率</div>
          <div className="text-2xl font-bold text-gray-900">{formatPercent(p.winRate)}</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* 调试信息 */}
      <div className="bg-gray-100 p-2 text-xs font-mono overflow-auto">
        <p>Portfolio ID: {portfolioId}</p>
        <p>Total Return: {formatPercent(analysisData.performance.totalReturn)}</p>
        <p>Annualized Return: {formatPercent(analysisData.performance.annualizedReturn)}</p>
        <p>Sharp Ratio: {formatNumber(analysisData.performance.sharpeRatio)}</p>
      </div>
      
      {/* 分析标签切换 */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
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
      </div>
      
      {/* 分析内容 */}
      <div>
        {activeTab === 'performance' && (
          <div>
            <h2 className="text-xl font-medium mb-4">绩效分析</h2>
            <PerformanceMetrics data={analysisData.performance} />
          </div>
        )}
        
        {activeTab === 'allocation' && (
          <div>
            <h2 className="text-xl font-medium mb-4">资产配置分析</h2>
            <AssetAllocation portfolioId={portfolioId || ''} />
          </div>
        )}
        
        {activeTab === 'risk' && (
          <div>
            <h2 className="text-xl font-medium mb-4">风险分析</h2>
            <RiskMetrics data={analysisData.risk} />
          </div>
        )}
        
        {activeTab === 'factors' && (
          <div>
            <h2 className="text-xl font-medium mb-4">因子分析</h2>
            <FactorExposure factors={analysisData.factors} />
          </div>
        )}
        
        {activeTab === 'trends' && (
          <div>
            <h2 className="text-xl font-medium mb-4">历史趋势</h2>
            <HistoricalTrends 
              portfolioId={portfolioId} 
              historicalTrends={analysisData.historical_trends}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAnalyzer; 