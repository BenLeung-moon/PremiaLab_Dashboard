import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { RiskData } from '../../../shared/services/portfolioService';

interface RiskMetricsProps {
  data?: RiskData[];
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ data }) => {
  const { language, t } = useLanguage();

  // 默认风险指标
  const defaultRiskMetrics = [
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
  ];

  // 使用传入的数据或默认数据
  const riskMetrics = data || defaultRiskMetrics;

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

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">{t('dashboard.riskMetrics.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {riskMetrics.map((metric, index) => {
          // 获取指标名称的翻译
          const nameKey = riskNameMappings[metric.name] || metric.name;
          
          // 获取状态标签
          const statusKey = statusKeys[metric.status] || 'dashboard.riskMetrics.status.neutral';
          
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
                  {metric.status === 'good' || metric.status === 'low' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t(statusKey)}
                    </span>
                  ) : metric.status === 'neutral' || metric.status === 'medium' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t(statusKey)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {t(statusKey)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskMetrics; 