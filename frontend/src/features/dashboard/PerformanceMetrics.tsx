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

const PerformanceMetrics = () => {
  const { t } = useLanguage();
  
  const metrics = [
    { name: '总收益', value: 28.4, change: 2.3 },
    { name: '年化收益', value: 12.4, change: 1.5 },
    { name: '夏普比率', value: 1.2, change: 0.15 },
    { name: '最大回撤', value: -15.4, change: -1.4 },
    { name: '波动率', value: 18.6, change: -0.8 },
    { name: '信息比率', value: 0.95, change: 0.05 }
  ];

  // 图表数据
  const chartData: ChartData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    datasets: [
      {
        label: 'Portfolio Return',
        data: [2.5, 2.8, 3.1, 2.9, 3.2, 3.5, 3.8, 4.1, 4.3, 4.5, 4.7, 5.0],
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
        label: 'Benchmark',
        data: [2.1, 2.3, 2.4, 2.2, 2.5, 2.7, 2.9, 3.1, 3.3, 3.5, 3.7, 4.0],
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
            weight: '500'
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
    <div className="space-y-6">
      {/* 指标卡片 */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {metrics.map((metric, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg shadow-lg border border-[#A3BFFA] p-6 relative"
            >
              {/* 黄色圆形装饰 */}
              <div className="absolute top-0 left-6 w-3 h-3 bg-[#F7D154] rounded-full"></div>
              
              {/* 指标名称 */}
              <div className="text-[#1E3A8A] font-medium mb-2">{metric.name}</div>
              
              {/* 指标数值 */}
              <div className="text-2xl font-bold mb-2">
                {metric.value}{typeof metric.value === 'number' ? '%' : ''}
              </div>
              
              {/* 变化值 */}
              <div className={`text-sm ${metric.change >= 0 ? 'text-[#F7D154]' : 'text-[#EF4444]'}`}>
                {metric.change >= 0 ? '+' : ''}{metric.change}{typeof metric.change === 'number' ? '%' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 绩效对比图表卡片 */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
          <div className="bg-white rounded-lg shadow-lg border border-[#A3BFFA] overflow-hidden">
            {/* 图表标题 */}
            <div className="bg-[#1E3A8A] p-4">
              <h3 className="text-white text-lg font-medium">Performance vs Benchmark</h3>
            </div>
            
            {/* 图表区域 */}
            <div className="p-6">
              <div className="h-80">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 