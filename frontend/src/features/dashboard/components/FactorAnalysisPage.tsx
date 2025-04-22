import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { getPortfolioAnalysis } from '../../../shared/services/portfolioService';
import { FactorExposure } from '../';
import axios from 'axios';

const FactorAnalysisPage = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factorData, setFactorData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // 转换API数据到FactorExposure组件需要的格式
  const transformApiData = (data: any) => {
    console.log('转换API数据格式:', data);
    
    // 如果数据已经是正确格式，直接返回
    if (data && (data.styleFactors || data.industryFactors || data.countryFactors)) {
      console.log('数据已经是正确格式');
      return data;
    }
    
    // 如果是原始数据格式，转换成组件需要的格式
    try {
      const result = {
        styleFactors: [],
        industryFactors: [],
        countryFactors: [],
        otherFactors: []
      };
      
      // 如果有style_factors, 转换为styleFactors
      if (data && Array.isArray(data.style_factors)) {
        result.styleFactors = data.style_factors.map((f: any) => ({
          name: f.name || f.factor || '',
          exposure: f.portfolio_exposure || f.exposure || f.value || 0,
          benchmark: f.benchmark_exposure || f.benchmark || 0,
        }));
      }
      
      // 转换industry_factors
      if (data && Array.isArray(data.industry_factors)) {
        result.industryFactors = data.industry_factors.map((f: any) => ({
          name: f.name || f.factor || '',
          exposure: f.portfolio_exposure || f.exposure || f.value || 0,
          benchmark: f.benchmark_exposure || f.benchmark || 0,
        }));
      }
      
      // 转换country_factors
      if (data && Array.isArray(data.country_factors)) {
        result.countryFactors = data.country_factors.map((f: any) => ({
          name: f.name || f.factor || '',
          exposure: f.portfolio_exposure || f.exposure || f.value || 0,
          benchmark: f.benchmark_exposure || f.benchmark || 0,
        }));
      }
      
      // 转换other_factors
      if (data && Array.isArray(data.other_factors)) {
        result.otherFactors = data.other_factors.map((f: any) => ({
          name: f.name || f.factor || '',
          exposure: f.portfolio_exposure || f.exposure || f.value || 0,
          benchmark: f.benchmark_exposure || f.benchmark || 0,
        }));
      }
      
      console.log('转换后的数据:', result);
      return result;
    } catch (err) {
      console.error('转换数据时出错:', err);
      return data; // 出错时返回原始数据
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (!portfolioId) {
        setError('Portfolio ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching factor data for portfolio:', portfolioId);
        
        // 首先尝试使用专门的因子API端点
        try {
          const response = await axios.get(`/api/analysis/${portfolioId}/factors`);
          if (response.data) {
            console.log('Factor data received from dedicated API:', response.data);
            setRawData(response.data);
            
            // 转换数据格式
            const transformedData = transformApiData(response.data);
            setFactorData(transformedData);
            setLoading(false);
            return;
          }
        } catch (factorApiError) {
          console.warn('Failed to get data from factors API, falling back to full analysis:', factorApiError);
          // 如果专门的API失败，继续尝试完整分析API
        }
        
        // 回退到使用完整的分析API
        const response = await getPortfolioAnalysis(portfolioId);
        console.log('API Response:', response);
        
        // 存储原始数据用于调试
        setRawData(response);
        
        if (response && response.factors) {
          console.log('Factor data received from analysis API:', response.factors);
          
          // 转换数据格式
          const transformedData = transformApiData(response.factors);
          setFactorData(transformedData);
        } else {
          throw new Error('No factor data available in the API response');
        }
      } catch (err) {
        console.error('Error fetching factor data:', err);
        setError('Failed to load factor data');
        
        // 如果已经重试过，不再继续
        if (retryCount > 0) {
          console.log('Already retried, giving up');
        } else {
          // 如果是第一次失败，设置重试标志并再次尝试
          console.log('First failure, will retry once');
          setRetryCount(retryCount + 1);
          // 短暂延迟后重试
          setTimeout(() => {
            setLoading(true);
            setError(null);
          }, 1000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (loading) {
      fetchData();
    }
  }, [portfolioId, loading, retryCount]);
  
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
  };
  
  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-lg">
        <h2 className="text-xl font-medium mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={handleRetry}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('pages.factorAnalysis')}</h1>
      
      {/* 显示原始响应数据（用于调试） */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <details>
          <summary className="cursor-pointer font-medium">Debug: Raw API Response</summary>
          <pre className="mt-2 text-xs overflow-auto max-h-96">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </details>
        
        <details className="mt-2">
          <summary className="cursor-pointer font-medium">Debug: Transformed Factor Data</summary>
          <pre className="mt-2 text-xs overflow-auto max-h-96">
            {JSON.stringify(factorData, null, 2)}
          </pre>
        </details>
      </div>
      
      {factorData ? (
        <FactorExposure factors={factorData} />
      ) : (
        <div className="bg-yellow-50 text-yellow-700 p-6 rounded-lg">
          No factor data available
        </div>
      )}
    </div>
  );
};

export default FactorAnalysisPage; 