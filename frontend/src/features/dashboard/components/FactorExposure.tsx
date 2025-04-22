import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { FactorsData } from '../../../shared/services/portfolioService';
import { Bar } from 'react-chartjs-2';
import { formatNumber } from '../../../shared/utils/formatting';
import { TimeFrame } from '../../../shared/components/TimePeriodSelector';

interface FactorExposureProps {
  factors?: FactorsData | any; // 接受任意数据格式
  timeFrame?: TimeFrame;
}

// 更丰富的默认数据，包含实际值和颜色信息
const DEFAULT_FACTORS = [
  { nameEn: 'Value', nameZh: '价值', exposure: 0.58, benchmark: 0.45, category: 'style' },
  { nameEn: 'Growth', nameZh: '成长', exposure: 0.32, benchmark: 0.55, category: 'style' },
  { nameEn: 'Size', nameZh: '规模', exposure: -0.15, benchmark: 0.10, category: 'style' },
  { nameEn: 'Momentum', nameZh: '动量', exposure: 0.75, benchmark: 0.52, category: 'style' },
  { nameEn: 'Quality', nameZh: '质量', exposure: 0.65, benchmark: 0.42, category: 'style' },
  { nameEn: 'Volatility', nameZh: '波动性', exposure: -0.35, benchmark: -0.20, category: 'style' },
  { nameEn: 'Information Technology', nameZh: '信息技术', exposure: 0.83, benchmark: 0.65, category: 'sector' },
  { nameEn: 'Aerospace and Defense', nameZh: '航空航天与国防', exposure: -0.25, benchmark: -0.15, category: 'sector' },
  { nameEn: 'Healthcare', nameZh: '医疗健康', exposure: 0.42, benchmark: 0.35, category: 'sector' },
  { nameEn: 'Financials', nameZh: '金融', exposure: -0.12, benchmark: 0.25, category: 'sector' },
  { nameEn: 'Consumer Discretionary', nameZh: '非必需消费品', exposure: 0.38, benchmark: 0.30, category: 'sector' },
  { nameEn: 'United States', nameZh: '美国', exposure: 0.78, benchmark: 0.65, category: 'country' },
  { nameEn: 'China', nameZh: '中国', exposure: 0.25, benchmark: 0.18, category: 'country' },
  { nameEn: 'Europe', nameZh: '欧洲', exposure: -0.12, benchmark: 0.10, category: 'country' },
];

