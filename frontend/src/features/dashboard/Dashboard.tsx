import { useState, useEffect } from 'react'
import PerformanceMetrics from './PerformanceMetrics'
import FactorExposure from './FactorExposure'
import RiskMetrics from './RiskMetrics'
import HistoricalTrends from './HistoricalTrends'
import AssetAllocation from './AssetAllocation'
import Comparison from './Comparison'

const Dashboard = ({ portfolioId = '' }) => {
  const [activeTab, setActiveTab] = useState('performance')

  // 根据URL参数或props设置portfolioId
  useEffect(() => {
    if (portfolioId) {
      // 如果有投资组合ID，默认显示性能指标
      setActiveTab('performance');
    }
  }, [portfolioId]);

  const tabs = [
    { id: 'performance', label: '历史表现' },
    { id: 'allocation', label: '资产配置' },
    { id: 'comparison', label: '对标比较' },
    { id: 'factors', label: '因子暴露' },
    { id: 'risk', label: '风险指标' },
    { id: 'trends', label: '历史趋势' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">投资组合分析仪表板</h1>
        <p className="text-gray-600">全面分析投资组合的表现、风险和资产配置</p>
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

      {activeTab === 'allocation' && <AssetAllocation portfolioId={portfolioId || 'test-123'} />}
      {activeTab === 'comparison' && <Comparison portfolioId={portfolioId || 'test-123'} />}
      
      {(activeTab === 'performance' || activeTab === 'factors' || activeTab === 'risk' || activeTab === 'trends') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'performance' && <PerformanceMetrics />}
          {activeTab === 'factors' && <FactorExposure />}
          {activeTab === 'risk' && <RiskMetrics />}
          {activeTab === 'trends' && <HistoricalTrends />}
        </div>
      )}
    </div>
  )
}

export default Dashboard 