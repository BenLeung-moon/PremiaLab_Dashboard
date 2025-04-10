// import React from 'react';

const HistoricalTrends = () => {
  // 假设数据
  const monthlyReturns = [
    { month: '1月', portfolio: 2.1, benchmark: 1.5 },
    { month: '2月', portfolio: -0.8, benchmark: -1.2 },
    { month: '3月', portfolio: 3.5, benchmark: 2.8 },
    { month: '4月', portfolio: 1.2, benchmark: 0.9 },
    { month: '5月', portfolio: -1.5, benchmark: -2.1 },
    { month: '6月', portfolio: 2.8, benchmark: 2.2 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Historical Trends</h2>
      
      <div className="mt-4">
        <h3 className="text-md font-medium mb-2">月度收益率 (%)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  月份
                </th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  组合
                </th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  基准
                </th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  超额收益
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyReturns.map((item, index) => {
                const excess = item.portfolio - item.benchmark;
                return (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.month}
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
          <p>注: 这些数据仅供参考，实际投资决策应基于更全面的分析</p>
        </div>
      </div>
    </div>
  );
};

export default HistoricalTrends; 