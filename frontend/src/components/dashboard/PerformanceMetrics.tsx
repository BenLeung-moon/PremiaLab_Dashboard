import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

const PerformanceMetrics: React.FC = () => {
  const { t } = useLanguage();
  
  // 模拟数据：绩效指标
  const performanceData = {
    totalReturn: 28.4,
    annualizedReturn: 12.4,
    volatility: 18.6,
    sharpeRatio: 1.2,
    maxDrawdown: -15.4,
    winRate: 58.2
  };
  
  // 模拟数据：月度收益
  const monthlyReturns = [
    { month: '一月', return: 3.2 },
    { month: '二月', return: -1.8 },
    { month: '三月', return: 2.1 },
    { month: '四月', return: 4.5 },
    { month: '五月', return: -0.7 },
    { month: '六月', return: 2.9 }
  ];

  return (
    <div className="space-y-6">
      {/* 主要绩效指标 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">{t('dashboard.performance')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* 总收益 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">总收益</div>
            <div className="text-2xl font-bold text-gray-900">{performanceData.totalReturn}%</div>
          </div>
          
          {/* 年化收益 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">年化收益</div>
            <div className="text-2xl font-bold text-gray-900">{performanceData.annualizedReturn}%</div>
          </div>
          
          {/* 波动率 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">波动率</div>
            <div className="text-2xl font-bold text-gray-900">{performanceData.volatility}%</div>
          </div>
          
          {/* 夏普比率 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">夏普比率</div>
            <div className="text-2xl font-bold text-gray-900">{performanceData.sharpeRatio}</div>
          </div>
          
          {/* 最大回撤 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">最大回撤</div>
            <div className="text-2xl font-bold text-red-600">{performanceData.maxDrawdown}%</div>
          </div>
          
          {/* 胜率 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">胜率</div>
            <div className="text-2xl font-bold text-gray-900">{performanceData.winRate}%</div>
          </div>
        </div>
      </div>
      
      {/* 绩效图表 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">累计收益趋势</h2>
        <div className="h-80 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="mt-4">图表：累计收益曲线</p>
          </div>
        </div>
      </div>
      
      {/* 月度收益 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">月度收益(%)</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {monthlyReturns.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-sm text-gray-500 mb-2">{item.month}</div>
              <div className={`text-lg font-medium ${item.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.return > 0 ? '+' : ''}{item.return}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 