import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { PerformanceData, PerformanceTimeFrame } from '../../services/portfolioService';
import { formatNumber, formatPercent } from '../../shared/utils/formatting';

// 添加类型定义
type TimeFrame = 'ytd' | 'oneYear' | 'threeYear' | 'fiveYear' | 'tenYear';

interface PerformanceMetricsProps {
  data?: PerformanceData;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data }) => {
  const { t } = useLanguage();
  // 添加时间段选择器状态
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('oneYear');
  
  // 使用传入的数据或默认数据
  const performanceData = data || {
    totalReturn: 0,
    annualizedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    monthlyReturns: [],
    timeFrames: {
      ytd: { 
        return: 0, 
        annualized: 0, 
        benchmarkReturn: 0, 
        excessReturn: 0,
        volatility: 0,
        sharpe: 0
      },
      oneYear: { 
        return: 0, 
        annualized: 0, 
        benchmarkReturn: 0, 
        excessReturn: 0,
        volatility: 0,
        sharpe: 0
      },
      threeYear: { 
        return: 0, 
        annualized: 0, 
        benchmarkReturn: 0, 
        excessReturn: 0,
        volatility: 0,
        sharpe: 0
      },
      fiveYear: { 
        return: 0, 
        annualized: 0, 
        benchmarkReturn: 0, 
        excessReturn: 0,
        volatility: 0,
        sharpe: 0
      }
    }
  };

  useEffect(() => {
    if (data) {
      console.log('PerformanceMetrics received data:', data);
    }
  }, [data]);
  
  // 根据选择的时间段获取数据
  const getTimeFrameData = () => {
    const timeFrame = performanceData.timeFrames?.[selectedTimeFrame];
    return {
      return: timeFrame?.return || performanceData.totalReturn,
      annualized: timeFrame?.annualized || performanceData.annualizedReturn,
      volatility: timeFrame?.volatility || performanceData.volatility,
      sharpe: timeFrame?.sharpe || performanceData.sharpeRatio
    };
  };
  
  // 获取当前显示的时间段数据
  const currentData = getTimeFrameData();
  
  // 处理月度收益数据
  const monthlyReturns = performanceData.monthlyReturns || [
    { date: '2024-01', return: 0 },
    { date: '2024-02', return: 0 },
    { date: '2024-03', return: 0 },
    { date: '2024-04', return: 0 },
    { date: '2024-05', return: 0 },
    { date: '2024-06', return: 0 }
  ];

  // 转换月份格式
  const formatMonthName = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return monthNames[parseInt(month) - 1];
  };

  // 时间段选项
  const timeFrameOptions = [
    { id: 'ytd', label: 'YTD' },
    { id: 'oneYear', label: '1年' },
    { id: 'threeYear', label: '3年' },
    { id: 'fiveYear', label: '5年' },
  ];

  return (
    <div className="space-y-6">
      {/* 时间段选择器 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">{t('dashboard.performance')}</h2>
          <div className="flex space-x-2 bg-gray-100 rounded-md p-1">
            {timeFrameOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedTimeFrame(option.id as TimeFrame)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedTimeFrame === option.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* 总收益 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">总收益</div>
            <div className="text-2xl font-bold text-gray-900">{formatPercent(currentData.return)}</div>
          </div>
          
          {/* 年化收益 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">年化收益</div>
            <div className="text-2xl font-bold text-gray-900">{formatPercent(currentData.annualized)}</div>
          </div>
          
          {/* 波动率 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">波动率</div>
            <div className="text-2xl font-bold text-gray-900">{formatPercent(currentData.volatility)}</div>
          </div>
          
          {/* 夏普比率 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">夏普比率</div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(currentData.sharpe)}</div>
          </div>
          
          {/* 最大回撤 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">最大回撤</div>
            <div className="text-2xl font-bold text-red-600">{formatPercent(performanceData.maxDrawdown)}</div>
          </div>
          
          {/* 胜率 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">胜率</div>
            <div className="text-2xl font-bold text-gray-900">{formatPercent(performanceData.winRate)}</div>
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
          {monthlyReturns.slice(0, 6).map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-sm text-gray-500 mb-2">{formatMonthName(item.date)}</div>
              <div className={`text-lg font-medium ${item.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.return > 0 ? '+' : ''}{item.return.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 