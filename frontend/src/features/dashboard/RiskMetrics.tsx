import { useLanguage } from '../../shared/i18n/LanguageContext';
import { RiskData } from '../../services/portfolioService';

interface RiskMetricsProps {
  data?: RiskData[];
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ data }) => {
  const { language } = useLanguage();

  // 默认风险指标
  const defaultRiskMetrics = [
    { 
      name: 'Volatility', 
      value: '8.5%', 
      benchmark: '10.2%', 
      status: 'good',
      percentage: 60
    },
    { 
      name: 'Downside Risk', 
      value: '6.2%', 
      benchmark: '8.4%', 
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
  ];

  // 使用传入的数据或默认数据
  const riskMetrics = data || defaultRiskMetrics;

  // 风险指标与中英文名称映射
  const riskNameMappings: Record<string, {en: string, zh: string}> = {
    'Volatility': {en: 'Volatility', zh: '波动率'},
    'Downside Risk': {en: 'Downside Risk', zh: '下行风险'},
    'VaR (95%)': {en: 'VaR (95%)', zh: 'VaR (95%)'},
    'Beta': {en: 'Beta', zh: '贝塔系数'},
    'Maximum Drawdown': {en: 'Max Drawdown', zh: '最大回撤'},
    'Sharpe Ratio': {en: 'Sharpe Ratio', zh: '夏普比率'},
    '波动率': {en: 'Volatility', zh: '波动率'},
    '下行风险': {en: 'Downside Risk', zh: '下行风险'},
    '贝塔系数': {en: 'Beta', zh: '贝塔系数'},
    '最大回撤': {en: 'Max Drawdown', zh: '最大回撤'},
    '夏普比率': {en: 'Sharpe Ratio', zh: '夏普比率'},
  };

  // 风险状态标签映射
  const statusLabels: Record<string, {en: string, zh: string}> = {
    'good': {en: 'Low Risk', zh: '低风险'},
    'neutral': {en: 'Neutral', zh: '中等'},
    'bad': {en: 'High Risk', zh: '高风险'},
    'low': {en: 'Low Risk', zh: '低风险'},
    'medium': {en: 'Medium Risk', zh: '中等风险'},
    'high': {en: 'High Risk', zh: '高风险'}
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">{language === 'en' ? 'Risk Metrics' : '风险指标'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {riskMetrics.map((metric, index) => {
          // 获取指标名称的中英文版本
          const nameMapping = riskNameMappings[metric.name] || {
            en: metric.name,
            zh: metric.name
          };
          
          // 获取状态标签
          const statusLabel = statusLabels[metric.status] || {
            en: 'Neutral',
            zh: '中等'
          };
          
          return (
            <div key={index} className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">
                {language === 'en' ? nameMapping.en : nameMapping.zh}
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
                      {language === 'en' ? statusLabel.en : statusLabel.zh}
                    </span>
                  ) : metric.status === 'neutral' || metric.status === 'medium' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {language === 'en' ? statusLabel.en : statusLabel.zh}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {language === 'en' ? statusLabel.en : statusLabel.zh}
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