import React, { useEffect } from 'react';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import { PerformanceData } from '../../services/portfolioService';
import { formatNumber, formatPercent } from '../../shared/utils/formatting';

interface HistoricalTrendsProps {
  data?: PerformanceData;
}

const HistoricalTrends = ({ data }: HistoricalTrendsProps) => {
  const { language } = useLanguage();
  
  // 在组件挂载和语言变化时输出当前语言设置
  useEffect(() => {
    console.log('HistoricalTrends - Current language setting:', language);
    console.log('HistoricalTrends - Data received:', data);
    
    // 检查API是否返回了有效数据
    if (!data) {
      console.warn('No data received from API, will use default data');
    } else if (!data.monthlyReturns || data.monthlyReturns.length === 0) {
      console.warn('API returned data but no monthly returns, will use default data');
    }
  }, [language, data]);

  // 硬编码的默认英文月份数据
  const defaultMonthlyReturns = [
    { month: 'January 2023', portfolio: 5.76, benchmark: 3.20, excess: 2.56 },
    { month: 'February 2023', portfolio: -3.24, benchmark: -1.80, excess: -1.44 },
    { month: 'March 2023', portfolio: 3.78, benchmark: 2.10, excess: 1.68 },
    { month: 'April 2023', portfolio: 8.10, benchmark: 4.50, excess: 3.60 },
    { month: 'May 2023', portfolio: -1.26, benchmark: -0.70, excess: -0.56 },
    { month: 'June 2023', portfolio: 5.22, benchmark: 2.90, excess: 2.32 },
    { month: 'July 2023', portfolio: 2.87, benchmark: 2.10, excess: 0.77 },
    { month: 'August 2023', portfolio: -2.13, benchmark: -2.70, excess: 0.57 },
    { month: 'September 2023', portfolio: 0.94, benchmark: 0.15, excess: 0.79 },
    { month: 'October 2023', portfolio: -3.45, benchmark: -4.20, excess: 0.75 },
    { month: 'November 2023', portfolio: 6.18, benchmark: 5.32, excess: 0.86 },
    { month: 'December 2023', portfolio: 3.56, benchmark: 2.78, excess: 0.78 },
    { month: 'January 2024', portfolio: 2.85, benchmark: 1.95, excess: 0.90 },
    { month: 'February 2024', portfolio: 1.73, benchmark: 1.25, excess: 0.48 },
    { month: 'March 2024', portfolio: -0.85, benchmark: -1.40, excess: 0.55 },
    { month: 'April 2024', portfolio: 3.12, benchmark: 2.45, excess: 0.67 },
    { month: 'May 2024', portfolio: 1.95, benchmark: 1.37, excess: 0.58 },
    { month: 'June 2024', portfolio: 4.35, benchmark: 3.62, excess: 0.73 }
  ];

  // 使用API数据或默认数据
  const getMonthlyReturns = () => {
    if (!data || !data.monthlyReturns || data.monthlyReturns.length === 0) {
      console.log('No monthly returns data available, using defaults');
      return defaultMonthlyReturns;
    }

    console.log('Processing monthly returns data:', data.monthlyReturns);
    
    try {
      // 转换API数据格式
      return data.monthlyReturns.map((item, index) => {
        // 获取月份名称 - 始终使用英文月份
        let month = '';
        if (item.month && typeof item.month === 'string') {
          month = item.month;
        } else {
          // 使用索引生成月份
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          
          // 尝试从索引获取，如果超出范围则使用索引+1
          month = months[index % 12] || `Month ${index + 1}`;
        }

        // 获取收益率数据
        let portfolioReturn = 0;
        if (typeof item.return === 'number') {
          portfolioReturn = item.return;
        } else if (typeof item === 'number') {
          // 如果item直接是数字，则视为收益率
          portfolioReturn = item;
        } else if (typeof item.portfolio === 'number') {
          portfolioReturn = item.portfolio;
        } else if (typeof item.value === 'number') {
          portfolioReturn = item.value;
        }

        // 获取基准收益率，如果没有则使用组合的80%
        let benchmarkReturn = 0;
        if (typeof item.benchmark === 'number') {
          benchmarkReturn = item.benchmark;
        } else if (typeof item.benchmarkReturn === 'number') {
          benchmarkReturn = item.benchmarkReturn;
        } else {
          benchmarkReturn = portfolioReturn * 0.8;
        }
        
        // 计算超额收益
        const excess = portfolioReturn - benchmarkReturn;

        return {
          month,
          portfolio: portfolioReturn,
          benchmark: benchmarkReturn,
          excess: excess
        };
      });
    } catch (error) {
      console.error('Error processing monthly returns data:', error);
      return defaultMonthlyReturns;
    }
  };

  const monthlyReturns = getMonthlyReturns();

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">{language === 'en' ? 'Historical Trends' : '历史趋势'}</h2>
      
      {/* 添加错误指示器，表明当前显示的是默认数据 */}
      {(!data || !data.monthlyReturns || data.monthlyReturns.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          <p className="text-sm">
            {language === 'en' 
              ? 'Using sample data. Portfolio data not available from server.' 
              : '使用样本数据。服务器上没有可用的投资组合数据。'}
          </p>
        </div>
      )}
      
      <div className="mt-4 w-full">
        <h3 className="text-md font-medium mb-2">
          {language === 'en' ? 'Monthly Returns (%)' : '月度收益率 (%)'}
        </h3>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'MONTH' : '月份'}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'PORTFOLIO' : '投资组合'}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'BENCHMARK' : '基准'}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'EXCESS RETURN' : '超额收益'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyReturns.map((item, index) => {
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.month}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className={item.portfolio >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercent(item.portfolio)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className={item.benchmark >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercent(item.benchmark)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className={item.excess >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.excess >= 0 ? '+' : ''}{formatPercent(item.excess)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>{language === 'en' ? 'Note: These data are for reference only. Actual investment decisions should be based on more comprehensive analysis.' : '注意: 这些数据仅供参考，实际投资决策应基于更全面的分析。'}</p>
        </div>
      </div>
    </div>
  );
};

export default HistoricalTrends; 