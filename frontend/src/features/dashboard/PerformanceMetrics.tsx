import React from 'react';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PerformanceData, PerformanceTimeFrame } from '../../services/portfolioService';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 定义图表数据类型
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
    pointRadius: number;
    pointHoverRadius: number;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointBorderWidth: number;
  }[];
}

interface PerformanceMetricsProps {
  data?: PerformanceData;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data }) => {
  const { language } = useLanguage();
  
  // 默认时间段数据
  const defaultTimeFrame: PerformanceTimeFrame = {
    return: 0,
    annualized: 0,
    benchmarkReturn: 0,
    excessReturn: 0,
    volatility: 0,
    sharpe: 0
  };
  
  // 默认数据（当没有传入数据时使用）
  const defaultData: PerformanceData = {
    totalReturn: 0,
    annualizedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    monthlyReturns: [],
    timeFrames: {
      ytd: defaultTimeFrame,
      oneYear: defaultTimeFrame,
      threeYear: defaultTimeFrame,
      fiveYear: defaultTimeFrame
    }
  };
  
  // 使用传入的数据或默认数据
  const performanceData = data || defaultData;
  
  // 计算指标变化值的安全函数
  const calculateChange = (current: number | undefined, previous: number | undefined): number => {
    if (current === undefined || previous === undefined) {
      return 0;
    }
    return current - previous;
  };
  
  // 指标数据（含中英文标签）
  const metrics = [
    { 
      nameEn: 'Total Return', 
      nameZh: '总收益', 
      value: performanceData.totalReturn, 
      change: performanceData.timeFrames?.oneYear?.excessReturn || 0,
      suffix: '%'
    },
    { 
      nameEn: 'Annualized Return', 
      nameZh: '年化收益', 
      value: performanceData.annualizedReturn, 
      change: calculateChange(
        performanceData.timeFrames?.oneYear?.annualized,
        performanceData.timeFrames?.threeYear?.annualized
      ),
      suffix: '%'
    },
    { 
      nameEn: 'Sharpe Ratio', 
      nameZh: '夏普比率', 
      value: performanceData.sharpeRatio, 
      change: calculateChange(
        performanceData.timeFrames?.oneYear?.sharpe,
        performanceData.timeFrames?.threeYear?.sharpe
      ),
      suffix: ''
    },
    { 
      nameEn: 'Max Drawdown', 
      nameZh: '最大回撤', 
      value: performanceData.maxDrawdown, 
      change: performanceData.maxDrawdown - (performanceData.timeFrames?.threeYear?.return || 0) / 3,
      suffix: '%'
    },
    { 
      nameEn: 'Volatility', 
      nameZh: '波动率', 
      value: performanceData.volatility, 
      change: calculateChange(
        performanceData.timeFrames?.oneYear?.volatility,
        performanceData.timeFrames?.threeYear?.volatility
      ),
      suffix: '%'
    },
    { 
      nameEn: 'Win Rate', 
      nameZh: '胜率', 
      value: performanceData.winRate || 0, 
      change: 0,
      suffix: '%'
    }
  ];

  // 生成月度收益图表数据
  const monthLabels = language === 'en' 
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  // 从API数据中提取月度收益数据，如果没有则使用默认值
  const portfolioMonthlyData = Array(12).fill(0);
  const benchmarkMonthlyData = Array(12).fill(0);
  
  // 如果有月度收益数据，填充数组
  if (performanceData.monthlyReturns && performanceData.monthlyReturns.length > 0) {
    performanceData.monthlyReturns.forEach((item, index) => {
      if (index < 12) {
        portfolioMonthlyData[index] = item.return;
        // 假设基准收益率比投资组合低一些
        benchmarkMonthlyData[index] = item.return * 0.8;
      }
    });
  }

  // 图表数据
  const chartData: ChartData = {
    labels: monthLabels,
    datasets: [
      {
        label: language === 'en' ? 'Portfolio Return' : '投资组合收益',
        data: portfolioMonthlyData,
        borderColor: '#1E3A8A',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1E3A8A',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      },
      {
        label: language === 'en' ? 'Benchmark' : '基准',
        data: benchmarkMonthlyData,
        borderColor: '#A3BFFA',
        backgroundColor: 'rgba(163, 191, 250, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#A3BFFA',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      }
    ]
  };

  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#1E3A8A',
          font: {
            size: 12,
            weight: '500' as any // 修复TypeScript类型错误
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1E3A8A',
        bodyColor: '#1E3A8A',
        borderColor: '#A3BFFA',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(163, 191, 250, 0.1)'
        },
        ticks: {
          color: '#1E3A8A',
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#1E3A8A'
        }
      }
    }
  };

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
              {language === 'en' ? metric.nameEn : metric.nameZh}
            </div>
            
            {/* 指标数值 */}
            <div className="flex items-baseline">
              <div className="text-3xl font-bold">
                {metric.value}
              </div>
              <div className="ml-1">
                {metric.suffix}
              </div>
            </div>
            
            {/* 变化值 */}
            <div className={`mt-2 text-sm font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}{metric.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* 绩效对比图表卡片 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 w-full">
        {/* 图表标题 */}
        <div className="bg-blue-800 p-3">
          <h3 className="text-white text-lg font-medium">
            {language === 'en' ? 'Performance vs Benchmark' : '绩效与基准对比'}
          </h3>
        </div>
        
        {/* 图表区域 */}
        <div className="p-4">
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 