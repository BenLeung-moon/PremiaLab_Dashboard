const RiskMetrics = () => {
  const riskMetrics = [
    { name: '波动率', value: '8.5%', benchmark: '10.2%', status: 'good' },
    { name: '下行风险', value: '6.2%', benchmark: '8.4%', status: 'good' },
    { name: 'VaR (95%)', value: '2.3%', benchmark: '3.1%', status: 'good' },
    { name: '贝塔系数', value: '0.92', benchmark: '1.00', status: 'neutral' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Risk Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        {riskMetrics.map((metric, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500">{metric.name}</div>
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-sm text-gray-500 ml-2">vs {metric.benchmark}</span>
              </div>
              <div>
                {metric.status === 'good' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    低风险
                  </span>
                )}
                {metric.status === 'neutral' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    中等
                  </span>
                )}
                {metric.status === 'bad' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    高风险
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskMetrics; 