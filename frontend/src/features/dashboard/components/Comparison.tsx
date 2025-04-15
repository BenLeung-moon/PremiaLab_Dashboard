import React, { useState, useEffect } from 'react';
import { getPortfolioComparison } from '../../../shared/services/portfolioService';
import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { formatNumber, formatPercent } from '../../../shared/utils/formatting';

interface ComparisonProps {
  portfolioId: string;
}

// 前端期望的接口定义
interface ComparisonData {
  totalReturn?: { portfolio: number; benchmark: number; excess: number };
  annualizedReturn?: { portfolio: number; benchmark: number; excess: number };
  volatility?: { portfolio: number; benchmark: number; difference: number };
  sharpeRatio?: { portfolio: number; benchmark: number; difference: number };
  maxDrawdown?: { portfolio: number; benchmark: number; difference: number };
  correlation?: number;
  trackingError?: number;
  informationRatio?: number;
  winRate?: number;
  // 保留中文键名支持旧数据
  总收益率?: { 投资组合: number; 基准: number; 超额: number };
  年化收益率?: { 投资组合: number; 基准: number; 超额: number };
  波动率?: { 投资组合: number; 基准: number; 差异: number };
  夏普比率?: { 投资组合: number; 基准: number; 差异: number };
  最大回撤?: { 投资组合: number; 基准: number; 差异: number };
  相关性?: number;
  跟踪误差?: number;
  信息比率?: number;
  胜率?: number;
}

