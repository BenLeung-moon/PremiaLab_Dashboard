// import React from 'react'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { useLanguage } from '../../shared/i18n/LanguageContext'

// Mock data - replace with actual API data
const performanceData = [
  { date: '2024-01-01', return: 2.5, benchmark: 2.1 },
  { date: '2024-01-02', return: 2.8, benchmark: 2.3 },
  { date: '2024-01-03', return: 3.1, benchmark: 2.4 },
  { date: '2024-01-04', return: 2.9, benchmark: 2.2 },
  { date: '2024-01-05', return: 3.2, benchmark: 2.5 },
]

// Mock data for timeframes performance
const timeframesData = {
  ytd: {
    return: 5.2,
    annualized: 12.8,
    benchmarkReturn: 4.1,
    excessReturn: 1.1,
    volatility: 12.5,
    sharpe: 1.75,
  },
  oneYear: {
    return: 15.3,
    annualized: 15.3,
    benchmarkReturn: 12.7,
    excessReturn: 2.6,
    volatility: 14.2,
    sharpe: 1.62,
  },
  threeYear: {
    return: 42.7,
    annualized: 12.6,
    benchmarkReturn: 35.1,
    excessReturn: 7.6,
    volatility: 16.8,
    sharpe: 1.34,
  },
  fiveYear: {
    return: 68.4,
    annualized: 11.0,
    benchmarkReturn: 58.9,
    excessReturn: 9.5,
    volatility: 18.3,
    sharpe: 1.1,
  }
}

const PerformanceMetrics = () => {
  const { t } = useLanguage();
  const [selectedTimeframe, setSelectedTimeframe] = useState('ytd');
  
  const metrics = [
    { name: t('dashboard.metrics.annualReturn'), value: '12.8%', change: '+2.3%', status: 'up' },
    { name: t('dashboard.metrics.sharpeRatio'), value: '1.75', change: '+0.15', status: 'up' },
    { name: t('dashboard.metrics.maxDrawdown'), value: '-8.2%', change: '-1.4%', status: 'down' },
    { name: t('dashboard.metrics.informationRatio'), value: '0.95', change: '+0.05', status: 'up' },
  ];

  // 时间段选择
  const timeframeOptions = [
    { id: 'ytd', label: t('dashboard.timeframes.ytd') || 'YTD' },
    { id: 'oneYear', label: t('dashboard.timeframes.oneYear') || '1Y' },
    { id: 'threeYear', label: t('dashboard.timeframes.threeYear') || '3Y' },
    { id: 'fiveYear', label: t('dashboard.timeframes.fiveYear') || '5Y' },
  ];

  const selectedData = timeframesData[selectedTimeframe];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.tabs.performance')}</h2>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">{metric.name}</div>
              <div className="flex items-end mt-1">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div
                  className={`ml-2 text-sm ${
                    metric.status === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {metric.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.performanceVsBenchmark')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  formatter={(value) => [`${value}%`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="return"
                  stroke="#2563eb"
                  name={t('dashboard.portfolioReturn')}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#9ca3af"
                  name={t('dashboard.benchmark')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 时间段表现对比 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('dashboard.timeframes.title') || '时间段表现'}</h3>
        
        {/* 时间段选择器 */}
        <div className="flex space-x-2 mb-6">
          {timeframeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedTimeframe(option.id)}
              className={`px-3 py-1 rounded text-sm ${
                selectedTimeframe === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* 时间段表现数据 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-sm text-gray-500">{t('dashboard.timeframes.totalReturn') || '总收益'}</div>
            <div className="text-2xl font-bold text-gray-900">{selectedData.return}%</div>
            <div className={`text-sm ${selectedData.excessReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {selectedData.excessReturn >= 0 ? '+' : ''}{selectedData.excessReturn}% vs {t('dashboard.benchmark')}
            </div>
          </div>
          
          {selectedData.annualized && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">{t('dashboard.timeframes.annualized') || '年化收益'}</div>
              <div className="text-2xl font-bold text-gray-900">{selectedData.annualized}%</div>
            </div>
          )}
          
          {selectedData.volatility && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">{t('dashboard.timeframes.volatility') || '波动率'}</div>
              <div className="text-2xl font-bold text-gray-900">{selectedData.volatility}%</div>
            </div>
          )}
          
          {selectedData.sharpe && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">{t('dashboard.timeframes.sharpe') || '夏普比率'}</div>
              <div className="text-2xl font-bold text-gray-900">{selectedData.sharpe}</div>
            </div>
          )}
        </div>
        
        {/* 比较表 */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.timeframes.period') || '时间段'}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.portfolioReturn')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.benchmark')}
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.timeframes.excess') || '超额收益'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(timeframesData).map(([key, data]) => (
                <tr key={key} className={selectedTimeframe === key ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {timeframeOptions.find(option => option.id === key)?.label || key}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {data.return}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {data.benchmarkReturn}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={data.excessReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.excessReturn >= 0 ? '+' : ''}{data.excessReturn}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMetrics 