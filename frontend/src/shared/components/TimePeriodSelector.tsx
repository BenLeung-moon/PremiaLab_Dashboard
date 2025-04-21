import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

// 定义时间段类型
export type TimeFrame = 'ytd' | 'oneYear' | 'threeYear' | 'fiveYear' | 'tenYear' | 'all';

// 为API参数提供映射函数
export const getApiTimeFrame = (timeFrame: TimeFrame): string => {
  switch(timeFrame) {
    case 'ytd': return 'ytd';
    case 'oneYear': return '1year';
    case 'threeYear': return '3year'; 
    case 'fiveYear': return '5year';
    case 'tenYear': return '10year';
    case 'all': return 'all';
    default: return '1year';
  }
};

interface TimePeriodSelectorProps {
  selectedTimeFrame: TimeFrame;
  onChange: (timeFrame: TimeFrame) => void;
  showAll?: boolean; // 是否显示"全部"选项
  className?: string; // 允许自定义样式
  position?: 'left' | 'right' | 'center'; // 位置选项
}

const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedTimeFrame,
  onChange,
  showAll = false,
  className = '',
  position = 'right'
}) => {
  const { t, language } = useLanguage();
  
  // 定义时间段选项
  const timeFrameOptions = [
    { id: 'ytd', label: t('dashboard.timeframes.ytd') },
    { id: 'oneYear', label: t('dashboard.timeframes.oneYear') },
    { id: 'threeYear', label: t('dashboard.timeframes.threeYear') },
    { id: 'fiveYear', label: t('dashboard.timeframes.fiveYear') },
  ];
  
  // 如果需要显示全部选项，添加它
  if (showAll) {
    timeFrameOptions.push({ id: 'all', label: language === 'en' ? 'All Time' : '全部时间' });
  }

  // 设置位置样式
  let positionClass = 'justify-end';
  if (position === 'left') {
    positionClass = 'justify-start';
  } else if (position === 'center') {
    positionClass = 'justify-center';
  }

  return (
    <div className={`flex ${positionClass} ${className}`}>
      <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
        {timeFrameOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id as TimeFrame)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedTimeFrame === option.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimePeriodSelector; 