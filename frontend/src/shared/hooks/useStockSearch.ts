import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';

// 定义股票数据接口
export interface StockInfo {
  symbol: string;
  name: string;
  englishName: string;
  chineseName: string;
  sector?: string;
  industry?: string;
  price?: number;
  change?: number;
}

// 搜索结果接口
interface SearchResults {
  loading: boolean;
  stocks: StockInfo[];
  error: string | null;
}

// 自定义钩子配置
interface UseStockSearchProps {
  debounceMs?: number; // 防抖延迟，默认300ms
  limit?: number;      // 结果限制数量，默认10条
}

/**
 * 股票搜索钩子
 * 提供股票模糊搜索功能，支持代码和名称搜索
 */
export const useStockSearch = ({ 
  debounceMs = 300, 
  limit = 10 
}: UseStockSearchProps = {}) => {
  // 状态
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<SearchResults>({
    loading: false,
    stocks: [],
    error: null
  });
  const [allStocks, setAllStocks] = useState<StockInfo[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 初始化加载所有股票
  useEffect(() => {
    const loadAllStocks = async () => {
      try {
        setResults(prev => ({ ...prev, loading: true }));
        const response = await axios.get('/api/stocks/available');
        setAllStocks(response.data);
        setIsInitialized(true);
        setResults(prev => ({ ...prev, loading: false }));
      } catch (error) {
        console.error('加载股票数据失败:', error);
        setResults({
          loading: false,
          stocks: [],
          error: '无法加载股票数据，请稍后再试'
        });
      }
    };

    if (!isInitialized) {
      loadAllStocks();
    }
  }, [isInitialized]);

  // 搜索逻辑
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setResults({
        loading: false,
        stocks: [],
        error: null
      });
      return;
    }

    const searchTermLower = term.toLowerCase();
    
    // 搜索结果过滤
    const filteredStocks = allStocks.filter(stock => {
      // 搜索股票代码
      if (stock.symbol.toLowerCase().includes(searchTermLower)) {
        return true;
      }
      
      // 搜索英文名称
      if (stock.englishName && stock.englishName.toLowerCase().includes(searchTermLower)) {
        return true;
      }
      
      // 搜索中文名称
      if (stock.chineseName && stock.chineseName.toLowerCase().includes(searchTermLower)) {
        return true;
      }
      
      // 搜索完整名称
      if (stock.name && stock.name.toLowerCase().includes(searchTermLower)) {
        return true;
      }
      
      return false;
    }).slice(0, limit);

    setResults({
      loading: false,
      stocks: filteredStocks,
      error: null
    });
  }, [allStocks, limit]);

  // 使用防抖处理搜索，避免频繁搜索
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      performSearch(term);
    }, debounceMs),
    [performSearch, debounceMs]
  );

  // 搜索词变化时触发搜索
  useEffect(() => {
    if (isInitialized) {
      setResults(prev => ({ ...prev, loading: true }));
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch, isInitialized]);

  return {
    searchTerm,
    setSearchTerm,
    loading: results.loading,
    stocks: results.stocks,
    error: results.error,
    initialized: isInitialized
  };
}; 