import React, { useState, useEffect } from 'react';
import { getPortfolioComparison } from '../../services/portfolioService';
import { useLanguage } from '../../i18n/LanguageContext';

interface ComparisonProps {
  portfolioId: string;
}

interface ComparisonData {
  总收益率: { 投资组合: number; 基准: number; 超额: number };
  年化收益率: { 投资组合: number; 基准: number; 超额: number };
  波动率: { 投资组合: number; 基准: number; 差异: number };
  夏普比率: { 投资组合: number; 基准: number; 差异: number };
  最大回撤: { 投资组合: number; 基准: number; 差异: number };
  相关性: number;
  跟踪误差: number;
  信息比率: number;
  胜率: number;
}

const Comparison: React.FC<ComparisonProps> = ({ portfolioId }) => {
  const { t } = useLanguage();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const data = await getPortfolioComparison(portfolioId);
        setComparison(data);
        setError(null);
      } catch (err) {
        setError('无法加载对比数据');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [portfolioId]);

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
        <p>暂无数据</p>
      </div>
    );
  }

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
    return !['波动率', '最大回撤', '跟踪误差'].includes(metric);
  };

  // 辅助函数：判断差异是否是正面的
  const isDifferencePositive = (metric: string, value: number) => {
    if (isHigherBetter(metric)) {
      return value > 0;
    } else {
      return value < 0;
    }
  };

  return (
    <div className="space-y-8">
      {/* 主要对比指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 总收益率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">总收益率</h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {comparison.总收益率.投资组合}%
            </div>
            <div
              className={`ml-2 text-sm ${
                comparison.总收益率.超额 > 0
                  ? 'text-green-600'
                  : comparison.总收益率.超额 < 0
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {getValueIcon(comparison.总收益率.超额)}{' '}
              {Math.abs(comparison.总收益率.超额)}% vs 基准
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            基准: {comparison.总收益率.基准}%
          </div>
        </div>

        {/* 年化收益率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">年化收益率</h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {comparison.年化收益率.投资组合}%
            </div>
            <div
              className={`ml-2 text-sm ${getValueColor(
                comparison.年化收益率.超额
              )}`}
            >
              {getValueIcon(comparison.年化收益率.超额)}{' '}
              {Math.abs(comparison.年化收益率.超额)}% vs 基准
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            基准: {comparison.年化收益率.基准}%
          </div>
        </div>

        {/* 夏普比率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">夏普比率</h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {comparison.夏普比率.投资组合}
            </div>
            <div
              className={`ml-2 text-sm ${getValueColor(
                comparison.夏普比率.差异
              )}`}
            >
              {getValueIcon(comparison.夏普比率.差异)}{' '}
              {Math.abs(comparison.夏普比率.差异)} vs 基准
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            基准: {comparison.夏普比率.基准}
          </div>
        </div>

        {/* 波动率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">波动率</h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {comparison.波动率.投资组合}%
            </div>
            <div
              className={`ml-2 text-sm ${
                comparison.波动率.差异 < 0
                  ? 'text-green-600'
                  : comparison.波动率.差异 > 0
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {getValueIcon(comparison.波动率.差异)}{' '}
              {Math.abs(comparison.波动率.差异)}% vs 基准
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            基准: {comparison.波动率.基准}%
          </div>
        </div>

        {/* 最大回撤 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">最大回撤</h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">
              {comparison.最大回撤.投资组合}%
            </div>
            <div
              className={`ml-2 text-sm ${
                comparison.最大回撤.差异 < 0
                  ? 'text-green-600'
                  : comparison.最大回撤.差异 > 0
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {getValueIcon(comparison.最大回撤.差异)}{' '}
              {Math.abs(comparison.最大回撤.差异)}% vs 基准
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            基准: {comparison.最大回撤.基准}%
          </div>
        </div>

        {/* 胜率 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">胜率</h3>
          <div className="text-2xl font-bold">{comparison.胜率}%</div>
          <div className="mt-4 text-xs text-gray-500">
            超过基准的交易日比例
          </div>
        </div>
      </div>

      {/* 其他指标 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">其他对比指标</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  指标
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数值
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  说明
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  相关性
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                  {comparison.相关性}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  投资组合与基准的相关系数
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  跟踪误差
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                  {comparison.跟踪误差}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  投资组合与基准回报的标准差
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  信息比率
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                  {comparison.信息比率}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  每单位跟踪误差带来的超额收益
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 比较说明 */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">对标说明</h3>
        <p className="text-blue-700 text-sm">
          本页面以SPY(SPDR标普500 ETF信托基金)作为基准进行比较。SPY是一只跟踪标普500指数的ETF，广泛用作美国大盘股的代表性基准。
        </p>
      </div>
    </div>
  );
};

export default Comparison; 