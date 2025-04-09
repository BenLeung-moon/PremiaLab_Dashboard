import React from 'react';

const FactorExposure = () => {
  const factors = [
    { name: '动量因子', exposure: 0.68, benchmark: 0.45 },
    { name: '价值因子', exposure: 0.32, benchmark: 0.55 },
    { name: '规模因子', exposure: -0.15, benchmark: 0.10 },
    { name: '波动因子', exposure: -0.25, benchmark: -0.15 },
    { name: '质量因子', exposure: 0.85, benchmark: 0.60 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Factor Exposure</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                因子
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                组合暴露
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                基准暴露
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                差异
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {factors.map((factor, index) => {
              const diff = factor.exposure - factor.benchmark;
              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {factor.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {factor.exposure.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {factor.benchmark.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span 
                      className={`${
                        diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FactorExposure; 