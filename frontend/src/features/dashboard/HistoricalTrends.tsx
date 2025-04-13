// import React from 'react';
import { useLanguage } from '../../shared/i18n/LanguageContext';

const HistoricalTrends = () => {
  const { language } = useLanguage();

  // 假设数据，包含中英文月份名称
  const monthlyReturns = [
    { monthEn: 'January', monthZh: '1月', portfolio: 2.1, benchmark: 1.5 },
    { monthEn: 'February', monthZh: '2月', portfolio: -0.8, benchmark: -1.2 },
    { monthEn: 'March', monthZh: '3月', portfolio: 3.5, benchmark: 2.8 },
    { monthEn: 'April', monthZh: '4月', portfolio: 1.2, benchmark: 0.9 },
    { monthEn: 'May', monthZh: '5月', portfolio: -1.5, benchmark: -2.1 },
    { monthEn: 'June', monthZh: '6月', portfolio: 2.8, benchmark: 2.2 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">{language === 'en' ? 'Historical Trends' : '历史趋势'}</h2>
      
      <div className="mt-4 w-full">
        <h3 className="text-md font-medium mb-2">
          {language === 'en' ? 'Monthly Returns (%)' : '月度收益率 (%)'}
        </h3>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Month' : '月份'}
                </th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Portfolio' : '组合'}
                </th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Benchmark' : '基准'}
                </th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Excess Return' : '超额收益'}
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyReturns.map((item, index) => {
                const excess = item.portfolio - item.benchmark;
                return (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {language === 'en' ? item.monthEn : item.monthZh}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      <span className={item.portfolio >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {item.portfolio.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      <span className={item.benchmark >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {item.benchmark.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span className={excess >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {excess >= 0 ? '+' : ''}{excess.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>{language === 'en' ? 'Note: These data are for reference only. Actual investment decisions should be based on more comprehensive analysis.' : '注: 这些数据仅供参考，实际投资决策应基于更全面的分析'}</p>
        </div>
      </div>
    </div>
  );
};

export default HistoricalTrends; 