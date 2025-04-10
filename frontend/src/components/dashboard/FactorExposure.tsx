import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const FactorExposure: React.FC = () => {
  const { t } = useLanguage();
  
  // 模拟数据：因子暴露
  const styleFactors = [
    { name: '价值', exposure: 0.65, positive: true },
    { name: '成长', exposure: 0.42, positive: true },
    { name: '规模', exposure: -0.28, positive: false },
    { name: '动量', exposure: 0.36, positive: true },
    { name: '质量', exposure: 0.72, positive: true },
    { name: '波动性', exposure: -0.18, positive: false }
  ];
  
  // 模拟数据：宏观暴露
  const macroFactors = [
    { name: '货币政策', exposure: 0.22, positive: true },
    { name: '信贷环境', exposure: 0.31, positive: true },
    { name: '经济增长', exposure: 0.58, positive: true },
    { name: '通货膨胀', exposure: -0.17, positive: false },
    { name: '利率变化', exposure: -0.25, positive: false },
    { name: '能源价格', exposure: 0.12, positive: true }
  ];
  
  // 获取因子条的宽度
  const getBarWidth = (exposure: number) => {
    // 将暴露度转化为百分比，取值 -1.0 ~ 1.0，映射到 -100% ~ 100%
    return `${Math.abs(exposure) * 100}%`;
  };
  
  // 获取因子条的位置
  const getBarPosition = (exposure: number) => {
    if (exposure < 0) {
      return 'left-0';
    }
    return 'right-0';
  };
  
  return (
    <div className="space-y-6">
      {/* 风格因子暴露 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">风格因子暴露</h2>
        <div className="space-y-4">
          {styleFactors.map((factor, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{factor.name}</span>
                <span className={factor.positive ? 'text-green-600' : 'text-red-600'}>
                  {factor.exposure.toFixed(2)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full relative">
                <div className="absolute inset-y-0 w-1/2 left-1/2 border-l border-gray-400"></div>
                <div 
                  className={`absolute inset-y-0 ${getBarPosition(factor.exposure)} ${
                    factor.exposure > 0 ? 'bg-green-500' : 'bg-red-500'
                  } rounded-full`}
                  style={{ 
                    width: getBarWidth(factor.exposure)
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 宏观因子暴露 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">宏观因子暴露</h2>
        <div className="space-y-4">
          {macroFactors.map((factor, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{factor.name}</span>
                <span className={factor.positive ? 'text-green-600' : 'text-red-600'}>
                  {factor.exposure.toFixed(2)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full relative">
                <div className="absolute inset-y-0 w-1/2 left-1/2 border-l border-gray-400"></div>
                <div 
                  className={`absolute inset-y-0 ${getBarPosition(factor.exposure)} ${
                    factor.exposure > 0 ? 'bg-green-500' : 'bg-red-500'
                  } rounded-full`}
                  style={{ 
                    width: getBarWidth(factor.exposure)
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 因子解释 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-4">因子分析解释</h2>
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
          <p className="mb-2"><strong>因子暴露</strong>表明投资组合对各种市场因素的敏感度。</p>
          <p className="mb-2">正暴露（绿色）意味着投资组合在该因子表现良好时可能获得正收益。</p>
          <p>负暴露（红色）意味着投资组合在该因子表现良好时可能获得负收益。</p>
        </div>
      </div>
      
      {/* 因子贡献 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">收益贡献分析</h2>
        <div className="h-64 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4">图表：各因子收益贡献</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactorExposure; 