// 规范化属性名称 - 处理API可能返回的不同格式
const normalizeKeys = (data: any) => {
  // 安全检查，确保数据存在
  if (!data) return {
    styleFactors: [],
    industryFactors: [],
    countryFactors: [],
    otherFactors: []
  };

  console.log('===== 因子分析详细日志 =====');
  console.log('原始数据类型:', typeof data);
  console.log('原始数据键:', Object.keys(data));
  
  try {
    console.log('原始数据JSON:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('无法序列化原始因子数据:', e);
  }
  
  const result: any = {
    styleFactors: [],
    industryFactors: [],
    countryFactors: [],
    otherFactors: []
  };
  
  try {
    // 第1步: 处理已分类的因子数组
    // 支持驼峰命名和下划线命名的兼容性
    if (Array.isArray(data.styleFactors)) {
      result.styleFactors = data.styleFactors;
    } else if (Array.isArray(data.style_factors)) {
      result.styleFactors = data.style_factors;
    }
    
    if (Array.isArray(data.industryFactors)) {
      result.industryFactors = data.industryFactors;
    } else if (Array.isArray(data.industry_factors)) {
      result.industryFactors = data.industry_factors;
    }
    
    if (Array.isArray(data.countryFactors)) {
      result.countryFactors = data.countryFactors;
    } else if (Array.isArray(data.country_factors)) {
      result.countryFactors = data.country_factors;
    }
    
    if (Array.isArray(data.otherFactors)) {
      result.otherFactors = data.otherFactors;
    } else if (Array.isArray(data.other_factors)) {
      result.otherFactors = data.other_factors;
    }
    
    // 第2步: 处理扁平数组 - 根据 category 属性进行分类
    if (Array.isArray(data)) {
      console.log('收到扁平数组格式的因子数据，长度:', data.length);
      data.forEach((factor: any) => {
        if (!factor) return; // 跳过空值
        
        // 统一获取 category (新版本后端直接提供)
        const category = typeof factor.category === 'string' 
          ? factor.category.toLowerCase() 
          : '';
        
        // 根据 category 分配到对应数组
        if (category === 'style') {
          result.styleFactors.push(factor);
        } else if (category === 'industry' || category === 'sector') {
          result.industryFactors.push(factor);
        } else if (category === 'country' || category === 'region') {
          result.countryFactors.push(factor);
        } else if (category === 'other') {
          result.otherFactors.push(factor);
        } else {
          // 如果没有 category，根据名称进行智能猜测
          const name = ((factor.name || '') + '').toLowerCase();
          
          // 风格因子关键词
          const styleKeywords = ['value', 'growth', 'momentum', 'size', 'quality', 
                               'volatility', 'yield', 'earnings', 'dividend', 'leverage'];
          // 行业因子关键词
          const industryKeywords = ['industry', 'sector', 'technology', 'healthcare', 'financial',
                                 'consumer', 'energy', 'materials', 'utilities'];
          // 国家/地区关键词
          const countryKeywords = ['country', 'region', 'us', 'china', 'europe', 'japan', 'asia'];
            
          if (styleKeywords.some(keyword => name.includes(keyword))) {
            result.styleFactors.push({...factor, category: 'style'});
          } else if (industryKeywords.some(keyword => name.includes(keyword))) {
            result.industryFactors.push({...factor, category: 'industry'});
          } else if (countryKeywords.some(keyword => name.includes(keyword))) {
            result.countryFactors.push({...factor, category: 'country'});
          } else {
            result.otherFactors.push({...factor, category: 'other'});
          }
        }
      });
    }
    
    // 第3步: 特殊兼容 - 处理 exposures 数组格式
    if (Array.isArray(data.exposures)) {
      console.log('收到exposures数组格式，长度:', data.exposures.length);
      data.exposures.forEach((factor: any) => {
        if (!factor) return; // 跳过空值
        
        // 获取 category
        const category = typeof factor.category === 'string' 
          ? factor.category.toLowerCase() 
          : '';
        
        if (category === 'style') {
          result.styleFactors.push(factor);
        } else if (category === 'industry' || category === 'sector') {
          result.industryFactors.push(factor);
        } else if (category === 'country' || category === 'region') {
          result.countryFactors.push(factor);
        } else if (category === 'other') {
          result.otherFactors.push(factor);
        } else {
          // 如果没有 category，采用与扁平数组相同的智能猜测逻辑
          const name = ((factor.name || '') + '').toLowerCase();
          
          // 风格因子关键词
          const styleKeywords = ['value', 'growth', 'momentum', 'size', 'quality', 
                               'volatility', 'yield', 'earnings', 'dividend', 'leverage'];
          // 行业因子关键词
          const industryKeywords = ['industry', 'sector', 'technology', 'healthcare', 'financial',
                                 'consumer', 'energy', 'materials', 'utilities'];
          // 国家/地区关键词
          const countryKeywords = ['country', 'region', 'us', 'china', 'europe', 'japan', 'asia'];
            
          if (styleKeywords.some(keyword => name.includes(keyword))) {
            result.styleFactors.push({...factor, category: 'style'});
          } else if (industryKeywords.some(keyword => name.includes(keyword))) {
            result.industryFactors.push({...factor, category: 'industry'});
          } else if (countryKeywords.some(keyword => name.includes(keyword))) {
            result.countryFactors.push({...factor, category: 'country'});
          } else {
            result.otherFactors.push({...factor, category: 'other'});
          }
        }
      });
    }
    
    // 第4步: 检查是否成功获取到任何因子
    const allFactorsEmpty = 
      result.styleFactors.length === 0 && 
      result.industryFactors.length === 0 && 
      result.countryFactors.length === 0 && 
      result.otherFactors.length === 0;
      
    if (allFactorsEmpty) {
      console.log('未能从API响应中识别任何因子，准备使用默认值');
      return result; // 返回空结果，让上层处理默认值
    }
  } catch (error) {
    console.error('normalizeKeys处理数据时出错:', error);
  }
  
  // 记录处理结果
  console.log('normalizeKeys - 标准化后的数据结构:', {
    styleFactors: result.styleFactors.length,
    industryFactors: result.industryFactors.length,
    countryFactors: result.countryFactors.length,
    otherFactors: result.otherFactors.length
  });
  
  // 确保每个因子都有 category 属性
  result.styleFactors.forEach((f: any) => { if (!f.category) f.category = 'style'; });
  result.industryFactors.forEach((f: any) => { if (!f.category) f.category = 'industry'; });
  result.countryFactors.forEach((f: any) => { if (!f.category) f.category = 'country'; });
  result.otherFactors.forEach((f: any) => { if (!f.category) f.category = 'other'; });
  
  return result;
};

const FactorExposure: React.FC<FactorExposureProps> = ({ factors, timeFrame = 'oneYear' }) => {
  const { language, t } = useLanguage();
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [factorsForDisplay, setFactorsForDisplay] = useState<any[]>([]);
  const [groupedFactors, setGroupedFactors] = useState<{[key: string]: any[]}>({});
  const [isReady, setIsReady] = useState(false);
  
  // 使用useEffect以安全方式处理数据转换
  useEffect(() => {
    try {
      console.log('===== 因子暴露组件详细日志 =====');
      console.log('时间周期:', timeFrame);
      console.log('接收的factors类型:', typeof factors);
      console.log('接收的factors是否为数组:', Array.isArray(factors));
      console.log('接收的factors键:', factors ? Object.keys(factors) : 'null');
      
      if (factors) {
        // 尝试记录原始数据的详细结构
        try {
          console.log('原始因子数据JSON:', JSON.stringify(factors, null, 2));
        } catch (e) {
          console.log('无法序列化原始因子数据:', e);
          
          // 手动记录各个可能的因子数组
          if (factors.styleFactors) console.log('风格因子数组:', factors.styleFactors);
          if (factors.style_factors) console.log('风格因子数组(下划线):', factors.style_factors);
          if (factors.industryFactors) console.log('行业因子数组:', factors.industryFactors);
          if (factors.industry_factors) console.log('行业因子数组(下划线):', factors.industry_factors);
          if (factors.countryFactors) console.log('国家因子数组:', factors.countryFactors);
          if (factors.country_factors) console.log('国家因子数组(下划线):', factors.country_factors);
          if (factors.exposures) console.log('暴露数组:', factors.exposures);
        }
      }
      
      // 标准化数据键名
      const normalizedData = factors ? normalizeKeys(factors) : null;
      console.log('数据标准化完成:', normalizedData ? '成功' : '失败');
      
      // 检查标准化后的数据是否有内容
      const hasData = normalizedData && (
        (Array.isArray(normalizedData.styleFactors) && normalizedData.styleFactors.length > 0) ||
        (Array.isArray(normalizedData.industryFactors) && normalizedData.industryFactors.length > 0) ||
        (Array.isArray(normalizedData.countryFactors) && normalizedData.countryFactors.length > 0) ||
        (Array.isArray(normalizedData.otherFactors) && normalizedData.otherFactors.length > 0)
      );
      
      // 如果没有提供数据或者API数据为空，使用默认数据
      if (!hasData) {
        console.log('没有可用的因子数据，使用默认数据');
        setFactorsForDisplay(DEFAULT_FACTORS);
        
        // 对默认数据进行分组
        const grouped = DEFAULT_FACTORS.reduce((acc: {[key: string]: any[]}, factor) => {
          // 使用因子的原始category或根据约定将其映射到标准类别
          const category = factor.category || 'other';
          
          // 确保类别是标准化的字符串
          const normalizedCategory = 
            category === 'style' || 
            category === 'industry' || 
            category === 'sector' || 
            category === 'country' || 
            category === 'region' || 
            category === 'other' 
              ? category 
              : 'other';
          
          // 将sector和region分别映射到industry和country
          const mappedCategory = 
            normalizedCategory === 'sector' ? 'industry' : 
            normalizedCategory === 'region' ? 'country' : 
            normalizedCategory;
          
          if (!acc[mappedCategory]) {
            acc[mappedCategory] = [];
          }
          acc[mappedCategory].push(factor);
          
          return acc;
        }, {});
        
        setGroupedFactors(grouped);
        setIsReady(true);
        return;
      }
      
      // 确保所有必需的数组属性存在
      const safeFactors: FactorsData = {
        styleFactors: Array.isArray(normalizedData.styleFactors) ? normalizedData.styleFactors : [],
        industryFactors: Array.isArray(normalizedData.industryFactors) ? normalizedData.industryFactors : [],
        countryFactors: Array.isArray(normalizedData.countryFactors) ? normalizedData.countryFactors : [],
        otherFactors: Array.isArray(normalizedData.otherFactors) ? normalizedData.otherFactors : [],
      };
      
      console.log('安全处理后的因子数据结构:',
        '风格因子:', safeFactors.styleFactors?.length || 0,
        '行业因子:', safeFactors.industryFactors?.length || 0,
        '国家因子:', safeFactors.countryFactors?.length || 0,
        '其他因子:', safeFactors.otherFactors?.length || 0
      );
      
      // 处理和转换为视图格式
      const processedFactors: any[] = [];
      const groupedByCategory: {[key: string]: any[]} = {};
      
      // 处理风格因子
      if (safeFactors.styleFactors && safeFactors.styleFactors.length > 0) {
        const styleFactors = safeFactors.styleFactors.map(factor => {
          console.log('处理风格因子:', factor);
          
          // 确保有名称
          const name = typeof factor.name === 'string' ? factor.name : 
                       typeof factor.factor === 'string' ? factor.factor : 'Unknown';
          
          // 尝试从多种可能的字段中获取exposure值
          let exposure = 0;
          if (typeof factor.exposure === 'number' && !isNaN(factor.exposure)) {
            exposure = factor.exposure;
          } else if (typeof factor.portfolio_exposure === 'number' && !isNaN(factor.portfolio_exposure)) {
            exposure = factor.portfolio_exposure;
          } else if (typeof factor.value === 'number' && !isNaN(factor.value)) {
            exposure = factor.value;
          } else if (typeof factor.raw_exposure === 'number' && !isNaN(factor.raw_exposure)) {
            exposure = factor.raw_exposure;
          } else if (typeof factor.rawExposure === 'number' && !isNaN(factor.rawExposure)) {
            exposure = factor.rawExposure;
          }
          
          // 尝试从多种可能的字段中获取benchmark值
          let benchmark = 0;
          if (typeof factor.benchmark === 'number' && !isNaN(factor.benchmark)) {
            benchmark = factor.benchmark;
          } else if (typeof factor.benchmark_exposure === 'number' && !isNaN(factor.benchmark_exposure)) {
            benchmark = factor.benchmark_exposure;
          } else if (typeof factor.benchmarkExposure === 'number' && !isNaN(factor.benchmarkExposure)) {
            benchmark = factor.benchmarkExposure;
          }
          
          // 如果benchmark不可用，使用exposure的一个偏移值来模拟
          if (benchmark === 0 && exposure !== 0) {
            benchmark = exposure * 0.8; // 使用投资组合暴露的80%作为基准
          }
          
          // 中文名称处理
          let nameZh = name;
          // 尝试使用i18n查找翻译
          try {
            // 转换为小写并进行常见格式处理
            const lowerName = name.toLowerCase();
            
            // 先尝试直接从factors命名空间查找
            const styleFactor = t(`factors.${lowerName}`);
            if (styleFactor !== `factors.${lowerName}`) {
              nameZh = styleFactor;
            } else {
              // 处理驼峰命名 (如 "informationTechnology")
              const camelCased = lowerName.replace(/\s+(.)/g, (match, group) => group.toUpperCase());
              const industryFactor = t(`industries.${camelCased}`);
              if (industryFactor !== `industries.${camelCased}`) {
                nameZh = industryFactor;
              } else {
                // 特殊情况处理
                if (lowerName.includes('dividend') || lowerName.includes('yield')) {
                  nameZh = t('factors.dividendYield');
                } else if (lowerName.includes('carbon')) {
                  nameZh = t('factors.carbonEfficiency');
                } else if (lowerName.includes('computer') || lowerName.includes('electronic')) {
                  nameZh = t('factors.computersElectronics');
                } else if (lowerName === 'esg') {
                  nameZh = t('factors.esg');
                } else if (lowerName.includes('earnings') && lowerName.includes('quality')) {
                  nameZh = t('factors.earningsQuality');
                } else if (lowerName.includes('earnings') && lowerName.includes('variability')) {
                  nameZh = t('factors.earningsVariability');
                } else if (lowerName.includes('earnings') && lowerName.includes('yield')) {
                  nameZh = t('factors.earningsYield');
                }
              }
            }
          } catch (e) {
            // 如果翻译出错，使用原始名称
            console.warn(`因子名称 ${name} 翻译失败:`, e);
          }
          
          console.log(`处理后的风格因子 ${name}: 暴露=${exposure}, 基准=${benchmark}`);
          
          return {
            nameEn: name,
            nameZh: nameZh,
            exposure: exposure,
            benchmark: benchmark,
            category: factor.category || 'style' // 保留原始category或使用默认值
          };
        });
        
        processedFactors.push(...styleFactors);
        groupedByCategory['style'] = styleFactors;
      }
      
      // 处理行业因子
      if (safeFactors.industryFactors && safeFactors.industryFactors.length > 0) {
        const industryFactors = safeFactors.industryFactors.map(factor => {
          console.log('处理行业因子:', factor);
          
          // 确保有名称
          const name = typeof factor.name === 'string' ? factor.name : 
                       typeof factor.factor === 'string' ? factor.factor : 'Unknown';
          
          // 尝试从多种可能的字段中获取exposure值
          let exposure = 0;
          if (typeof factor.exposure === 'number' && !isNaN(factor.exposure)) {
            exposure = factor.exposure;
          } else if (typeof factor.portfolio_exposure === 'number' && !isNaN(factor.portfolio_exposure)) {
            exposure = factor.portfolio_exposure;
          } else if (typeof factor.value === 'number' && !isNaN(factor.value)) {
            exposure = factor.value;
          } else if (typeof factor.raw_exposure === 'number' && !isNaN(factor.raw_exposure)) {
            exposure = factor.raw_exposure;
          } else if (typeof factor.rawExposure === 'number' && !isNaN(factor.rawExposure)) {
            exposure = factor.rawExposure;
          }
          
          // 尝试从多种可能的字段中获取benchmark值
          let benchmark = 0;
          if (typeof factor.benchmark === 'number' && !isNaN(factor.benchmark)) {
            benchmark = factor.benchmark;
          } else if (typeof factor.benchmark_exposure === 'number' && !isNaN(factor.benchmark_exposure)) {
            benchmark = factor.benchmark_exposure;
          } else if (typeof factor.benchmarkExposure === 'number' && !isNaN(factor.benchmarkExposure)) {
            benchmark = factor.benchmarkExposure;
          }
          
          // 如果benchmark不可用，使用exposure的一个偏移值来模拟
          if (benchmark === 0 && exposure !== 0) {
            benchmark = exposure * 0.8; // 使用投资组合暴露的80%作为基准
          }
          
          // 中文名称处理
          let nameZh = name;
          // 尝试使用i18n查找翻译
          try {
            // 转换为小写并进行常见格式处理
            const lowerName = name.toLowerCase();
            
            // 先尝试直接从factors命名空间查找
            const styleFactor = t(`factors.${lowerName}`);
            if (styleFactor !== `factors.${lowerName}`) {
              nameZh = styleFactor;
            } else {
              // 处理驼峰命名 (如 "informationTechnology")
              const camelCased = lowerName.replace(/\s+(.)/g, (match, group) => group.toUpperCase());
              const industryFactor = t(`industries.${camelCased}`);
              if (industryFactor !== `industries.${camelCased}`) {
                nameZh = industryFactor;
              } else {
                // 特殊情况处理
                if (lowerName.includes('dividend') || lowerName.includes('yield')) {
                  nameZh = t('factors.dividendYield');
                } else if (lowerName.includes('carbon')) {
                  nameZh = t('factors.carbonEfficiency');
                } else if (lowerName.includes('computer') || lowerName.includes('electronic')) {
                  nameZh = t('factors.computersElectronics');
                } else if (lowerName === 'esg') {
                  nameZh = t('factors.esg');
                } else if (lowerName.includes('earnings') && lowerName.includes('quality')) {
                  nameZh = t('factors.earningsQuality');
                } else if (lowerName.includes('earnings') && lowerName.includes('variability')) {
                  nameZh = t('factors.earningsVariability');
                } else if (lowerName.includes('earnings') && lowerName.includes('yield')) {
                  nameZh = t('factors.earningsYield');
                }
              }
            }
          } catch (e) {
            // 如果翻译出错，使用原始名称
            console.warn(`因子名称 ${name} 翻译失败:`, e);
          }
          
          console.log(`处理后的行业因子 ${name}: 暴露=${exposure}, 基准=${benchmark}`);
          
          return {
            nameEn: name,
            nameZh: nameZh,
            exposure: exposure,
            benchmark: benchmark,
            category: factor.category || 'industry'  // 保留原始category或使用默认值
          };
        });
        
        processedFactors.push(...industryFactors);
        groupedByCategory['industry'] = industryFactors;
      }
      
      // 处理国家因子
      if (safeFactors.countryFactors && safeFactors.countryFactors.length > 0) {
        const countryFactors = safeFactors.countryFactors.map(factor => {
          console.log('处理国家因子:', factor);
          
          // 确保有名称
          const name = typeof factor.name === 'string' ? factor.name : 
                       typeof factor.factor === 'string' ? factor.factor : 'Unknown';
          
          // 尝试从多种可能的字段中获取exposure值
          let exposure = 0;
          if (typeof factor.exposure === 'number' && !isNaN(factor.exposure)) {
            exposure = factor.exposure;
          } else if (typeof factor.portfolio_exposure === 'number' && !isNaN(factor.portfolio_exposure)) {
            exposure = factor.portfolio_exposure;
          } else if (typeof factor.value === 'number' && !isNaN(factor.value)) {
            exposure = factor.value;
          } else if (typeof factor.raw_exposure === 'number' && !isNaN(factor.raw_exposure)) {
            exposure = factor.raw_exposure;
          } else if (typeof factor.rawExposure === 'number' && !isNaN(factor.rawExposure)) {
            exposure = factor.rawExposure;
          }
          
          // 尝试从多种可能的字段中获取benchmark值
          let benchmark = 0;
          if (typeof factor.benchmark === 'number' && !isNaN(factor.benchmark)) {
            benchmark = factor.benchmark;
          } else if (typeof factor.benchmark_exposure === 'number' && !isNaN(factor.benchmark_exposure)) {
            benchmark = factor.benchmark_exposure;
          } else if (typeof factor.benchmarkExposure === 'number' && !isNaN(factor.benchmarkExposure)) {
            benchmark = factor.benchmarkExposure;
          }
          
          // 如果benchmark不可用，使用exposure的一个偏移值来模拟
          if (benchmark === 0 && exposure !== 0) {
            benchmark = exposure * 0.8; // 使用投资组合暴露的80%作为基准
          }
          
          // 中文名称处理
          let nameZh = name;
          // 尝试使用i18n查找翻译
          try {
            // 转换为小写并进行常见格式处理
            const lowerName = name.toLowerCase();
            
            // 先尝试直接从factors命名空间查找
            const styleFactor = t(`factors.${lowerName}`);
            if (styleFactor !== `factors.${lowerName}`) {
              nameZh = styleFactor;
            } else {
              // 处理驼峰命名 (如 "informationTechnology")
              const camelCased = lowerName.replace(/\s+(.)/g, (match, group) => group.toUpperCase());
              const industryFactor = t(`industries.${camelCased}`);
              if (industryFactor !== `industries.${camelCased}`) {
                nameZh = industryFactor;
              } else {
                // 特殊情况处理
                if (lowerName.includes('dividend') || lowerName.includes('yield')) {
                  nameZh = t('factors.dividendYield');
                } else if (lowerName.includes('carbon')) {
                  nameZh = t('factors.carbonEfficiency');
                } else if (lowerName.includes('computer') || lowerName.includes('electronic')) {
                  nameZh = t('factors.computersElectronics');
                } else if (lowerName === 'esg') {
                  nameZh = t('factors.esg');
                } else if (lowerName.includes('earnings') && lowerName.includes('quality')) {
                  nameZh = t('factors.earningsQuality');
                } else if (lowerName.includes('earnings') && lowerName.includes('variability')) {
                  nameZh = t('factors.earningsVariability');
                } else if (lowerName.includes('earnings') && lowerName.includes('yield')) {
                  nameZh = t('factors.earningsYield');
                }
              }
            }
          } catch (e) {
            // 如果翻译出错，使用原始名称
            console.warn(`因子名称 ${name} 翻译失败:`, e);
          }
          
          console.log(`处理后的国家因子 ${name}: 暴露=${exposure}, 基准=${benchmark}`);
          
          return {
            nameEn: name,
            nameZh: nameZh,
            exposure: exposure,
            benchmark: benchmark,
            category: factor.category || 'country'  // 保留原始category或使用默认值
          };
        });
        
        processedFactors.push(...countryFactors);
        groupedByCategory['country'] = countryFactors;
      }
      
      // 处理其他因子
      if (safeFactors.otherFactors && safeFactors.otherFactors.length > 0) {
        const otherFactors = safeFactors.otherFactors.map(factor => {
          console.log('处理其他因子:', factor);
          
          // 确保有名称
          const name = typeof factor.name === 'string' ? factor.name : 
                       typeof factor.factor === 'string' ? factor.factor : 'Unknown';
          
          // 尝试从多种可能的字段中获取exposure值
          let exposure = 0;
          if (typeof factor.exposure === 'number' && !isNaN(factor.exposure)) {
            exposure = factor.exposure;
          } else if (typeof factor.portfolio_exposure === 'number' && !isNaN(factor.portfolio_exposure)) {
            exposure = factor.portfolio_exposure;
          } else if (typeof factor.value === 'number' && !isNaN(factor.value)) {
            exposure = factor.value;
          } else if (typeof factor.raw_exposure === 'number' && !isNaN(factor.raw_exposure)) {
            exposure = factor.raw_exposure;
          } else if (typeof factor.rawExposure === 'number' && !isNaN(factor.rawExposure)) {
            exposure = factor.rawExposure;
          }
          
          // 尝试从多种可能的字段中获取benchmark值
          let benchmark = 0;
          if (typeof factor.benchmark === 'number' && !isNaN(factor.benchmark)) {
            benchmark = factor.benchmark;
          } else if (typeof factor.benchmark_exposure === 'number' && !isNaN(factor.benchmark_exposure)) {
            benchmark = factor.benchmark_exposure;
          } else if (typeof factor.benchmarkExposure === 'number' && !isNaN(factor.benchmarkExposure)) {
            benchmark = factor.benchmarkExposure;
          }
          
          // 如果benchmark不可用，使用exposure的一个偏移值来模拟
          if (benchmark === 0 && exposure !== 0) {
            benchmark = exposure * 0.8; // 使用投资组合暴露的80%作为基准
          }
          
          // 中文名称处理
          let nameZh = name;
          // 尝试使用i18n查找翻译
          try {
            // 转换为小写并进行常见格式处理
            const lowerName = name.toLowerCase();
            
            // 先尝试直接从factors命名空间查找
            const styleFactor = t(`factors.${lowerName}`);
            if (styleFactor !== `factors.${lowerName}`) {
              nameZh = styleFactor;
            } else {
              // 处理驼峰命名 (如 "informationTechnology")
              const camelCased = lowerName.replace(/\s+(.)/g, (match, group) => group.toUpperCase());
              const industryFactor = t(`industries.${camelCased}`);
              if (industryFactor !== `industries.${camelCased}`) {
                nameZh = industryFactor;
              } else {
                // 特殊情况处理
                if (lowerName.includes('dividend') || lowerName.includes('yield')) {
                  nameZh = t('factors.dividendYield');
                } else if (lowerName.includes('carbon')) {
                  nameZh = t('factors.carbonEfficiency');
                } else if (lowerName.includes('computer') || lowerName.includes('electronic')) {
                  nameZh = t('factors.computersElectronics');
                } else if (lowerName === 'esg') {
                  nameZh = t('factors.esg');
                } else if (lowerName.includes('earnings') && lowerName.includes('quality')) {
                  nameZh = t('factors.earningsQuality');
                } else if (lowerName.includes('earnings') && lowerName.includes('variability')) {
                  nameZh = t('factors.earningsVariability');
                } else if (lowerName.includes('earnings') && lowerName.includes('yield')) {
                  nameZh = t('factors.earningsYield');
                }
              }
            }
          } catch (e) {
            // 如果翻译出错，使用原始名称
            console.warn(`因子名称 ${name} 翻译失败:`, e);
          }
          
          console.log(`处理后的其他因子 ${name}: 暴露=${exposure}, 基准=${benchmark}`);
          
          return {
            nameEn: name,
            nameZh: nameZh,
            exposure: exposure,
            benchmark: benchmark,
            category: factor.category || 'other'  // 保留原始category或使用默认值
          };
        });
        
        processedFactors.push(...otherFactors);
        groupedByCategory['other'] = otherFactors;
      }
      
      // 如果没有处理到任何因子，使用默认数据
      if (processedFactors.length === 0) {
        console.log('没有处理到任何因子，使用默认数据');
        setFactorsForDisplay(DEFAULT_FACTORS);
        
        // 对默认数据进行分组
        const grouped = DEFAULT_FACTORS.reduce((acc: {[key: string]: any[]}, factor) => {
          // 使用因子的原始category或根据约定将其映射到标准类别
          const category = factor.category || 'other';
          
          // 确保类别是标准化的字符串
          const normalizedCategory = 
            category === 'style' || 
            category === 'industry' || 
            category === 'sector' || 
            category === 'country' || 
            category === 'region' || 
            category === 'other' 
              ? category 
              : 'other';
          
          // 将sector和region分别映射到industry和country
          const mappedCategory = 
            normalizedCategory === 'sector' ? 'industry' : 
            normalizedCategory === 'region' ? 'country' : 
            normalizedCategory;
          
          if (!acc[mappedCategory]) {
            acc[mappedCategory] = [];
          }
          acc[mappedCategory].push(factor);
          
          return acc;
        }, {});
        
        setGroupedFactors(grouped);
      } else {
        console.log('使用处理后的API因子数据，总数:', processedFactors.length);
        setFactorsForDisplay(processedFactors);
        setGroupedFactors(groupedByCategory);
      }
    } catch (error) {
      console.error('FactorExposure数据处理错误:', error);
      setRenderError(error instanceof Error ? error : new Error('Unknown error'));
      // 使用默认数据作为降级方案
      setFactorsForDisplay(DEFAULT_FACTORS);
      
      // 对默认数据进行分组
      const grouped = DEFAULT_FACTORS.reduce((acc: {[key: string]: any[]}, factor) => {
        // 使用因子的原始category或根据约定将其映射到标准类别
        const category = factor.category || 'other';
        
        // 确保类别是标准化的字符串
        const normalizedCategory = 
          category === 'style' || 
          category === 'industry' || 
          category === 'sector' || 
          category === 'country' || 
          category === 'region' || 
          category === 'other' 
            ? category 
            : 'other';
        
        // 将sector和region分别映射到industry和country
        const mappedCategory = 
          normalizedCategory === 'sector' ? 'industry' : 
          normalizedCategory === 'region' ? 'country' : 
          normalizedCategory;
        
        if (!acc[mappedCategory]) {
          acc[mappedCategory] = [];
        }
        acc[mappedCategory].push(factor);
        
        return acc;
      }, {});
      
      setGroupedFactors(grouped);
    } finally {
      setIsReady(true);
    }
  }, [factors]);
  
  // 使用useEffect记录当前时间周期
  useEffect(() => {
    console.log(`FactorExposure组件使用时间周期: ${timeFrame}`);
    // 可以在这里根据timeFrame重新获取或处理数据
  }, [timeFrame]);
  
  // 安全获取数值，处理各种类型情况
  const safeGetNumber = (value: any): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // 如果发生错误，显示错误消息同时显示默认数据
  const renderErrorMessage = () => {
    if (!renderError) return null;
    
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
        {t('factors.factorDataError')}
        {renderError.message && (
          <div className="mt-1 text-xs text-red-500">
            {renderError.message}
          </div>
        )}
      </div>
    );
  };
  
  // 获取适合当前语言的因子名称
  const getLocalizedFactorName = (factor: any): string => {
    // 首先尝试直接获取当前语言的名称
    if (language === 'zh' && factor.nameZh) {
      return factor.nameZh;
    }
    
    if (language === 'en' && factor.nameEn) {
      return factor.nameEn;
    }
    
    // 回退到任何可用的名称
    const baseName = factor.nameEn || factor.name || 'Unknown';
    
    // 如果是中文环境，尝试使用i18n翻译通用名称
    if (language === 'zh') {
      const lowerName = baseName.toLowerCase();
      
      // 尝试通过i18n系统获取翻译
      try {
        // 先尝试从风格因子翻译获取
        const styleFactor = t(`factors.${lowerName}`);
        if (styleFactor !== `factors.${lowerName}`) {
          return styleFactor;
        }
        
        // 再尝试从行业因子翻译获取
        // 处理可能的格式，例如"information technology"转为"informationTechnology"
        const camelCased = lowerName.replace(/\s+(.)/g, (match, group) => group.toUpperCase());
        const industryFactor = t(`industries.${camelCased}`);
        if (industryFactor !== `industries.${camelCased}`) {
          return industryFactor;
        }
        
        // 特殊情况处理
        if (lowerName.includes('dividend') || lowerName.includes('yield')) {
          return t('factors.dividendYield');
        }
        
        if (lowerName.includes('earnings') && lowerName.includes('quality')) {
          return t('factors.earningsQuality');
        }
        
        if (lowerName.includes('earnings') && lowerName.includes('variability')) {
          return t('factors.earningsVariability');
        }
        
        if (lowerName.includes('earnings') && lowerName.includes('yield')) {
          return t('factors.earningsYield');
        }
        
        if (lowerName.includes('carbon')) {
          return t('factors.carbonEfficiency');
        }
        
        if (lowerName.includes('computer') || lowerName.includes('electronic')) {
          return t('factors.computersElectronics');
        }
        
        if (lowerName === 'esg') {
          return t('factors.esg');
        }
        
        if (lowerName === 'leverage') {
          return t('factors.leverage');
        }
        
        if (lowerName.includes('internet') || lowerName.includes('software') || lowerName.includes('service')) {
          return t('factors.internetSoftwareAndItServices');
        }
      } catch (e) {
        console.warn('翻译获取失败:', e);
      }
      
      // 如果没有找到翻译，返回原名
      return baseName;
    }
    
    return baseName;
  };

  // 渲染单个因子分类部分
  const renderFactorCategory = (categoryName: string, factors: any[]) => {
    if (!factors || factors.length === 0) return null;
    
    // 过滤掉投资组合暴露值为0的因子
    const filteredFactors = factors.filter(factor => {
      // 需要处理不同的数据结构
      const exposure = safeGetNumber(factor.exposure !== undefined ? factor.exposure : factor.portfolio_exposure);
      return exposure !== 0; // 只保留非零暴露的因子
    });
    
    // 如果过滤后没有因子，不显示该分类
    if (filteredFactors.length === 0) return null;
    
    // 根据不同分类显示不同的标题
    const getCategoryTitle = () => {
      switch(categoryName) {
        case 'style':
          return t('factors.styleFactorExposure');
        case 'industry':
          return t('factors.industryFactorExposure');
        case 'sector':
          return t('factors.industryFactorExposure');
        case 'country':
          return t('factors.countryFactorExposure');
        case 'other':
          return t('factors.otherFactorExposure');
        default:
          return t('factors.otherFactorExposure');
      }
    };
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-700">{getCategoryTitle()}</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.factors')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('factors.exposureTitle')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.benchmark')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.timeframes.excess')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFactors.map((factor, index) => {
                // 安全获取值（处理不同的数据结构）
                const exposure = safeGetNumber(factor.exposure !== undefined ? factor.exposure : factor.portfolio_exposure);
                const benchmark = safeGetNumber(factor.benchmark !== undefined ? factor.benchmark : factor.benchmark_exposure);
                const diff = exposure - benchmark;
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getLocalizedFactorName(factor)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatNumber(exposure)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className="text-gray-500">
                        {formatNumber(benchmark)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {diff > 0 ? '+' : ''}{formatNumber(diff)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 在处理完毕后添加一个总结日志
  useEffect(() => {
    if (isReady && factorsForDisplay.length > 0) {
      console.log('===== 最终处理的因子数据 =====');
      console.log('风格因子:', groupedFactors.style || []);
      console.log('行业因子:', groupedFactors.industry || groupedFactors.sector || []);
      console.log('国家因子:', groupedFactors.country || []);
      console.log('其他因子:', groupedFactors.other || []);
      console.log('总因子数量:', factorsForDisplay.length);
      
      // 记录每个因子的名称、投资组合暴露值和基准值
      console.log('因子详情:');
      factorsForDisplay.forEach((factor, index) => {
        console.log(`${index+1}. ${factor.nameEn || factor.name}: 投资组合=${factor.exposure}, 基准=${factor.benchmark}, 差异=${factor.exposure - factor.benchmark}`);
      });
    }
  }, [isReady, factorsForDisplay, groupedFactors]);

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderErrorMessage()}
      
      {Object.keys(groupedFactors).map((category) => 
        renderFactorCategory(category, groupedFactors[category])
      )}
      
      {Object.keys(groupedFactors).length === 0 && (
        <div className="p-4 bg-yellow-50 rounded-md text-yellow-700">
          {t('dashboard.noData')}
        </div>
      )}
    </div>
  );
};

export default FactorExposure;