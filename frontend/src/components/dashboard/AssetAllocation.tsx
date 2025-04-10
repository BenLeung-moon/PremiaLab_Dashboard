import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface AssetAllocationProps {
  portfolioId: string;
}

const AssetAllocation: React.FC<AssetAllocationProps> = ({ portfolioId }) => {
  const { t } = useLanguage();
  
  const mockAssetData = [
    { type: '科技', percentage: 60 },
    { type: '金融', percentage: 20 },
    { type: '消费', percentage: 15 },
    { type: '医疗', percentage: 5 }
  ];
  
  const mockGeographyData = [
    { region: '美国', percentage: 70 },
    { region: '中国', percentage: 15 },
    { region: '欧洲', percentage: 10 },
    { region: '其他', percentage: 5 }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 行业配置 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-4">{t('dashboard.sectorAllocation')}</h2>
        <div className="space-y-4">
          {mockAssetData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.type}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: getColorByIndex(index)
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 地区配置 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-4">{t('dashboard.geographicAllocation')}</h2>
        <div className="space-y-4">
          {mockGeographyData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.region}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: getColorByIndex(index + 4) // 使用不同的颜色集
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 投资组合详情 */}
      <div className="md:col-span-2 bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-4">{t('dashboard.portfolioDetails')}</h2>
        <div className="overflow-hidden bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-lg text-gray-500">详细的投资组合分析将显示在这里</p>
          <p className="text-sm text-gray-400 mt-2">ID: {portfolioId}</p>
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
    '#06B6D4', // cyan-500
    '#14B8A6', // teal-500
  ];
  
  return colors[index % colors.length];
}

export default AssetAllocation; 