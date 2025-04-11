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

const Dashboard = ({ portfolioId = '' }) => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('performance')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const params = useParams();
  const currentPortfolioId = portfolioId || params.portfolioId || '';

  // Set portfolioId based on URL params or props
  useEffect(() => {
    if (currentPortfolioId) {
      // If portfolioId exists, show performance metrics by default
      setActiveTab('performance');
    }
  }, [currentPortfolioId]);

  const tabs = [
    { id: 'performance', label: t('dashboard.tabs.performance') },
    { id: 'holdings', label: t('dashboard.tabs.holdings') },
    { id: 'allocation', label: t('dashboard.tabs.allocation') },
    { id: 'comparison', label: t('dashboard.tabs.comparison') },
    { id: 'factors', label: t('dashboard.tabs.factors') },
    { id: 'risk', label: t('dashboard.tabs.risk') },
    { id: 'trends', label: t('dashboard.tabs.trends') },
  ]

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
            {t('navigation.backToChat')}
          </Link>
        </div>
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600">{t('dashboard.description')}</p>
          </div>
          {currentPortfolioId && (
            <div className="text-sm text-gray-500">
              {t('dashboard.portfolioId')}: {currentPortfolioId}
            </div>
          )}
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

        {activeTab === 'holdings' && <PortfolioComposition portfolioId={currentPortfolioId || 'test-portfolio'} />}
        
        {activeTab === 'allocation' && <AssetAllocation portfolioId={currentPortfolioId || 'test-portfolio'} />}
        
        {activeTab === 'comparison' && <Comparison portfolioId={currentPortfolioId || 'test-portfolio'} />}
        
        {(activeTab === 'performance' || activeTab === 'factors' || activeTab === 'risk' || activeTab === 'trends') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTab === 'performance' && <PerformanceMetrics />}
            {activeTab === 'factors' && <FactorExposure />}
            {activeTab === 'risk' && <RiskMetrics />}
            {activeTab === 'trends' && <HistoricalTrends />}
          </div>
        )}
      </div>

      {/* Settings panel - consistent with chat page */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">{t('settings.title')}</h2>

            {/* Language settings */}
            <div className="mb-6 border-b pb-6">
              <h3 className="text-md font-medium mb-3">{t('settings.language')}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700"
                >
                  {t('language.switchTo')}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                {t('settings.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 