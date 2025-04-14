import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface ComparisonProps {
  portfolioId?: string;
}

const Comparison: React.FC<ComparisonProps> = ({ portfolioId = '' }) => {
  const { t } = useLanguage();
  
  // 模拟数据：与标普500和纳斯达克的比较
  const mockComparisonData = [
    { metric: '年化收益率', portfolio: '12.4%', benchmark: '10.2%', difference: '+2.2%', positive: true },
    { metric: '夏普比率', portfolio: '1.2', benchmark: '0.9', difference: '+0.3', positive: true },
    { metric: '最大回撤', portfolio: '-15.4%', benchmark: '-18.2%', difference: '+2.8%', positive: true },
    { metric: '波动率', portfolio: '18.6%', benchmark: '16.4%', difference: '+2.2%', positive: false },
    { metric: '贝塔系数', portfolio: '1.12', benchmark: '1.00', difference: '+0.12', positive: false },
    { metric: '年化α值', portfolio: '2.3%', benchmark: '0.0%', difference: '+2.3%', positive: true },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">{t('dashboard.comparison')}</h2>
        <select className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white">
          <option value="sp500">标普500</option>
          <option value="nasdaq">纳斯达克</option>
          <option value="djia">道琼斯工业平均指数</option>
        </select>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">指标</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">您的投资组合</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">基准</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">差异</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockComparisonData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-3 text-sm text-gray-900">{item.metric}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.portfolio}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.benchmark}</td>
                <td className={`px-4 py-3 text-sm font-medium ${item.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {item.difference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 图表区域 */}
      <div className="mt-8 h-80 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-4">图表：您的投资组合与基准比较</p>
          <p className="text-xs text-gray-400">投资组合ID: {portfolioId}</p>
        </div>
      </div>
    </div>
  );
};

export default Comparison; 