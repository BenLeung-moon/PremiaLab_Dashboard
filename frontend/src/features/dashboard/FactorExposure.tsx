import { useLanguage } from '../../shared/i18n/LanguageContext';

const FactorExposure = () => {
  const { language } = useLanguage();

  const factors = [
    { nameEn: 'Momentum Factor', nameZh: '动量因子', exposure: 0.68, benchmark: 0.45 },
    { nameEn: 'Value Factor', nameZh: '价值因子', exposure: 0.32, benchmark: 0.55 },
    { nameEn: 'Size Factor', nameZh: '规模因子', exposure: -0.15, benchmark: 0.10 },
    { nameEn: 'Volatility Factor', nameZh: '波动因子', exposure: -0.25, benchmark: -0.15 },
    { nameEn: 'Quality Factor', nameZh: '质量因子', exposure: 0.85, benchmark: 0.60 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">{language === 'en' ? 'Factor Exposure' : '因子暴露'}</h2>
      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {language === 'en' ? 'Factor' : '因子'}
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {language === 'en' ? 'Portfolio Exposure' : '组合暴露'}
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {language === 'en' ? 'Benchmark Exposure' : '基准暴露'}
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {language === 'en' ? 'Difference' : '差异'}
              </th>
            </tr>
          </thead>
          <tbody>
            {factors.map((factor, index) => {
              const diff = factor.exposure - factor.benchmark;
              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {language === 'en' ? factor.nameEn : factor.nameZh}
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