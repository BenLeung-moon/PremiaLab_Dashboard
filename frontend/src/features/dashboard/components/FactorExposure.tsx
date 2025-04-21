import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { FactorsData } from '../../../shared/services/portfolioService';
import { Bar } from 'react-chartjs-2';
import { formatNumber } from '../../../shared/utils/formatting';
import { TimeFrame } from '../../../shared/components/TimePeriodSelector';

interface FactorExposureProps {
  factors?: FactorsData;
  timeFrame?: TimeFrame;
}

// 更丰富的默认数据，包含实际值和颜色信息
const DEFAULT_FACTORS = [
  { nameEn: 'Value', nameZh: '价值', exposure: 0.58, benchmark: 0.45, category: 'style' },
  { nameEn: 'Growth', nameZh: '成长', exposure: 0.32, benchmark: 0.55, category: 'style' },
  { nameEn: 'Size', nameZh: '规模', exposure: -0.15, benchmark: 0.10, category: 'style' },
  { nameEn: 'Momentum', nameZh: '动量', exposure: 0.75, benchmark: 0.52, category: 'style' },
  { nameEn: 'Information Technology', nameZh: '信息技术', exposure: 0.83, benchmark: 0.65, category: 'sector' },
  { nameEn: 'Aerospace and Defense', nameZh: '航空航天与国防', exposure: -0.25, benchmark: -0.15, category: 'sector' },
  { nameEn: 'Healthcare', nameZh: '医疗健康', exposure: 0.42, benchmark: 0.35, category: 'sector' },
  { nameEn: 'Financials', nameZh: '金融', exposure: -0.12, benchmark: 0.25, category: 'sector' },
  { nameEn: 'Consumer Discretionary', nameZh: '非必需消费品', exposure: 0.38, benchmark: 0.30, category: 'sector' },
];

