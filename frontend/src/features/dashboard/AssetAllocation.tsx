import React, { useState, useEffect } from 'react';
import { getPortfolioAllocation } from '../../shared/services/portfolioService';
import { useLanguage } from '../../shared/i18n/LanguageContext';

// 饼图颜色
const CHART_COLORS = [
  '#4f46e5', // 蓝色
  '#0ea5e9', // 亮蓝
  '#06b6d4', // 青色
  '#14b8a6', // 青绿色
  '#10b981', // 绿色
  '#84cc16', // 黄绿色
  '#eab308', // 黄色
  '#f59e0b', // 琥珀色
  '#f97316', // 橙色
  '#ef4444', // 红色
  '#ec4899', // 粉色
  '#8b5cf6', // 紫色
  '#a855f7', // 洋红色
  '#6366f1', // 靛蓝色
  '#3b82f6', // 天蓝色
  '#0891b2', // 深青色
  '#059669', // 祖母绿
  '#65a30d', // 酸橙色
  '#ca8a04', // 深黄色
  '#ea580c', // 深橙色
  '#dc2626', // 深红色
  '#db2777', // 深粉色
  '#7e22ce', // 深紫色
  '#4338ca', // 深靛蓝色
];

interface AssetAllocationProps {
  portfolioId: string;
}

interface AllocationData {
  行业分布: { [key: string]: number };
  地区分布: { [key: string]: number };
  市值分布: { [key: string]: number };
}

const AssetAllocation: React.FC<AssetAllocationProps> = ({ portfolioId }) => {
  const { t } = useLanguage();
  const [allocation, setAllocation] = useState<AllocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllocation = async () => {
      try {
        setLoading(true);
        const data = await getPortfolioAllocation(portfolioId);
        setAllocation(data);
        setError(null);
      } catch (err) {
        setError('无法加载资产配置数据');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocation();
  }, [portfolioId]);

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
        <p>暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 行业分布 */}
      <div>
        <h3 className="text-lg font-medium mb-4">行业分布</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {renderPieChart(allocation.行业分布)}
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="space-y-2">
                {Object.entries(allocation.行业分布).map(([sector, percentage], index) => (
                  <div key={sector} className="flex items-center">
                    <div
                      className="w-4 h-4 mr-2 rounded-sm"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    ></div>
                    <div className="flex-1 text-sm">{sector}</div>
                    <div className="font-semibold">{percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 地区分布 */}
      <div>
        <h3 className="text-lg font-medium mb-4">地区分布</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {renderPieChart(allocation.地区分布)}
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="space-y-2">
                {Object.entries(allocation.地区分布).map(([region, percentage], index) => (
                  <div key={region} className="flex items-center">
                    <div
                      className="w-4 h-4 mr-2 rounded-sm"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    ></div>
                    <div className="flex-1 text-sm">{region}</div>
                    <div className="font-semibold">{percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 市值分布 */}
      <div>
        <h3 className="text-lg font-medium mb-4">市值分布</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {renderPieChart(allocation.市值分布)}
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="space-y-2">
                {Object.entries(allocation.市值分布).map(([size, percentage], index) => (
                  <div key={size} className="flex items-center">
                    <div
                      className="w-4 h-4 mr-2 rounded-sm"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    ></div>
                    <div className="flex-1 text-sm">{size}</div>
                    <div className="font-semibold">{percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 渲染饼图
const renderPieChart = (data: { [key: string]: number }) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const items = Object.entries(data).sort((a, b) => b[1] - a[1]); // 按百分比降序排序
  
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

export default AssetAllocation; 