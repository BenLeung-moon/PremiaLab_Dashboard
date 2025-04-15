import React, { useState, useEffect } from 'react';
import { getPortfolio } from '../../../shared/services/portfolioService';
import { useLanguage } from '../../../shared/i18n/LanguageContext';

interface Ticker {
  symbol: string;
  weight: number;
  name?: string;
  sector?: string;
  price?: number;
  change?: number;
}

interface PortfolioCompositionProps {
  portfolioId: string;
}

const PortfolioComposition: React.FC<PortfolioCompositionProps> = ({ portfolioId }) => {
  const { t } = useLanguage();
  const [holdings, setHoldings] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const portfolio = await getPortfolio(portfolioId);
        setHoldings(portfolio.tickers || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch portfolio composition:', err);
        setError(t('dashboard.errors.loadPortfolioFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [portfolioId, t]);

  // Sort by weight (descending)
  const sortedHoldings = [...holdings].sort((a, b) => b.weight - a.weight);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
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

  if (!holdings.length) {
    return (
      <div className="bg-gray-50 text-gray-700 p-4 rounded-lg">
        <p>{t('dashboard.noHoldings')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('dashboard.portfolioComposition')}</h3>
      
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.symbol')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.sector')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.weight')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.price')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.dailyChange')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedHoldings.map((ticker) => (
                <tr key={ticker.symbol}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {ticker.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticker.name || ticker.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticker.sector || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {(ticker.weight * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticker.price ? `$${ticker.price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticker.change ? (
                      <span className={ticker.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {ticker.change >= 0 ? '+' : ''}{(ticker.change * 100).toFixed(2)}%
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortfolioComposition; 