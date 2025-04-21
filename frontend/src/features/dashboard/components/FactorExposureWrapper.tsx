import React from 'react';
import { FactorsData } from '../../../shared/services/portfolioService';
import { TimeFrame } from '../../../shared/components/TimePeriodSelector';

// 尝试导入FactorExposure组件
let FactorExposureComponent: any;
try {
  // 动态导入，如果有错误则使用空组件
  FactorExposureComponent = require('./FactorExposure').default;
} catch (error) {
  console.error("Error importing FactorExposure:", error);
  FactorExposureComponent = ({ factors }: { factors: FactorsData }) => (
    <div className="p-4 bg-yellow-50 rounded-lg">
      <h3 className="font-medium text-yellow-800 mb-2">因子暴露加载失败</h3>
      <p className="text-yellow-700">无法加载因子暴露组件。请联系技术支持。</p>
    </div>
  );
}

interface FactorExposureWrapperProps {
  factors: FactorsData;
  timeFrame?: TimeFrame;
}

// 创建包装组件
const FactorExposureWrapper: React.FC<FactorExposureWrapperProps> = ({ factors, timeFrame }) => {
  // 返回原始组件
  return <FactorExposureComponent factors={factors} />;
};

export default FactorExposureWrapper; 