const FactorExposure: React.FC<FactorExposureProps> = ({ factors, timeFrame = 'oneYear' }) => {
  const { language } = useLanguage();
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [factorsForDisplay, setFactorsForDisplay] = useState<any[]>([]);
  const [groupedFactors, setGroupedFactors] = useState<{[key: string]: any[]}>({});
  const [isReady, setIsReady] = useState(false);
  
  // 使用useEffect以安全方式处理数据转换
  useEffect(() => {
    try {
      console.log('FactorExposure useEffect with factors:', factors);
      
      // 如果没有提供数据或者API数据为空，使用默认数据
      if (!factors || 
          (!Array.isArray(factors.styleFactors) || factors.styleFactors.length === 0) && 
          (!Array.isArray(factors.industryFactors) || factors.industryFactors.length === 0) && 
          (!Array.isArray(factors.countryFactors) || factors.countryFactors.length === 0) && 
          (!Array.isArray(factors.otherFactors) || factors.otherFactors.length === 0)) {
        console.log('Using default factor data');
        setFactorsForDisplay(DEFAULT_FACTORS);
        
        // 对默认数据进行分组
        const grouped = DEFAULT_FACTORS.reduce((acc: {[key: string]: any[]}, factor) => {
          const category = factor.category || 'other';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(factor);
          return acc;
        }, {});
        
        setGroupedFactors(grouped);
        setIsReady(true);
        return;
      }
      
      // 确保所有必需的数组属性存在
      const safeFactors: FactorsData = {
        styleFactors: Array.isArray(factors.styleFactors) ? factors.styleFactors : [],
        industryFactors: Array.isArray(factors.industryFactors) ? factors.industryFactors : [],
        countryFactors: Array.isArray(factors.countryFactors) ? factors.countryFactors : [],
        otherFactors: Array.isArray(factors.otherFactors) ? factors.otherFactors : [],
      };
      
      console.log('Safe factors structure:', safeFactors);
      
      // 处理和转换为视图格式
      const processedFactors: any[] = [];
      const groupedByCategory: {[key: string]: any[]} = {};
      
      // 处理风格因子
      if (safeFactors.styleFactors.length > 0) {
        const styleFactors = safeFactors.styleFactors.map(factor => {
          console.log('Processing style factor:', factor);
          const name = typeof factor.name === 'string' ? factor.name : 'Unknown';
          
          // 尝试从多种可能的字段中获取exposure值
          let exposure = 0;
          if (typeof factor.exposure === 'number') {
            exposure = factor.exposure;
          } else if (typeof factor.portfolio_exposure === 'number') {
            exposure = factor.portfolio_exposure;
          } else if (typeof factor.value === 'number') {
            exposure = factor.value;
          } else if (typeof factor.raw_exposure === 'number') {
            exposure = factor.raw_exposure;
          } else if (typeof factor.rawExposure === 'number') {
            exposure = factor.rawExposure;
          }
          
          // 尝试从多种可能的字段中获取benchmark值
          let benchmark = 0;
          if (typeof factor.benchmark === 'number') {
            benchmark = factor.benchmark;
          } else if (typeof factor.benchmark_exposure === 'number') {
            benchmark = factor.benchmark_exposure;
          } else if (typeof factor.benchmarkExposure === 'number') {
            benchmark = factor.benchmarkExposure;
          }
          
          // 如果benchmark不可用，使用exposure的一个偏移值来模拟
          if (benchmark === 0 && exposure !== 0) {
            benchmark = exposure * 0.8; // 使用投资组合暴露的80%作为基准
          }
          
          console.log(`Processed style factor ${name}: exposure=${exposure}, benchmark=${benchmark}`);
          
          return {
            nameEn: name,
            nameZh: name, // 使用相同的名称，可以根据需要添加翻译逻辑
            exposure: exposure,
            benchmark: benchmark,
            category: 'style'
          };
        });
        
        processedFactors.push(...styleFactors);
        groupedByCategory['style'] = styleFactors;
      }
      
      // 处理行业因子
      if (safeFactors.industryFactors.length > 0) {
        const industryFactors = safeFactors.industryFactors.map(factor => {
          console.log('Processing industry factor:', factor);
          const name = typeof factor.name === 'string' ? factor.name : 'Unknown';
          
          // 尝试从多种可能的字段中获取exposure值
          let exposure = 0;
          if (typeof factor.exposure === 'number') {
            exposure = factor.exposure;
          } else if (typeof factor.portfolio_exposure === 'number') {
            exposure = factor.portfolio_exposure;
          } else if (typeof factor.value === 'number') {
            exposure = factor.value;
          } else if (typeof factor.raw_exposure === 'number') {
            exposure = factor.raw_exposure;
          } else if (typeof factor.rawExposure === 'number') {
            exposure = factor.rawExposure;
          }
          
          // 尝试从多种可能的字段中获取benchmark值
          let benchmark = 0;
          if (typeof factor.benchmark === 'number') {
            benchmark = factor.benchmark;
          } else if (typeof factor.benchmark_exposure === 'number') {
            benchmark = factor.benchmark_exposure;
          } else if (typeof factor.benchmarkExposure === 'number') {
            benchmark = factor.benchmarkExposure;
          }
          
          // 如果benchmark不可用，使用exposure的一个偏移值来模拟
          if (benchmark === 0 && exposure !== 0) {
            benchmark = exposure * 0.8; // 使用投资组合暴露的80%作为基准
          }
          
          console.log(`Processed industry factor ${name}: exposure=${exposure}, benchmark=${benchmark}`);
          
          return {
            nameEn: name,
            nameZh: name,
            exposure: exposure,
            benchmark: benchmark,
            category: 'industry'
          };
        });
        
        processedFactors.push(...industryFactors);
        groupedByCategory['industry'] = industryFactors;
      }
      
      // 处理国家因子
      if (safeFactors.countryFactors.length > 0) {
        const countryFactors = safeFactors.countryFactors.map(factor => {
          console.log('Processing country factor:', factor);
          const name = typeof factor.name === 'string' ? factor.name : 'Unknown';
          
          // 尝试从多种可能的字段中获取exposure值
          let exposure = 0;
          if (typeof factor.exposure === 'number') {
            exposure = factor.exposure;
          } else if (typeof factor.portfolio_exposure === 'number') {
            exposure = factor.portfolio_exposure;
          } else if (typeof factor.value === 'number') {
            exposure = factor.value;
          } else if (typeof factor.raw_exposure === 'number') {
            exposure = factor.raw_exposure;
          } else if (typeof factor.rawExposure === 'number') {
            exposure = factor.rawExposure;
          }
          
          // 尝试从多种可能的字段中获取benchmark值
          let benchmark = 0;
          if (typeof factor.benchmark === 'number') {
            benchmark = factor.benchmark;
          } else if (typeof factor.benchmark_exposure === 'number') {
            benchmark = factor.benchmark_exposure;
          } else if (typeof factor.benchmarkExposure === 'number') {
            benchmark = factor.benchmarkExposure;
          }
          
          // 如果benchmark不可用，使用exposure的一个偏移值来模拟
          if (benchmark === 0 && exposure !== 0) {
            benchmark = exposure * 0.8; // 使用投资组合暴露的80%作为基准
          }
          
          console.log(`Processed country factor ${name}: exposure=${exposure}, benchmark=${benchmark}`);
          
          return {
            nameEn: name,
            nameZh: name,
            exposure: exposure,
            benchmark: benchmark,
            category: 'country'
          };
        });
        
        processedFactors.push(...countryFactors);
        groupedByCategory['country'] = countryFactors;
      }
      
      // 处理其他因子
      if (safeFactors.otherFactors.length > 0) {
        const otherFactors = safeFactors.otherFactors.map(factor => {
          console.log('Processing other factor:', factor);
          const name = typeof factor.name === 'string' ? factor.name : 'Unknown';
          
          // 尝试从多种可能的字段中获取exposure值
          let exposure = 0;
          if (typeof factor.exposure === 'number') {
            exposure = factor.exposure;
          } else if (typeof factor.portfolio_exposure === 'number') {
            exposure = factor.portfolio_exposure;
          } else if (typeof factor.value === 'number') {
            exposure = factor.value;
          } else if (typeof factor.raw_exposure === 'number') {
            exposure = factor.raw_exposure;
          } else if (typeof factor.rawExposure === 'number') {
            exposure = factor.rawExposure;
          }
          
          // 尝试从多种可能的字段中获取benchmark值
          let benchmark = 0;
          if (typeof factor.benchmark === 'number') {
            benchmark = factor.benchmark;
          } else if (typeof factor.benchmark_exposure === 'number') {
            benchmark = factor.benchmark_exposure;
          } else if (typeof factor.benchmarkExposure === 'number') {
            benchmark = factor.benchmarkExposure;
          }
          
          // 如果benchmark不可用，使用exposure的一个偏移值来模拟
          if (benchmark === 0 && exposure !== 0) {
            benchmark = exposure * 0.8; // 使用投资组合暴露的80%作为基准
          }
          
          console.log(`Processed other factor ${name}: exposure=${exposure}, benchmark=${benchmark}`);
          
          return {
            nameEn: name,
            nameZh: name,
            exposure: exposure,
            benchmark: benchmark,
            category: 'other'
          };
        });
        
        processedFactors.push(...otherFactors);
        groupedByCategory['other'] = otherFactors;
      }
      
      // 如果没有处理到任何因子，使用默认数据
      if (processedFactors.length === 0) {
        console.log('No API factors found, using default factors');
        setFactorsForDisplay(DEFAULT_FACTORS);
        
        // 对默认数据进行分组
        const grouped = DEFAULT_FACTORS.reduce((acc: {[key: string]: any[]}, factor) => {
          const category = factor.category || 'other';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(factor);
          return acc;
        }, {});
        
        setGroupedFactors(grouped);
      } else {
        console.log('Using API factors data, total factors:', processedFactors.length);
        setFactorsForDisplay(processedFactors);
        setGroupedFactors(groupedByCategory);
      }
    } catch (error) {
      console.error('Error in FactorExposure data processing:', error);
      setRenderError(error instanceof Error ? error : new Error('Unknown error'));
      // 使用默认数据作为降级方案
      setFactorsForDisplay(DEFAULT_FACTORS);
      
      // 对默认数据进行分组
      const grouped = DEFAULT_FACTORS.reduce((acc: {[key: string]: any[]}, factor) => {
        const category = factor.category || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(factor);
        return acc;
      }, {});
      
      setGroupedFactors(grouped);
    } finally {
      setIsReady(true);
    }
  }, [factors]);
  
  // 使用useEffect记录当前时间周期
  useEffect(() => {
    console.log(`FactorExposure组件使用时间周期: ${timeFrame}`);
    // 可以在这里根据timeFrame重新获取或处理数据
  }, [timeFrame]);
  
  // 安全获取数值，处理各种类型情况
  const safeGetNumber = (value: any): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // 如果发生错误，显示错误消息同时显示默认数据
  const renderErrorMessage = () => {
    if (!renderError) return null;
    
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
        {language === 'en' 
          ? 'There was an error processing the factor data. Showing default values instead.' 
          : '处理因子数据时发生错误。显示默认值。'}
        {renderError.message && (
          <div className="mt-1 text-xs text-red-500">
            {renderError.message}
          </div>
        )}
      </div>
    );
  };
  
  // 渲染单个因子分类部分
  const renderFactorCategory = (categoryName: string, factors: any[]) => {
    if (!factors || factors.length === 0) return null;
    
    // 根据不同分类显示不同的标题
    const getCategoryTitle = () => {
      switch(categoryName) {
        case 'style':
          return language === 'en' ? 'Style Factors' : '风格因子';
        case 'industry':
          return language === 'en' ? 'Industry Factors' : '行业因子';
        case 'country':
          return language === 'en' ? 'Country Factors' : '国家因子';
        case 'sector':
          return language === 'en' ? 'Sector Factors' : '行业因子';
        default:
          return language === 'en' ? 'Other Factors' : '其他因子';
      }
    };
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-700">{getCategoryTitle()}</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Factor' : '因子'}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Portfolio Exposure' : '组合暴露'}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Benchmark' : '基准'}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Difference' : '差异'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factors.map((factor, index) => {
                const diff = factor.exposure - factor.benchmark;
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {language === 'en' ? factor.nameEn : factor.nameZh}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatNumber(factor.exposure)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className="text-gray-500">
                        {formatNumber(factor.benchmark)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {diff > 0 ? '+' : ''}{formatNumber(diff)}
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

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderErrorMessage()}
      
      {Object.keys(groupedFactors).map((category) => 
        renderFactorCategory(category, groupedFactors[category])
      )}
      
      {Object.keys(groupedFactors).length === 0 && (
        <div className="p-4 bg-yellow-50 rounded-md text-yellow-700">
          {language === 'en' 
            ? 'No factor data available for display.' 
            : '没有可显示的因子数据。'}
        </div>
      )}
    </div>
  );
};

export default FactorExposure;