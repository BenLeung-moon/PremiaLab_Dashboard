import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { formatNumber, formatPercent } from '../../../shared/utils/formatting';
import { PerformanceData, PerformanceTimeFrame } from '../../../shared/services/portfolioService';
import TimePeriodSelector, { TimeFrame } from '../../../shared/components/TimePeriodSelector';

// 定义指标数据类型
interface MetricData {
  nameEn: string;
  nameZh: string;
  value: number;
  change: number;
  suffix: string;
  valueType?: 'percent' | 'number'; // 添加valueType属性
}

interface PerformanceMetricsProps {
  data?: PerformanceData;
  timeFrame?: TimeFrame; // 添加时间周期参数
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data, timeFrame = 'oneYear' }) => {
  const { language, t } = useLanguage();
  // 添加状态来存储处理后的数据
  const [processedData, setProcessedData] = useState<PerformanceData | undefined>(undefined);
  
  // 添加更详细的调试日志
  useEffect(() => {
    console.log('PerformanceMetrics 组件收到数据:', data);
    console.log('数据类型:', typeof data);
    console.log('当前时间段:', timeFrame);
    if (data) {
      console.log('数据结构:', Object.keys(data));
      console.log('totalReturn:', data.totalReturn, '类型:', typeof data.totalReturn);
      console.log('timeFrames:', data.timeFrames);
      if (data.timeFrames) {
        console.log('timeFrames 结构:', Object.keys(data.timeFrames));
      }
      
      // 添加更多详细的调试
      console.log('annualizedReturn:', data.annualizedReturn);
      console.log('volatility:', data.volatility);
      console.log('sharpeRatio:', data.sharpeRatio);
      console.log('maxDrawdown:', data.maxDrawdown);
      console.log('winRate:', data.winRate);
      console.log('monthlyReturns:', data.monthlyReturns);
    } else {
      console.error('PerformanceMetrics 组件未收到有效数据');
    }
  }, [data, timeFrame]);
  
  // 当传入的数据变化时处理数据
  useEffect(() => {
    if (data) {
      console.log('原始性能数据:', data);
      
      // 处理数据，确保它符合预期的格式
      const processed = processPerformanceData(data);
      setProcessedData(processed);
      
      console.log('处理后的性能数据:', processed);
    }
  }, [data]);
  
  // 处理性能数据，确保格式一致
  const processPerformanceData = (rawData: PerformanceData): PerformanceData => {
    // 创建一个深拷贝以避免修改原始数据
    const processedData = JSON.parse(JSON.stringify(rawData)) as PerformanceData;
    
    // 确保timeFrames存在
    if (!processedData.timeFrames) {
      console.warn('数据中没有timeFrames，使用默认值');
      processedData.timeFrames = {
        ytd: createDefaultTimeFrame(),
        oneYear: createDefaultTimeFrame(),
        threeYear: createDefaultTimeFrame(),
        fiveYear: createDefaultTimeFrame()
      };
    } else {
      // 遍历每个时间段，确保数据格式正确
      const timeFrameKeys: TimeFrame[] = ['ytd', 'oneYear', 'threeYear', 'fiveYear'];
      
      for (const key of timeFrameKeys) {
        // 如果时间段不存在，创建默认数据
        if (!processedData.timeFrames[key]) {
          processedData.timeFrames[key] = createDefaultTimeFrame();
          continue;
        }
        
        const timeFrame = processedData.timeFrames[key];
        
        // 如果return是一个对象而不是数值
        if (timeFrame.return && typeof timeFrame.return === 'object') {
          console.log(`发现${key}.return是对象格式:`, timeFrame.return);
          
          try {
            // 尝试从对象中提取数据
            const returnObj = timeFrame.return as any;
            
            // 如果对象有portfolio字段，使用它作为return值
            if (returnObj.portfolio !== undefined) {
              const portfolioReturn = parseFloat(returnObj.portfolio);
              if (!isNaN(portfolioReturn)) {
                timeFrame.return = portfolioReturn;
              }
              
              // 如果对象有benchmark字段，用于benchmarkReturn
              if (returnObj.benchmark !== undefined) {
                const benchmarkReturn = parseFloat(returnObj.benchmark);
                if (!isNaN(benchmarkReturn)) {
                  timeFrame.benchmarkReturn = benchmarkReturn;
                }
              }
              
              // 如果对象有excess字段，用于excessReturn
              if (returnObj.excess !== undefined) {
                const excessReturn = parseFloat(returnObj.excess);
                if (!isNaN(excessReturn)) {
                  timeFrame.excessReturn = excessReturn;
                }
              }
            }
          } catch (e) {
            console.error(`处理${key}.return时出错:`, e);
            timeFrame.return = 0;
          }
        }
        
        // 确保benchmarkReturn存在
        if (timeFrame.benchmarkReturn === undefined) {
          if (timeFrame.benchmark !== undefined) {
            timeFrame.benchmarkReturn = timeFrame.benchmark as number;
          } else {
            timeFrame.benchmarkReturn = 0;
          }
        }
        
        // 确保excessReturn存在
        if (timeFrame.excessReturn === undefined) {
          if (timeFrame.excess !== undefined) {
            timeFrame.excessReturn = timeFrame.excess as number;
          } else if (typeof timeFrame.return === 'number' && typeof timeFrame.benchmarkReturn === 'number') {
            timeFrame.excessReturn = timeFrame.return - timeFrame.benchmarkReturn;
          } else {
            timeFrame.excessReturn = 0;
          }
        }
      }
    }
    
    return processedData;
  };
  
  // 创建默认的时间段数据
  const createDefaultTimeFrame = (): PerformanceTimeFrame => ({
    return: 0,
    annualized: 0,
    benchmarkReturn: 0,
    excessReturn: 0,
    volatility: 0,
    sharpe: 0
  });
  
  // 使用处理后的数据或默认数据
  const performanceData = processedData || {
    totalReturn: 15.27,
    annualizedReturn: 12.84,
    volatility: 14.52,
    sharpeRatio: 1.75,
    maxDrawdown: -7.73,
    winRate: 49.62,
    monthlyReturns: [],
    timeFrames: {
      ytd: {
        return: 8.35,
        annualized: 10.21,
        benchmarkReturn: 6.42,
        excessReturn: 1.93,
        volatility: 12.75,
        sharpe: 1.45
      },
      oneYear: {
        return: 15.27,
        annualized: 15.27,
        benchmarkReturn: 12.18,
        excessReturn: 3.09,
        volatility: 14.52,
        sharpe: 1.75
      },
      threeYear: {
        return: 42.83,
        annualized: 12.62,
        benchmarkReturn: 35.21,
        excessReturn: 7.62,
        volatility: 16.38,
        sharpe: 1.52
      },
      fiveYear: {
        return: 78.15,
        annualized: 12.21,
        benchmarkReturn: 65.34,
        excessReturn: 12.81,
        volatility: 17.25,
        sharpe: 1.42
      }
    }
  };
  
  // 获取当前时间段的数据
  const getCurrentTimeFrameData = () => {
    // 获取选中的时间段数据
    const timeFrameData = performanceData.timeFrames?.[timeFrame];
    
    // 如果没有当前时间段的数据，返回总体指标
    if (!timeFrameData) {
      console.warn(`未找到${timeFrame}时间段数据，使用总体指标`);
      return {
        return: performanceData.totalReturn,
        annualized: performanceData.annualizedReturn,
        volatility: performanceData.volatility,
        sharpe: performanceData.sharpeRatio,
        maxDrawdown: performanceData.maxDrawdown,
        winRate: performanceData.winRate
      };
    }
    
    // 将timeFrame中的数据映射到所需的格式
    return {
      return: typeof timeFrameData.return === 'number' ? timeFrameData.return : 0,
      annualized: timeFrameData.annualized !== undefined ? timeFrameData.annualized : performanceData.annualizedReturn,
      volatility: timeFrameData.volatility !== undefined ? timeFrameData.volatility : performanceData.volatility,
      sharpe: timeFrameData.sharpe !== undefined ? timeFrameData.sharpe : performanceData.sharpeRatio,
      maxDrawdown: performanceData.maxDrawdown,
      winRate: performanceData.winRate
    };
  };
  
  // 当前显示的时间段数据
  const currentTimeFrameData = getCurrentTimeFrameData();
  
  // 计算指标变化值的安全函数
  const calculateChange = (current: number | undefined, previous: number | undefined): number => {
    if (current === undefined || previous === undefined) {
      return 0;
    }
    return current - previous;
  };
  
  // 指标数据（含中英文标签）根据选择的时间段更新
  const metrics = [
    { 
      name: t('dashboard.performanceMetrics.totalReturn'), 
      value: currentTimeFrameData.return, 
      change: performanceData.timeFrames?.[timeFrame]?.excessReturn || 0,
      suffix: '%',
      valueType: 'percent'
    },
    { 
      name: t('dashboard.performanceMetrics.annualizedReturn'), 
      value: currentTimeFrameData.annualized, 
      change: calculateChange(
        performanceData.timeFrames?.[timeFrame]?.annualized,
        performanceData.timeFrames?.threeYear?.annualized
      ),
      suffix: '%',
      valueType: 'percent'
    },
    { 
      name: t('dashboard.performanceMetrics.sharpeRatio'), 
      value: currentTimeFrameData.sharpe, 
      change: calculateChange(
        performanceData.timeFrames?.[timeFrame]?.sharpe,
        performanceData.timeFrames?.threeYear?.sharpe
      ),
      suffix: '',
      valueType: 'number'
    },
    { 
      name: t('dashboard.performanceMetrics.maxDrawdown'), 
      value: currentTimeFrameData.maxDrawdown, 
      change: currentTimeFrameData.maxDrawdown - (performanceData.timeFrames?.threeYear?.return || 0) / 3,
      suffix: '%',
      valueType: 'percent'
    },
    { 
      name: t('dashboard.performanceMetrics.volatility'), 
      value: currentTimeFrameData.volatility, 
      change: calculateChange(
        performanceData.timeFrames?.[timeFrame]?.volatility,
        performanceData.timeFrames?.threeYear?.volatility
      ),
      suffix: '%',
      valueType: 'percent'
    },
    { 
      name: t('dashboard.performanceMetrics.winRate'), 
      value: currentTimeFrameData.winRate || 0, 
      change: 0,
      suffix: '%',
      valueType: 'percent'
    }
  ];
  
  // 添加调试日志显示最终的指标数据
  console.log('最终计算的指标数据:', metrics);
  
  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-full mx-auto">
      {/* 指标卡片 - 使用grid布局 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {metrics.map((metric, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300 w-full"
          >
            {/* 指标名称 */}
            <div className="text-blue-800 font-medium mb-1">
              {metric.name}
            </div>
            
            {/* 指标数值 */}
            <div className="flex items-baseline">
              <div className="text-3xl font-bold">
                {metric.valueType === 'percent' 
                  ? formatPercent(metric.value)
                  : formatNumber(metric.value)}
              </div>
              <div className="ml-1">
                {metric.suffix}
              </div>
            </div>
            
            {/* 变化值 */}
            {metric.change !== undefined && (
              <div className={`mt-2 text-sm font-medium ${metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '→'} 
                {Math.abs(metric.change).toFixed(2)}{metric.valueType === 'percent' ? '%' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetrics; 