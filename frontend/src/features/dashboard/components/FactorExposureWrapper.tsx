import React, { lazy, Suspense, useState } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { TimeFrame } from '../../../shared/components/TimePeriodSelector';
import { FactorsData } from '../../../shared/services/portfolioService';

// 使用React.lazy动态导入FactorExposure组件
const FactorExposureComponent = lazy(() => {
  console.log('尝试动态加载FactorExposure组件...');
  return import('./FactorExposure')
    .then(module => {
      console.log('FactorExposure组件加载成功');
      return module;
    })
    .catch(error => {
      console.error('FactorExposure组件加载失败:', error);
      // 重新抛出错误，让ErrorBoundary捕获
      throw error;
    });
});

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('因子暴露组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface FactorExposureWrapperProps {
  factors?: FactorsData;
  timeFrame?: TimeFrame;
}

const FactorExposureWrapper: React.FC<FactorExposureWrapperProps> = ({ factors, timeFrame }) => {
  const { language } = useLanguage();
  const [loadError, setLoadError] = useState<Error | null>(null);

  // 记录数据结构到控制台，帮助调试
  React.useEffect(() => {
    console.log('===== FactorExposureWrapper数据流日志 =====');
    console.log('因子数据存在:', !!factors);
    console.log('因子数据类型:', factors ? typeof factors : 'undefined');
    console.log('因子数据顶层键:', factors ? Object.keys(factors) : []);
    console.log('时间周期:', timeFrame);
    
    if (factors) {
      // 尝试记录完整的JSON数据
      try {
        console.log('完整的因子数据JSON:', JSON.stringify(factors, null, 2));
      } catch (e) {
        console.error('无法序列化完整因子数据:', e);
      }
      
      // 检查数据结构 - 同时支持驼峰和下划线命名方式
      const styleFactors = factors.styleFactors || (factors as any).style_factors;
      const industryFactors = factors.industryFactors || (factors as any).industry_factors;
      const countryFactors = factors.countryFactors || (factors as any).country_factors;
      
      console.log('因子分类数据检查:', {
        styleFactors: styleFactors ? `有数据(${Array.isArray(styleFactors) ? styleFactors.length : '非数组'})` : '无数据',
        industryFactors: industryFactors ? `有数据(${Array.isArray(industryFactors) ? industryFactors.length : '非数组'})` : '无数据',
        countryFactors: countryFactors ? `有数据(${Array.isArray(countryFactors) ? countryFactors.length : '非数组'})` : '无数据'
      });
      
      // 查看风格因子的内容
      if (Array.isArray(styleFactors) && styleFactors.length > 0) {
        console.log('风格因子详细内容:', styleFactors);
        // 取第一个因子作为样本查看结构
        const sampleFactor = styleFactors[0];
        console.log('风格因子样本:', sampleFactor);
        console.log('风格因子样本属性:', Object.keys(sampleFactor));
      }
      
      // 查看行业因子的内容
      if (Array.isArray(industryFactors) && industryFactors.length > 0) {
        console.log('行业因子样本:', industryFactors[0]);
      }
      
      // 检查直接返回的扁平数组格式
      if (Array.isArray(factors)) {
        console.log('因子是扁平数组格式，长度:', factors.length);
        if (factors.length > 0) {
          console.log('第一个因子样本:', factors[0]);
        }
      }
      
      // 检查是否使用exposures字段
      if ((factors as any).exposures) {
        console.log('检测到exposures字段:', 
          Array.isArray((factors as any).exposures) ? `数组(${(factors as any).exposures.length})` : typeof (factors as any).exposures);
      }
    }
  }, [factors, timeFrame]);

  // 加载失败时的回退UI
  const LoadErrorFallback = () => {
    const errorMessage = loadError?.message || '';
    console.error('因子暴露组件加载失败:', errorMessage);
    
    return (
      <div className="p-4 bg-red-50 border border-red-300 rounded-md">
        <h3 className="text-lg font-medium text-red-700 mb-2">
          {language === 'en' ? 'Factor Exposure Loading Failed' : '因子暴露加载失败'}
        </h3>
        <p className="text-sm text-red-600">
          {language === 'en' 
            ? 'Unable to load the Factor Exposure component. Please contact technical support.' 
            : '无法加载因子暴露组件。请联系技术支持。'}
        </p>
        {typeof window !== 'undefined' && window.location.hostname === 'localhost' && errorMessage && (
          <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
            {errorMessage}
          </div>
        )}
      </div>
    );
  };
  
  // 数据加载中的回退UI
  const LoadingFallback = () => (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  // 如果没有因子数据，显示提示信息
  if (!factors) {
    console.warn('FactorExposureWrapper: 未提供因子数据');
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md">
        <p className="text-sm text-yellow-700">
          {language === 'en' 
            ? 'No factor exposure data available for this portfolio.' 
            : '当前投资组合没有可用的因子暴露数据。'}
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<LoadErrorFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        <div className="factor-exposure-container">
          <FactorExposureComponent factors={factors} timeFrame={timeFrame} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default FactorExposureWrapper; 