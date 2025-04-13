import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { getPortfolioAnalysis } from '../../services/portfolioService';
import FactorExposure from '../dashboard/FactorExposure';

const FactorAnalysisPage = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factorData, setFactorData] = useState(null);
  const [rawData, setRawData] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!portfolioId) {
        setError('Portfolio ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching factor data for portfolio:', portfolioId);
        const response = await getPortfolioAnalysis(portfolioId);
        console.log('API Response:', response);
        
        // 存储原始数据用于调试
        setRawData(response);
        
        if (response && response.factors) {
          console.log('Factor data received:', response.factors);
          setFactorData(response.factors);
        } else {
          setError('No factor data available in the API response');
        }
      } catch (err) {
        console.error('Error fetching factor data:', err);
        setError('Failed to load factor data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [portfolioId]);
  
  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-lg">
        <h2 className="text-xl font-medium mb-2">Error</h2>
        <p>{error}</p>
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
      </div>
      
      {factorData ? (
        <FactorExposure data={factorData} />
      ) : (
        <div className="bg-yellow-50 text-yellow-700 p-6 rounded-lg">
          No factor data available
        </div>
      )}
    </div>
  );
};

export default FactorAnalysisPage; 