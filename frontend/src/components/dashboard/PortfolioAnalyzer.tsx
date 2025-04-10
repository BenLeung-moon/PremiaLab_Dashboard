import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { getPortfolioAnalysis, mockPortfolioAnalysis, PortfolioAnalysis } from '../../services/portfolioService';
import PerformanceMetrics from './PerformanceMetrics';
import AssetAllocation from './AssetAllocation';
import RiskMetrics from './RiskMetrics';
import Comparison from './Comparison';
import FactorExposure from './FactorExposure';

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
  
  // 是否使用模拟数据 (用于开发测试)
  const [useMockData, setUseMockData] = useState<boolean>(false);
  
  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      if (!portfolioId) return;
      
      setApiStatus('loading');
      try {
        // 根据选择获取真实API数据或模拟数据
        const data = useMockData 
          ? mockPortfolioAnalysis() 
          : await getPortfolioAnalysis(portfolioId);
        
        setAnalysisData(data);
        setApiStatus('success');
      } catch (error) {
        console.error('Error fetching portfolio analysis:', error);
        setApiStatus('error');
        setErrorMessage('无法加载分析数据。请检查API连接或稍后重试。');
      }
    };
    
    fetchData();
  }, [portfolioId, useMockData]);
  
  // 分析标签列表
  const tabs = [
    { id: 'performance', label: t('dashboard.performance') },
    { id: 'allocation', label: t('dashboard.allocation') },
    { id: 'risk', label: t('dashboard.risk') },
    { id: 'comparison', label: t('dashboard.comparison') },
    { id: 'factors', label: '因子暴露' }
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
        <button 
          onClick={() => setUseMockData(true)}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          使用模拟数据
        </button>
      </div>
    );
  }
  
  // 如果没有数据，显示空状态
  if (!analysisData) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <p className="text-gray-600">无分析数据可用</p>
        <button 
          onClick={() => setUseMockData(true)}
          className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
        >
          使用模拟数据
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 数据源标志 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
        <span className="text-blue-700 text-sm">
          {useMockData 
            ? '当前使用模拟数据 (开发测试模式)' 
            : `正在分析投资组合 ID: ${portfolioId}`}
        </span>
        <button 
          onClick={() => setUseMockData(!useMockData)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
        >
          {useMockData ? '使用真实API' : '使用模拟数据'}
        </button>
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
            <AssetAllocation data={analysisData.allocation} />
          </div>
        )}
        
        {activeTab === 'risk' && (
          <div>
            <h2 className="text-xl font-medium mb-4">风险分析</h2>
            <RiskMetrics data={analysisData.risk} />
          </div>
        )}
        
        {activeTab === 'comparison' && (
          <div>
            <h2 className="text-xl font-medium mb-4">基准比较</h2>
            <Comparison data={analysisData.comparison} />
          </div>
        )}
        
        {activeTab === 'factors' && (
          <div>
            <h2 className="text-xl font-medium mb-4">因子分析</h2>
            <FactorExposure data={analysisData.factors} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAnalyzer; 