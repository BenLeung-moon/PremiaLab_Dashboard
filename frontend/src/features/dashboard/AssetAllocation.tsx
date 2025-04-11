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
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const items = Object.entries(data).sort((a, b) => b[1] - a[1]); // Sort by percentage in descending order
  
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
        
        // Convert the API response to camelCase keys for consistency
        setAllocation({
          sectorDistribution: data.行业分布, 
          regionDistribution: data.地区分布,
          marketCapDistribution: data.市值分布
        });
        
        setError(null);
      } catch (err) {
        setError(t('dashboard.errors.loadAllocationFailed'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocation();
  }, [portfolioId, t]);

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
        <p>{t('dashboard.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sector Distribution */}
      <div>
        <h3 className="text-lg font-medium mb-4">{t('dashboard.sectorDistribution')}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {renderPieChart(allocation.sectorDistribution)}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Region Distribution */}
      <div>
        <h3 className="text-lg font-medium mb-4">{t('dashboard.regionDistribution')}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {renderPieChart(allocation.regionDistribution)}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Cap Distribution */}
      <div>
        <h3 className="text-lg font-medium mb-4">{t('dashboard.marketCapDistribution')}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex h-64 items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {renderPieChart(allocation.marketCapDistribution)}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetAllocation; 