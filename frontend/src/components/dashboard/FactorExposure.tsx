import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getPortfolioAnalysis, mockPortfolioAnalysis, FactorCorrelation, RiskContribution } from '../../services/portfolioService';
import { useParams } from 'react-router-dom';

const FactorExposure: React.FC = () => {
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
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        let analysisData;
        
        if (portfolioId) {
          // 从API获取数据
          analysisData = await getPortfolioAnalysis(portfolioId);
        } else {
          // 使用模拟数据
          analysisData = mockPortfolioAnalysis();
        }
        
        // 转换风格因子数据并应用翻译
        const translatedStyleFactors = analysisData.factors.styleFactors?.map(factor => ({
          ...factor,
          displayName: t(`factors.${factor.name}`) || factor.name
        })) || [];
        
        // 转换行业因子数据并应用翻译
        const translatedIndustryFactors = analysisData.factors.industryFactors?.map(factor => ({
          ...factor,
          displayName: t(`industries.${factor.name}`) || factor.name
        })) || [];
        
        // 转换国家/地区因子数据并应用翻译
        const translatedCountryFactors = analysisData.factors.countryFactors?.map(factor => ({
          ...factor,
          displayName: t(`countries.${factor.name}`) || factor.name
        })) || [];
        
        // 转换其他因子数据并应用翻译
        const translatedOtherFactors = analysisData.factors.otherFactors?.map(factor => ({
          ...factor,
          displayName: t(`factors.${factor.name}`) || factor.name
        })) || [];
        
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
        
        setStyleFactors(translatedStyleFactors);
        setIndustryFactors(translatedIndustryFactors);
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
    
    fetchData();
  }, [portfolioId, t]);
  
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
                  {showRawExposure && factor.rawExposure !== undefined && (
                    <span className="text-gray-500 mr-2">
                      {factor.rawExposure.toFixed(2)}
                    </span>
                  )}
                  <span className={factor.positive ? 'text-green-600' : 'text-red-600'}>
                    {factor.exposure.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full relative">
                <div className="absolute inset-y-0 w-1/2 left-1/2 border-l border-gray-400"></div>
                <div 
                  className={`absolute inset-y-0 ${getBarPosition(factor.exposure)} ${
                    factor.exposure > 0 ? 'bg-green-500' : 'bg-red-500'
                  } rounded-full`}
                  style={{ 
                    width: getBarWidth(factor.exposure)
                  }}
                ></div>
                {/* 显示原始暴露（虚线） */}
                {showRawExposure && factor.rawExposure !== undefined && (
                  <div 
                    className={`absolute inset-y-0 ${getBarPosition(factor.rawExposure)} border-2 border-dashed ${
                      factor.rawExposure > 0 ? 'border-green-700' : 'border-red-700'
                    } rounded-full`}
                    style={{ 
                      width: getBarWidth(factor.rawExposure)
                    }}
                  ></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 渲染因子相关性热力图
  const renderCorrelationMatrix = () => {
    if (!hasCorrelationData || factorCorrelations.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">{t('factors.correlationMatrix')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 bg-gray-100 border border-gray-300">{t('factors.correlationTitle')}</th>
                {Array.from(new Set(factorCorrelations.map(c => c.factor1))).map(factor => (
                  <th key={factor} className="p-2 bg-gray-100 border border-gray-300">
                    {t(`factors.${factor}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(factorCorrelations.map(c => c.factor2))).map(factor2 => (
                <tr key={factor2}>
                  <td className="p-2 font-medium bg-gray-100 border border-gray-300">
                    {t(`factors.${factor2}`)}
                  </td>
                  {Array.from(new Set(factorCorrelations.map(c => c.factor1))).map(factor1 => {
                    // 查找相关性数据
                    const correlation = factorCorrelations.find(
                      c => (c.factor1 === factor1 && c.factor2 === factor2) || 
                           (c.factor1 === factor2 && c.factor2 === factor1)
                    );
                    
                    return (
                      <td 
                        key={`${factor1}-${factor2}`} 
                        className={`p-2 text-center border border-gray-300 ${
                          correlation ? getCorrelationColor(correlation.correlation) : 'bg-gray-200'
                        }`}
                      >
                        {correlation ? correlation.correlation.toFixed(2) : (factor1 === factor2 ? '1.00' : '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs">{t('factors.negativeCorrelation')}</span>
            <div className="flex space-x-1">
              <div className="w-6 h-4 bg-red-600"></div>
              <div className="w-6 h-4 bg-red-400"></div>
              <div className="w-6 h-4 bg-red-200"></div>
              <div className="w-6 h-4 bg-green-200"></div>
              <div className="w-6 h-4 bg-green-400"></div>
              <div className="w-6 h-4 bg-green-600"></div>
            </div>
            <span className="text-xs">{t('factors.positiveCorrelation')}</span>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染风险贡献图
  const renderRiskContributions = () => {
    if (!riskContributions || riskContributions.length === 0) return null;
    
    const maxContribution = Math.max(...riskContributions.map(risk => risk.contribution));
    
    return (
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-6">{t('factors.riskContribution')}</h2>
        <div className="space-y-3">
          {riskContributions.map((risk, index) => (
            <div key={index} className="flex items-center">
              <div className="w-32 text-sm">{risk.displayName}</div>
              <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getRiskContributionColor(risk.contribution, maxContribution)}`}
                  style={{ width: `${risk.contribution}%` }}
                ></div>
              </div>
              <div className="w-16 text-right text-sm">{risk.contribution.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          {t('factors.riskContributionDescription')}
        </p>
      </div>
    );
  };
  
  if (loading) {
    return <div className="p-5 text-center text-gray-500">{t('common.loading')}</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* 风格因子暴露 */}
      {renderFactorSection(t('factors.styleFactorExposure'), styleFactors)}
      
      {/* 当存在相关性数据时，显示风险贡献和相关性矩阵 */}
      {hasCorrelationData && (
        <>
          {renderRiskContributions()}
          {renderCorrelationMatrix()}
        </>
      )}
      
      {/* 行业因子暴露 */}
      {renderFactorSection(t('factors.industryFactorExposure'), industryFactors)}
      
      {/* 国家/地区因子暴露 */}
      {renderFactorSection(t('factors.countryFactorExposure'), countryFactors)}
      
      {/* 其他因子暴露 */}
      {otherFactors.length > 0 && renderFactorSection(t('factors.otherFactorExposure'), otherFactors)}
      
      {/* 因子解释 */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-medium mb-4">{t('factors.analysisExplanation')}</h2>
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
          <p className="mb-2"><strong>{t('factors.exposureTitle')}</strong> {t('factors.exposureDescription')}</p>
          <p className="mb-2">{t('factors.positiveExposure')}</p>
          <p className="mb-2">{t('factors.negativeExposure')}</p>
          {showRawExposure && (
            <p className="mt-2"><strong>{t('factors.adjustedExposureTitle')}</strong> {t('factors.adjustedExposureDescription')}</p>
          )}
          {hasCorrelationData && (
            <p className="mt-2"><strong>{t('factors.correlationExplanation')}</strong> {t('factors.correlationDescription')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactorExposure; 