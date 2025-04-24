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
      console.log('[StockSearch] 开始加载股票数据...');
      try {
        setResults(prev => ({ ...prev, loading: true }));
        console.log('[StockSearch] 发送API请求: /api/stocks/available');
        const response = await axios.get('/api/stocks/available');
        console.log('[StockSearch] 获取股票数据成功，数据条数:', response.data?.length || 0);
        console.log('[StockSearch] 数据样例:', response.data?.slice(0, 3));
        setAllStocks(response.data);
        setIsInitialized(true);
        console.log('[StockSearch] 初始化完成, isInitialized =', true);
        setResults(prev => ({ ...prev, loading: false }));
      } catch (error) {
        console.error('[StockSearch] 加载股票数据失败:', error);
        console.log('[StockSearch] 错误详情:', JSON.stringify(error));
        setResults({
          loading: false,
          stocks: [],
          error: '无法加载股票数据，请稍后再试'
        });
      }
    };

    if (!isInitialized) {
      console.log('[StockSearch] 组件未初始化，开始加载数据');
      loadAllStocks();
    } else {
      console.log('[StockSearch] 组件已初始化，跳过数据加载');
    }
  }, [isInitialized]);

  // 搜索逻辑
  const performSearch = useCallback((term: string) => {
    console.log('[StockSearch] 执行搜索，关键词:', term);
    
    if (!term.trim()) {
      console.log('[StockSearch] 搜索词为空，清空结果');
      setResults({
        loading: false,
        stocks: [],
        error: null
      });
      return;
    }

    const searchTermLower = term.toLowerCase();
    console.log('[StockSearch] 可用股票总数:', allStocks.length);
    
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

    console.log('[StockSearch] 过滤后结果数量:', filteredStocks.length);
    console.log('[StockSearch] 搜索结果样例:', filteredStocks.slice(0, 3));
    
    setResults({
      loading: false,
      stocks: filteredStocks,
      error: null
    });
  }, [allStocks, limit]);

  // 使用防抖处理搜索，避免频繁搜索
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      console.log('[StockSearch] 触发防抖搜索:', term);
      performSearch(term);
    }, debounceMs),
    [performSearch, debounceMs]
  );

  // 搜索词变化时触发搜索
  useEffect(() => {
    if (isInitialized) {
      console.log('[StockSearch] 搜索词变化:', searchTerm);
      setResults(prev => ({ ...prev, loading: true }));
      debouncedSearch(searchTerm);
    } else {
      console.log('[StockSearch] 组件未初始化，跳过搜索');
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