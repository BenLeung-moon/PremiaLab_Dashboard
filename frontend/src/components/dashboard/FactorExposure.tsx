import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import { getPortfolioAnalysis, mockPortfolioAnalysis, FactorCorrelation, RiskContribution } from '../../services/portfolioService';
import { useParams } from 'react-router-dom';
import { formatNumber } from '../../shared/utils/formatting';

interface FactorExposureProps {
  data?: any; // 接收从父组件传递的因子数据
}

const FactorExposure: React.FC<FactorExposureProps> = ({ data }) => {
  console.log('FactorExposure component rendering with data:', data);
  const { t } = useLanguage();
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [styleFactors, setStyleFactors] = useState<any[]>([]);
  const [industryFactors, setIndustryFactors] = useState<any[]>([]);
  const [countryFactors, setCountryFactors] = useState<any[]>([]);
  const [otherFactors, setOtherFactors] = useState<any[]>([]);
  const [factorCorrelations, setFactorCorrelations] = useState<FactorCorrelation[]>([]);
  const [riskContributions, setRiskContributions] = useState<RiskContribution[]>([]);
  const [hasCorrelationData, setHasCorrelationData] = useState<boolean>(false);
  const [showRawExposure, setShowRawExposure] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [rawFactorData, setRawFactorData] = useState<any>(null);
  
  useEffect(() => {
    const processData = async () => {
      try {
        // 如果父组件传递了数据，优先使用
        let analysisData;
        if (data) {
          // 使用传递的数据
          analysisData = { factors: data };
          console.log('Using provided data:', analysisData);
        } else if (portfolioId) {
          // 如果没有传递数据但有portfolioId，从API获取
          analysisData = await getPortfolioAnalysis(portfolioId);
          console.log('Fetched data from API:', analysisData);
        } else {
          // 否则使用模拟数据
          analysisData = mockPortfolioAnalysis();
          console.log('Using mock data:', analysisData);
        }
        
        console.log('Factor Exposure Data (原始数据):', analysisData.factors);
        console.log('Style Factors (原始):', analysisData.factors.styleFactors);
        console.log('Industry Factors (原始):', analysisData.factors.industryFactors);
        // 保存原始数据用于调试
        setRawFactorData(analysisData.factors);
        
        // 检查并转换styleFactors数据结构
        let styleFactorsData = [];
        if (analysisData.factors.styleFactors) {
          styleFactorsData = analysisData.factors.styleFactors.map(factor => {
            // 处理新的API返回格式 (portfolio_exposure, benchmark_exposure, difference)
            if ('portfolio_exposure' in factor) {
              return {
                name: factor.name,
                displayName: t(`factors.${factor.name}`) || factor.name,
                exposure: factor.portfolio_exposure,
                benchmarkExposure: factor.benchmark_exposure,
                difference: factor.difference,
                positive: factor.difference > 0
              };
            } 
            // 处理旧的API返回格式 (exposure, positive)
            else {
              return {
                ...factor,
                displayName: t(`factors.${factor.name}`) || factor.name
              };
            }
          });
        }
        console.log('风格因子(处理后):', styleFactorsData);
        
        // 检查和转换macroFactors数据为industryFactors (如果后端返回macroFactors)
        let industryFactorsData = [];
        if (analysisData.factors.industryFactors) {
          industryFactorsData = analysisData.factors.industryFactors.map(factor => {
            // 处理新的API返回格式 (portfolio_exposure, benchmark_exposure, difference)
            if ('portfolio_exposure' in factor) {
              return {
                name: factor.name,
                displayName: t(`industries.${factor.name}`) || factor.name,
                exposure: factor.portfolio_exposure,
                benchmarkExposure: factor.benchmark_exposure,
                difference: factor.difference,
                positive: factor.difference > 0
              };
            } 
            // 处理旧的API返回格式
            else {
              return {
                ...factor,
                displayName: t(`industries.${factor.name}`) || factor.name
              };
            }
          });
        } else if (analysisData.factors.macroFactors) {
          industryFactorsData = analysisData.factors.macroFactors.map(factor => {
            // 处理新的API返回格式 (portfolio_exposure, benchmark_exposure, difference)
            if ('portfolio_exposure' in factor) {
              return {
                name: factor.name,
                displayName: t(`industries.${factor.name}`) || factor.name,
                exposure: factor.portfolio_exposure,
                benchmarkExposure: factor.benchmark_exposure,
                difference: factor.difference,
                positive: factor.difference > 0
              };
            } 
            // 处理旧的API返回格式
            else {
              return {
                ...factor,
                displayName: t(`industries.${factor.name}`) || factor.name
              };
            }
          });
        }
        console.log('行业因子(处理后):', industryFactorsData);
        
        // 转换国家/地区因子数据并应用翻译
        const translatedCountryFactors = analysisData.factors.countryFactors?.map(factor => {
          // 处理新的API返回格式 (portfolio_exposure, benchmark_exposure, difference)
          if ('portfolio_exposure' in factor) {
            return {
              name: factor.name,
              displayName: t(`countries.${factor.name}`) || factor.name,
              exposure: factor.portfolio_exposure,
              benchmarkExposure: factor.benchmark_exposure,
              difference: factor.difference,
              positive: factor.difference > 0
            };
          } 
          // 处理旧的API返回格式
          else {
            return {
              ...factor,
              displayName: t(`countries.${factor.name}`) || factor.name
            };
          }
        }) || [];
        
        // 转换其他因子数据并应用翻译
        const translatedOtherFactors = analysisData.factors.otherFactors?.map(factor => {
          // 处理新的API返回格式 (portfolio_exposure, benchmark_exposure, difference)
          if ('portfolio_exposure' in factor) {
            return {
              name: factor.name,
              displayName: t(`factors.${factor.name}`) || factor.name,
              exposure: factor.portfolio_exposure,
              benchmarkExposure: factor.benchmark_exposure, 
              difference: factor.difference,
              positive: factor.difference > 0
            };
          }
          // 处理旧的API返回格式
          else {
            return {
              ...factor,
              displayName: t(`factors.${factor.name}`) || factor.name
            };
          }
        }) || [];
        
        // 获取因子相关性和风险贡献数据
        const correlations = analysisData.factors.factorCorrelations || [];
        const riskContribs = analysisData.factors.riskContributions || [];
        const hasCorrelData = analysisData.factors.hasCorrelationData || false;
        
        // 翻译相关性数据中的因子名称
        const translatedCorrelations = correlations.map(corr => ({
          ...corr,
          factor1Display: t(`factors.${corr.factor1}`) || corr.factor1,
          factor2Display: t(`factors.${corr.factor2}`) || corr.factor2
        }));
        
        // 翻译风险贡献数据中的因子名称
        const translatedRiskContributions = riskContribs.map(risk => ({
          ...risk,
          displayName: t(`factors.${risk.name}`) || risk.name
        }));
        
        setStyleFactors(styleFactorsData);
        setIndustryFactors(industryFactorsData);
        setCountryFactors(translatedCountryFactors);
        setOtherFactors(translatedOtherFactors);
        setFactorCorrelations(translatedCorrelations);
        setRiskContributions(translatedRiskContributions);
        setHasCorrelationData(hasCorrelData);
        setLoading(false);
      } catch (error) {
        console.error('获取因子数据失败:', error);
        setLoading(false);
      }
    };
    
    processData();
  }, [data, portfolioId, t]);
  
  // 获取因子条的宽度
  const getBarWidth = (exposure: number) => {
    // 将暴露度转化为百分比，取值 -1.0 ~ 1.0，映射到 -100% ~ 100%
    return `${Math.abs(exposure) * 100}%`;
  };
  
  // 获取因子条的位置
  const getBarPosition = (exposure: number) => {
    if (exposure < 0) {
      return 'left-0';
    }
    return 'right-0';
  };
  
  // 根据相关性值获取颜色
  const getCorrelationColor = (correlation: number) => {
    if (correlation > 0.6) return 'bg-green-600';
    if (correlation > 0.3) return 'bg-green-400';
    if (correlation > 0) return 'bg-green-200';
    if (correlation > -0.3) return 'bg-red-200';
    if (correlation > -0.6) return 'bg-red-400';
    return 'bg-red-600';
  };
  
  // 获取风险贡献颜色
  const getRiskContributionColor = (contribution: number, max: number) => {
    const ratio = contribution / max;
    if (ratio > 0.8) return 'bg-red-600';
    if (ratio > 0.6) return 'bg-red-500';
    if (ratio > 0.4) return 'bg-yellow-500';
    if (ratio > 0.2) return 'bg-yellow-400';
    return 'bg-green-500';
  };
  
  // 渲染因子暴露条形图部分
  const renderFactorSection = (title: string, factors: any[]) => {
    if (!factors || factors.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-3">{title}</h2>
        {factors[0].rawExposure !== undefined && (
          <div className="mb-3">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600"
                checked={showRawExposure}
                onChange={() => setShowRawExposure(!showRawExposure)}
              />
              <span className="ml-2 text-sm text-gray-700">{t('factors.showRawExposure')}</span>
            </label>
          </div>
        )}
        <div className="space-y-4">
          {factors.map((factor, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{factor.displayName}</span>
                <div>
                  {/* 如果有基准暴露数据，显示 */}
                  {factor.benchmarkExposure !== undefined && (
                    <span className="text-gray-500 mr-2">
                      {t('common.benchmark')}: {formatNumber(factor.benchmarkExposure)}
                    </span>
                  )}
                  {showRawExposure && factor.rawExposure !== undefined && (
                    <span className="text-gray-500 mr-2">
                      {formatNumber(factor.rawExposure)}
                    </span>
                  )}
                  <span className={factor.positive ? 'text-green-600' : 'text-red-600'}>
                    {formatNumber(factor.exposure)}
                  </span>
                  {/* 如果有差异数据，显示 */}
                  {factor.difference !== undefined && (
                    <span className={`ml-2 ${factor.difference > 0 ? 'text-green-600' : 'text-red-600'}`