import { useState, useEffect } from 'react'
import { useLanguage } from '../../shared/i18n/LanguageContext'
import { useParams, Link } from 'react-router-dom'
import LanguageSwitcher from '../../shared/components/LanguageSwitcher'
import PerformanceMetrics from './PerformanceMetrics'
import FactorExposure from './FactorExposure'
import RiskMetrics from './RiskMetrics'
import HistoricalTrends from './HistoricalTrends'
import AssetAllocation from './AssetAllocation'
import Comparison from './Comparison'
import PortfolioComposition from './PortfolioComposition'
import { getPortfolioAnalysis, mockPortfolioAnalysis, PortfolioAnalysis } from '../../services/portfolioService'

const Dashboard = ({ portfolioId = '' }) => {
  const { t, language, setLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState('performance')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const params = useParams();
  const currentPortfolioId = portfolioId || params.portfolioId || '';
  
  // 分析数据状态
  const [analysisData, setAnalysisData] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useMockData, setUseMockData] = useState(false);

  // 获取投资组合分析数据
  useEffect(() => {
    const fetchData = async () => {
      if (!currentPortfolioId) return;
      
      setLoading(true);
      setError('');
      
      try {
        console.log('Fetching portfolio data, useMockData:', useMockData);
        const data = useMockData 
          ? mockPortfolioAnalysis() 
          : await getPortfolioAnalysis(currentPortfolioId);
        
        console.log('API response:', data);
        console.log('Factors data:', data.factors);
        
        setAnalysisData(data);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setError('Failed to load portfolio data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentPortfolioId, useMockData]);

  // Set portfolioId based on URL params or props
  useEffect(() => {
    if (currentPortfolioId) {
      // If portfolioId exists, show performance metrics by default
      setActiveTab('performance');
    }
  }, [currentPortfolioId]);

  // 定义标签，确保翻译键存在于语言文件中
  const tabs = [
    { id: 'performance', label: language === 'en' ? 'Performance Metrics' : '绩效指标' },
    { id: 'holdings', label: language === 'en' ? 'Holdings' : '持仓明细' },
    { id: 'allocation', label: language === 'en' ? 'Asset Allocation' : '资产配置' },
    { id: 'comparison', label: language === 'en' ? 'Benchmark Comparison' : '基准比较' },
    { id: 'factors', label: language === 'en' ? 'Factor Exposure' : '因子暴露' },
    { id: 'risk', label: language === 'en' ? 'Risk Metrics' : '风险指标' },
    { id: 'trends', label: language === 'en' ? 'Historical Trends' : '历史趋势' },
  ]

  // 加载状态渲染
  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  // 错误状态渲染
  const renderError = () => (
    <div className="bg-red-50 text-red-700 p-8 rounded-lg mb-6">
      <h3 className="text-lg font-medium mb-2">{language === 'en' ? 'Error' : '错误'}</h3>
      <p className="mb-4">{error}</p>
      <div className="flex gap-4">
        <button 
          onClick={() => setUseMockData(true)}
          className="px-4 py-2 bg-white text-red-700 border border-red-300 rounded-md hover:bg-red-50"
        >
          {language === 'en' ? 'Use Mock Data' : '使用模拟数据'}
        </button>
        <button 
          onClick={() => { setUseMockData(false); setError(''); setLoading(true); }}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          {language === 'en' ? 'Try Again' : '重试'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top navigation bar - consistent with chat page */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-medium text-gray-800">
                PremiaLab AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                title={t('settings.title')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 bg-gray-50">
        {/* Back to chat button - positioned at top left */}
        <div className="mb-10 flex items-center">
          <Link 
            to="/"
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-md shadow-sm hover:bg-gray-50 text-gray-700 border border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {language === 'en' ? 'Back to Chat' : '返回对话'}
          </Link>
        </div>
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{language === 'en' ? 'Portfolio Analysis' : '投资组合分析'}</h1>
            <p className="text-gray-600">{language === 'en' ? 'View your portfolio analysis results' : '查看您的投资组合分析结果'}</p>
          </div>
          {currentPortfolioId && (
            <div className="text-sm text-gray-500">
              {language === 'en' ? 'Portfolio ID' : '投资组合ID'}: {currentPortfolioId}
            </div>
          )}
        </div>

        {/* 数据源切换 */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
          <span className="text-blue-700 text-sm">
            {useMockData 
              ? (language === 'en' ? 'Using mock data (development mode)' : '使用模拟数据（开发模式）') 
              : (language === 'en' ? `Analyzing portfolio ID: ${currentPortfolioId}` : `正在分析投资组合 ID: ${currentPortfolioId}`)}
          </span>
          <button 
            onClick={() => setUseMockData(!useMockData)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
          >
            {useMockData 
              ? (language === 'en' ? 'Use Real API' : '使用真实API') 
              : (language === 'en' ? 'Use Mock Data' : '使用模拟数据')}
          </button>
        </div>

        {/* 错误显示 */}
        {error && renderError()}

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

        {/* 加载状态 */}
        {loading && renderLoading()}

        {/* 已加载的内容 */}
        {!loading && !error && (
          <>
            {activeTab === 'holdings' && <PortfolioComposition portfolioId={currentPortfolioId || 'test-portfolio'} />}
            
            {activeTab === 'allocation' && <AssetAllocation portfolioId={currentPortfolioId || 'test-portfolio'} />}
            
            {activeTab === 'comparison' && <Comparison portfolioId={currentPortfolioId || 'test-portfolio'} />}
            
            {activeTab === 'performance' && <PerformanceMetrics data={analysisData?.performance} />}
            
            {/* Remove the grid wrapper to let components use full width */}
            {activeTab === 'factors' && <FactorExposure />}
            {activeTab === 'risk' && <RiskMetrics data={analysisData?.risk} />}
            {activeTab === 'trends' && <HistoricalTrends />}
          </>
        )}
      </div>

      {/* Settings panel - consistent with chat page */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">{t('settings.title')}</h2>

            {/* Language settings */}
            <div className="mb-6 border-b pb-6">
              <h3 className="text-md font-medium mb-3">{language === 'en' ? 'Language Settings' : '语言设置'}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                  className={`px-4 py-2 rounded-md border ${language === 'zh' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}
                >
                  中文
                </button>
                <button
                  onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                  className={`px-4 py-2 rounded-md border ${language === 'en' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                {language === 'en' ? 'Cancel' : '取消'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 