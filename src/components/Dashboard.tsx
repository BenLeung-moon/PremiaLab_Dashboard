import { useState } from 'react'
import PerformanceMetrics from './dashboard/PerformanceMetrics'
import FactorExposure from './dashboard/FactorExposure'
import RiskMetrics from './dashboard/RiskMetrics'
import HistoricalTrends from './dashboard/HistoricalTrends'
import ChatBar from './Chat/ChatBar'
import PortfolioInput from './PortfolioInput'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('portfolio-input')

  const tabs = [
    { id: 'portfolio-input', label: '创建投资组合' },
    { id: 'performance', label: 'Performance Metrics' },
    { id: 'factors', label: 'Factor Exposure' },
    { id: 'risk', label: 'Risk Metrics' },
    { id: 'trends', label: 'Historical Trends' },
    { id: 'chat', label: '分析助手' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Analysis Dashboard</h1>
        <p className="text-gray-600">Comprehensive analysis of portfolio performance and risk metrics</p>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md ${
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

      {activeTab === 'portfolio-input' && <PortfolioInput />}
      
      {activeTab !== 'chat' && activeTab !== 'portfolio-input' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'performance' && <PerformanceMetrics />}
          {activeTab === 'factors' && <FactorExposure />}
          {activeTab === 'risk' && <RiskMetrics />}
          {activeTab === 'trends' && <HistoricalTrends />}
        </div>
      ) : (
        activeTab === 'chat' && (
          <div className="h-[600px]">
            <ChatBar />
          </div>
        )
      )}
    </div>
  )
}

export default Dashboard 