import React, { useState, useEffect } from 'react';
import { getPortfolioAllocation } from '../../shared/services/portfolioService';
import { useLanguage } from '../../shared/i18n/LanguageContext';

// Chart colors
const CHART_COLORS = [
  '#4f46e5', // Blue
  '#0ea5e9', // Light blue
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#10b981', // Green
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#a855f7', // Magenta
  '#6366f1', // Indigo
  '#3b82f6', // Sky blue
  '#0891b2', // Deep cyan
  '#059669', // Emerald
  '#65a30d', // Lime green
  '#ca8a04', // Deep yellow
  '#ea580c', // Deep orange
  '#dc2626', // Deep red
  '#db2777', // Deep pink
  '#7e22ce', // Deep purple
  '#4338ca', // Deep indigo
];

interface AssetAllocationProps {
  portfolioId: string;
}

interface AllocationData {
  sectorDistribution: { [key: string]: number };
  regionDistribution: { [key: string]: number };
  marketCapDistribution: { [key: string]: number };
}

// Render pie chart function
const renderPieChart = (data: { [key: string]: number }) => {
  // 添加调试代码
  console.log('Rendering pie chart with data:', data);
  
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const items = Object.entries(data).sort((a, b) => b[1] - a[1]); // Sort by percentage in descending order
  
  console.log('Pie chart items:', items);
  console.log('Total value:', total);
  
  // 如果数据为空或只有一项，返回一个完整的圆
  if (items.length === 0) {
    console.log('No data available for pie chart');
    return null;
  }
  
  if (items.length === 1) {
    console.log('Only one item in pie chart data');
    return (
      <path
        d="M 50 50 L 50 10 A 40 40 0 1 1 49.99 10 Z"
        fill={CHART_COLORS[0]}
        stroke="#fff"
        strokeWidth="0.5"
      >
        <title>{items[0][0]}: 100.0%</title>
      </path>
    );
  }
  
  let currentAngle = 0;
  
  return items.map(([key, value], index) => {
    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');
    
    console.log(`Pie segment for ${key}: ${percentage.toFixed(1)}%, path: ${pathData}`);
    
    return (
      <path
        key={key}
        d={pathData}
        fill={CHART_COLORS[index % CHART_COLORS.length]}
        stroke="#fff"
        strokeWidth="0.5"
      >
        <title>{key}: {percentage.toFixed(1)}%</title>
      </path>
    );
  });
};

const AssetAllocation: React.FC<AssetAllocationProps> = ({ portfolioId }) => {
  const { t, language } = useLanguage();
  const [allocation, setAllocation] = useState<AllocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllocation = async () => {
      try {
        setLoading(true);
        const data = await getPortfolioAllocation(portfolioId);
        
        // 处理API返回的数据，将其转换为前端所需的格式
        const allocationData: AllocationData = {
          sectorDistribution: data.sectorDistribution || {},
          regionDistribution: data.regionDistribution || {},
          marketCapDistribution: data.marketCapDistribution || {}
        };
        
        setAllocation(allocationData);
        setError(null);
      } catch (err) {
        setError(language === 'en' ? 'Failed to load allocation data' : '加载资产配置数据失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocation();
  }, [portfolioId, language]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="bg-gray-50 text-gray-700 p-4 rounded-lg">
        <p>{language === 'en' ? 'No data available' : '没有可用数据'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sector Distribution */}
      <div>
        <h3 className="text-lg font-medium mb-4">{language === 'en' ? 'Sector Distribution' : '行业分布'}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {Object.keys(allocation.sectorDistribution).length > 0 && 
                      renderPieChart(allocation.sectorDistribution)}
                    {Object.keys(allocation.sectorDistribution).length === 0 && 
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="4">
                        {language === 'en' ? 'No data available' : '没有可用数据'}
                      </text>}
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="space-y-2">
                {Object.entries(allocation.sectorDistribution).map(([sector, percentage], index) => (
                  <div key={sector} className="flex items-center">
                    <div
                      className="w-4 h-4 mr-2 rounded-sm"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    ></div>
                    <div className="flex-1 text-sm">{sector}</div>
                    <div className="font-semibold">{percentage.toFixed(1)}%</div>
                  </div>
                ))}
                {Object.entries(allocation.sectorDistribution).length === 0 && (
                  <div className="text-center text-gray-500">
                    {language === 'en' ? 'No data available' : '没有可用数据'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Region Distribution */}
      <div>
        <h3 className="text-lg font-medium mb-4">{language === 'en' ? 'Region Distribution' : '地区分布'}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {Object.keys(allocation.regionDistribution).length > 0 && 
                      renderPieChart(allocation.regionDistribution)}
                    {Object.keys(allocation.regionDistribution).length === 0 && 
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="4">
                        {language === 'en' ? 'No data available' : '没有可用数据'}
                      </text>}
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="space-y-2">
                {Object.entries(allocation.regionDistribution).map(([region, percentage], index) => (
                  <div key={region} className="flex items-center">
                    <div
                      className="w-4 h-4 mr-2 rounded-sm"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    ></div>
                    <div className="flex-1 text-sm">{region}</div>
                    <div className="font-semibold">{percentage.toFixed(1)}%</div>
                  </div>
                ))}
                {Object.entries(allocation.regionDistribution).length === 0 && (
                  <div className="text-center text-gray-500">
                    {language === 'en' ? 'No data available' : '没有可用数据'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Cap Distribution */}
      <div>
        <h3 className="text-lg font-medium mb-4">{language === 'en' ? 'Market Cap Distribution' : '市值分布'}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {Object.keys(allocation.marketCapDistribution).length > 0 && 
                      renderPieChart(allocation.marketCapDistribution)}
                    {Object.keys(allocation.marketCapDistribution).length === 0 && 
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="4">
                        {language === 'en' ? 'No data available' : '没有可用数据'}
                      </text>}
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="space-y-2">
                {Object.entries(allocation.marketCapDistribution).map(([size, percentage], index) => (
                  <div key={size} className="flex items-center">
                    <div
                      className="w-4 h-4 mr-2 rounded-sm"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    ></div>
                    <div className="flex-1 text-sm">{size}</div>
                    <div className="font-semibold">{percentage.toFixed(1)}%</div>
                  </div>
                ))}
                {Object.entries(allocation.marketCapDistribution).length === 0 && (
                  <div className="text-center text-gray-500">
                    {language === 'en' ? 'No data available' : '没有可用数据'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetAllocation; 