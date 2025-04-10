import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const RiskMetrics: React.FC = () => {
  const { t } = useLanguage();
  
  // 模拟数据：风险指标
  const riskData = [
    { name: '波动率', value: '18.6%', status: 'medium', percentage: 60 },
    { name: '最大回撤', value: '-15.4%', status: 'low', percentage: 40 },
    { name: '下行风险', value: '12.3%', status: 'medium', percentage: 55 },
    { name: '贝塔系数', value: '1.12', status: 'high', percentage: 75 },
    { name: 'VaR (95%)', value: '-2.8%', status: 'low', percentage: 30 },
    { name: '夏普比率', value: '1.2', status: 'medium', percentage: 65 }
  ];
  
  // 风险分布数据
  const distributions = [
    { name: '地区风险', data: [
      { name: '美国', percentage: 70 },
      { name: '中国', percentage: 15 },
      { name: '欧洲', percentage: 10 },
      { name: '其他', percentage: 5 }
    ]},
    { name: '行业风险', data: [
      { name: '科技', percentage: 60 },
      { name: '金融', percentage: 20 },
      { name: '消费', percentage: 15 },
      { name: '医疗', percentage: 5 }
    ]}
  ];

  // 获取状态对应的颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* 主要风险指标 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">{t('dashboard.risk')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskData.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-gray-600">{item.name}</div>
                <div className="font-medium">{item.value}</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${getStatusColor(item.status)}-500`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>低</span>
                <span>中</span>
                <span>高</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 风险分布 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">风险分布</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {distributions.map((distribution, distIndex) => (
            <div key={distIndex}>
              <h3 className="text-base font-medium mb-4">{distribution.name}</h3>
              <div className="space-y-4">
                {distribution.data.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.name}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: getColorByIndex(itemIndex)
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 风险矩阵 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">风险与收益</h2>
        <div className="h-80 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4">图表：风险与收益散点图</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 辅助函数：根据索引获取颜色
function getColorByIndex(index: number): string {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // green-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // purple-500
    '#EC4899', // pink-500
  ];
  
  return colors[index % colors.length];
}

export default RiskMetrics; 