const Comparison: React.FC<ComparisonProps> = ({ portfolioId }) => {
  const { language } = useLanguage();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [benchmarkMissing, setBenchmarkMissing] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const data = await getPortfolioComparison(portfolioId);
        console.log("Received comparison data:", data); // 调试用
        setComparison(data);
        
        // 检查基准数据是否全部为0
        const benchmarkValues = [
          data.totalReturn?.benchmark || data.总收益率?.基准 || 0,
          data.annualizedReturn?.benchmark || data.年化收益率?.基准 || 0,
          data.volatility?.benchmark || data.波动率?.基准 || 0,
          data.sharpeRatio?.benchmark || data.夏普比率?.基准 || 0,
        ];
        
        console.log("Benchmark values:", benchmarkValues); // 添加详细日志
        
        const allZeros = benchmarkValues.every(value => value === 0);
        console.log("Are all benchmark values zero?", allZeros);
        
        setBenchmarkMissing(allZeros);
        
        setError(null);
      } catch (err) {
        setError(language === 'en' ? 'Failed to load comparison data' : '无法加载对比数据');
        console.error('Error fetching comparison data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [portfolioId, language]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="bg-gray-50 text-gray-700 p-4 rounded-lg">
        <p>{language === 'en' ? 'No data available' : '暂无数据'}</p>
      </div>
    );
  }

  // 处理数据，确保同时支持英文和中文键名
  const totalReturn = comparison.totalReturn || comparison.总收益率 || { portfolio: 0, benchmark: 0, excess: 0 };
  const annualizedReturn = comparison.annualizedReturn || comparison.年化收益率 || { portfolio: 0, benchmark: 0, excess: 0 };
  const volatility = comparison.volatility || comparison.波动率 || { portfolio: 0, benchmark: 0, difference: 0 };
  const sharpeRatio = comparison.sharpeRatio || comparison.夏普比率 || { portfolio: 0, benchmark: 0, difference: 0 };
  const maxDrawdown = comparison.maxDrawdown || comparison.最大回撤 || { portfolio: 0, benchmark: 0, difference: 0 };
  const correlation = comparison.correlation ?? comparison.相关性 ?? 0;
  const trackingError = comparison.trackingError ?? comparison.跟踪误差 ?? 0;
  const informationRatio = comparison.informationRatio ?? comparison.信息比率 ?? 0;
  const winRate = comparison.winRate ?? comparison.胜率 ?? 0;

  // 辅助函数：根据正负值返回对应的颜色和图标类
  const getValueColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getValueIcon = (value: number) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };

  // 辅助函数：判断某个指标是否越高越好
  const isHigherBetter = (metric: string) => {
    return !['volatility', 'maxDrawdown', 'trackingError', '波动率', '最大回撤', '跟踪误差'].includes(metric);
  };

  // 辅助函数：判断差异是否是正面的
  const isDifferencePositive = (metric: string, value: number) => {
    if (isHigherBetter(metric)) {
      return value > 0;
    } else {
      return value < 0;
    }
  };

  // 标准化数据获取方法
  const getValue = (obj: any, enKey: string, zhKey: string) => {
    return language === 'en' 
      ? (obj[enKey] !== undefined ? obj[enKey] : obj[zhKey])
      : (obj[zhKey] !== undefined ? obj[zhKey] : obj[enKey]);
  };

  return (
    <div className="space-y-8">
      {/* 基准数据缺失警告 */}
      {benchmarkMissing && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-4">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">
                {language === 'en' 
                  ? 'Benchmark data is missing or incomplete'
                  : '基准数据缺失或不完整'}
              </p>
              <p className="text-sm mt-1">
                {language === 'en'
                  ? 'The comparison might not be accurate. Please contact the administrator to fix the benchmark data.'
                  : '比较可能不准确。请联系管理员修复基准数据。'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 主要对比指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 总收益率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">
            {language === 'en' ? 'Total Return' : '总收益率'}
          </h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {formatPercent(getValue(totalReturn, 'portfolio', '投资组合'))}
            </div>
            <div
              className={`ml-2 text-sm ${
                getValue(totalReturn, 'excess', '超额') > 0
                  ? 'text-green-600'
                  : getValue(totalReturn, 'excess', '超额') < 0
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {getValueIcon(getValue(totalReturn, 'excess', '超额'))}{' '}
              {Math.abs(getValue(totalReturn, 'excess', '超额')).toFixed(2)}% {language === 'en' ? 'vs Benchmark' : 'vs 基准'}
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {language === 'en' ? 'Benchmark' : '基准'}: {formatPercent(getValue(totalReturn, 'benchmark', '基准'))}
          </div>
        </div>

        {/* 年化收益率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">
            {language === 'en' ? 'Annualized Return' : '年化收益率'}
          </h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {formatPercent(getValue(annualizedReturn, 'portfolio', '投资组合'))}
            </div>
            <div
              className={`ml-2 text-sm ${getValueColor(
                getValue(annualizedReturn, 'excess', '超额')
              )}`}
            >
              {getValueIcon(getValue(annualizedReturn, 'excess', '超额'))}{' '}
              {Math.abs(getValue(annualizedReturn, 'excess', '超额')).toFixed(2)}% {language === 'en' ? 'vs Benchmark' : 'vs 基准'}
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {language === 'en' ? 'Benchmark' : '基准'}: {formatPercent(getValue(annualizedReturn, 'benchmark', '基准'))}
          </div>
        </div>

        {/* 夏普比率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">
            {language === 'en' ? 'Sharpe Ratio' : '夏普比率'}
          </h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {formatNumber(getValue(sharpeRatio, 'portfolio', '投资组合'))}
            </div>
            <div
              className={`ml-2 text-sm ${getValueColor(
                getValue(sharpeRatio, 'difference', '差异')
              )}`}
            >
              {getValueIcon(getValue(sharpeRatio, 'difference', '差异'))}{' '}
              {Math.abs(getValue(sharpeRatio, 'difference', '差异')).toFixed(2)} {language === 'en' ? 'vs Benchmark' : 'vs 基准'}
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {language === 'en' ? 'Benchmark' : '基准'}: {formatNumber(getValue(sharpeRatio, 'benchmark', '基准'))}
          </div>
        </div>

        {/* 波动率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">
            {language === 'en' ? 'Volatility' : '波动率'}
          </h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {formatPercent(getValue(volatility, 'portfolio', '投资组合'))}
            </div>
            <div
              className={`ml-2 text-sm ${getValueColor(
                getValue(volatility, 'difference', '差异') * -1
              )}`}
            >
              {getValueIcon(getValue(volatility, 'difference', '差异') * -1)}{' '}
              {Math.abs(getValue(volatility, 'difference', '差异')).toFixed(2)}% {language === 'en' ? 'vs Benchmark' : 'vs 基准'}
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {language === 'en' ? 'Benchmark' : '基准'}: {formatPercent(getValue(volatility, 'benchmark', '基准'))}
          </div>
        </div>

        {/* 最大回撤 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">
            {language === 'en' ? 'Max Drawdown' : '最大回撤'}
          </h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {formatPercent(getValue(maxDrawdown, 'portfolio', '投资组合'))}
            </div>
            <div
              className={`ml-2 text-sm ${getValueColor(
                getValue(maxDrawdown, 'difference', '差异') * -1
              )}`}
            >
              {getValueIcon(getValue(maxDrawdown, 'difference', '差异') * -1)}{' '}
              {Math.abs(getValue(maxDrawdown, 'difference', '差异')).toFixed(2)}% {language === 'en' ? 'vs Benchmark' : 'vs 基准'}
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {language === 'en' ? 'Benchmark' : '基准'}: {formatPercent(getValue(maxDrawdown, 'benchmark', '基准'))}
          </div>
        </div>

        {/* 胜率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">
            {language === 'en' ? 'Win Rate' : '胜率'}
          </h3>
          <div className="text-2xl font-bold">{formatPercent(winRate)}</div>
          <div className="mt-4 text-xs text-gray-500">
            {language === 'en' ? 'Percentage of days outperforming benchmark' : '超过基准的交易日比例'}
          </div>
        </div>
      </div>

      {/* 其他指标 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">
          {language === 'en' ? 'Other Metrics' : '其他对比指标'}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Metric' : '指标'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Value' : '数值'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Description' : '说明'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {language === 'en' ? 'Correlation' : '相关性'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                  {formatNumber(correlation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {language === 'en' ? 'Correlation coefficient between portfolio and benchmark' : '投资组合与基准的相关系数'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {language === 'en' ? 'Tracking Error' : '跟踪误差'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                  {formatPercent(trackingError)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {language === 'en' ? 'Standard deviation of portfolio returns relative to benchmark' : '投资组合与基准回报的标准差'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {language === 'en' ? 'Information Ratio' : '信息比率'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                  {formatNumber(informationRatio)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {language === 'en' ? 'Excess return per unit of tracking error' : '每单位跟踪误差带来的超额收益'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {language === 'en' ? 'Win Rate' : '胜率'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                  {formatPercent(winRate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {language === 'en' ? 'Percentage of days outperforming benchmark' : '超过基准的天数百分比'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 比较说明 */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">
          {language === 'en' ? 'Benchmark Information' : '对标说明'}
        </h3>
        <p className="text-blue-700 text-sm">
          {language === 'en' 
            ? 'This page uses SPY (SPDR S&P 500 ETF Trust) as the benchmark. SPY is an ETF that tracks the S&P 500 index, widely used as a representative benchmark for large-cap U.S. stocks.'
            : '本页面以SPY(SPDR标普500 ETF信托基金)作为基准进行比较。SPY是一只跟踪标普500指数的ETF，广泛用作美国大盘股的代表性基准。'
          }
        </p>
      </div>
    </div>
  );
};

export default Comparison; 