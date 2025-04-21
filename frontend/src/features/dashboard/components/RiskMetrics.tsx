import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { RiskData } from '../../../shared/services/portfolioService';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../shared/config/constants';
import { TimeFrame } from '../../../shared/components/TimePeriodSelector';

interface RiskMetricsProps {
  data?: RiskData[];
  portfolioId?: string;
  timeFrame?: TimeFrame;
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ data, portfolioId, timeFrame }) => {
  const { language, t } = useLanguage();
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 默认风险指标 - 确保status值符合RiskData接口定义
  const defaultRiskMetrics: RiskData[] = [
    { 
      name: 'Volatility', 
      value: '14.5%', 
      benchmark: '16.2%', 
      status: 'good',
      percentage: 60
    },
    { 
      name: 'Downside Risk', 
      value: '9.8%', 
      benchmark: '12.4%', 
      status: 'good',
      percentage: 40
    },
    { 
      name: 'VaR (95%)', 
      value: '2.3%', 
      benchmark: '3.1%', 
      status: 'good',
      percentage: 30
    },
    { 
      name: 'Beta', 
      value: '0.92', 
      benchmark: '1.00', 
      status: 'neutral',
      percentage: 75
    },
    { 
      name: 'Maximum Drawdown', 
      value: '7.7%', 
      benchmark: '10.3%', 
      status: 'good',
      percentage: 55
    },
    { 
      name: 'Tracking Error', 
      value: '3.8%', 
      benchmark: '0.0%', 
      status: 'neutral',
      percentage: 65
    },
    { 
      name: 'Information Ratio', 
      value: '1.42', 
      benchmark: '0.0', 
      status: 'good',
      percentage: 85
    },
    { 
      name: 'Sortino Ratio', 
      value: '1.95', 
      benchmark: '1.48', 
      status: 'good',
      percentage: 90
    },
    { 
      name: 'Sharpe Ratio', 
      value: '1.75', 
      benchmark: '1.32', 
      status: 'good',
      percentage: 88
    },
  ];

  // 从API获取风险数据
  useEffect(() => {
    // 如果提供了直接的数据，使用这些数据
    if (data && data.length > 0) {
      setRiskData(data);
      return;
    }

    // 如果提供了portfolioId，则从API获取数据
    if (portfolioId) {
      setLoading(true);
      setError(null);
      
      // 修正API请求路径，使用专门的风险指标API端点
      console.log(`Fetching risk metrics for portfolio ${portfolioId}`);
      axios.get(`${API_BASE_URL}/analysis/${portfolioId}/risk`)
        .then(response => {
          console.log('Risk API response:', response.data);
          if (response.data && Array.isArray(response.data)) {
            console.log('Risk data found:', response.data);
            setRiskData(response.data);
          } else {
            // 尝试回退到完整分析数据请求
            console.warn('Invalid response format from risk endpoint, trying full analysis endpoint');
            return axios.get(`${API_BASE_URL}/analysis/${portfolioId}`);
          }
          setLoading(false);
        })
        .then(response => {
          // 这是完整分析数据的响应回调
          if (response && response.data && response.data.risk) {
            console.log('Risk data found in full analysis:', response.data.risk);
            setRiskData(response.data.risk);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Error fetching risk metrics:', err);
          setError(`Failed to load risk metrics: ${err.message}`);
          setRiskData(defaultRiskMetrics); // 使用默认数据作为后备方案
          setLoading(false);
        });
    } else {
      // 如果没有提供portfolioId或数据，使用默认数据
      setRiskData(defaultRiskMetrics);
    }
  }, [data, portfolioId]);

  // 使用传入的数据或默认数据
  const riskMetrics = riskData.length > 0 ? riskData : defaultRiskMetrics;

  // 风险指标与中英文名称映射
  const riskNameMappings: Record<string, string> = {
    'Volatility': 'dashboard.riskMetrics.volatility',
    'Downside Risk': 'dashboard.riskMetrics.downsideRisk',
    'VaR (95%)': 'dashboard.riskMetrics.var',
    'Beta': 'dashboard.riskMetrics.beta',
    'Maximum Drawdown': 'dashboard.riskMetrics.maxDrawdown',
    'Tracking Error': 'dashboard.riskMetrics.trackingError',
    'Information Ratio': 'dashboard.riskMetrics.informationRatio',
    'Sortino Ratio': 'dashboard.riskMetrics.sortinoRatio',
    'Sharpe Ratio': 'dashboard.riskMetrics.sharpeRatio',
  };

  // 风险状态标签映射
  const statusKeys: Record<string, string> = {
    'good': 'dashboard.riskMetrics.status.good',
    'neutral': 'dashboard.riskMetrics.status.neutral',
    'bad': 'dashboard.riskMetrics.status.bad',
    'low': 'dashboard.riskMetrics.status.low',
    'medium': 'dashboard.riskMetrics.status.medium',
    'high': 'dashboard.riskMetrics.status.high'
  };

  // 获取状态标签的翻译和显示逻辑
  const getStatusDisplay = (metric: RiskData) => {
    // 为每个指标定义合适的状态显示逻辑
    const positiveMetrics = ['Information Ratio', 'Sortino Ratio', 'Sharpe Ratio']; // 这些指标值越高越好
    const negativeMetrics = ['Volatility', 'Downside Risk', 'VaR (95%)', 'Beta', 'Maximum Drawdown']; // 这些指标值越低越好
    
    const statusKey = statusKeys[metric.status] || 'dashboard.riskMetrics.status.neutral';
    
    let statusColor = "bg-yellow-100 text-yellow-800"; // 默认中等
    
    if (positiveMetrics.includes(metric.name)) {
      // 对于正向指标（越高越好）
      if (metric.status === 'good') {
        statusColor = "bg-green-100 text-green-800"; // 高值=好
      } else if (metric.status === 'bad') {
        statusColor = "bg-red-100 text-red-800"; // 低值=差
      }
    } else if (negativeMetrics.includes(metric.name)) {
      // 对于负向指标（越低越好）
      if (metric.status === 'good') {
        statusColor = "bg-green-100 text-green-800"; // 低值=好
      } else if (metric.status === 'bad') {
        statusColor = "bg-red-100 text-red-800"; // 高值=差
      }
    } else if (metric.status === 'good' || metric.status === 'low') {
      statusColor = "bg-green-100 text-green-800";
    } else if (metric.status === 'bad' || metric.status === 'high') {
      statusColor = "bg-red-100 text-red-800";
    }
    
    return {
      text: t(statusKey),
      color: statusColor
    };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">{t('dashboard.riskMetrics.title')}</h2>
      
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">{t('dashboard.loading')}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          {riskMetrics.map((metric, index) => {
            // 获取指标名称的翻译
            const nameKey = riskNameMappings[metric.name] || metric.name;
            
            // 获取状态显示
            const statusDisplay = getStatusDisplay(metric);
            
            return (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">
                  {t(nameKey)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-2xl font-bold">{metric.value}</span>
                    {metric.benchmark && (
                      <span className="text-sm text-gray-500 ml-2">vs {metric.benchmark}</span>
                    )}
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiskMetrics; 