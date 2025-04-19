import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../../shared/i18n/LanguageContext';
import { 
  PerformanceData, 
  getPortfolioAnalysis, 
  HistoricalTrendsData, 
  getPortfolioHistoricalTrends,
  MonthlyReturnData,
  MonthlyReturn,
  CumulativeReturn
} from '../../../shared/services/portfolioService';
import { formatNumber, formatPercent } from '../../../shared/utils/formatting';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoricalTrendsProps {
  data?: PerformanceData;
  portfolioId?: string;
  historicalTrends?: HistoricalTrendsData;
}

// 定义图表数据类型
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
    pointRadius: number;
    pointHoverRadius: number;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointBorderWidth: number;
  }[];
}

// API调用状态
type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

// 添加常量定义
const AUTO_REFRESH_ENABLED = true;
const REFRESH_INTERVAL = 60000; // 60秒

// 计算累计回报
const calculateCumulativeReturns = (monthlyReturns: MonthlyReturn[]): CumulativeReturn[] => {
  let portfolioCumulative = 100;
  let benchmarkCumulative = 100;
  
  return monthlyReturns.map(item => {
    portfolioCumulative *= (1 + item.return / 100);
    benchmarkCumulative *= (1 + item.benchmark / 100);
    
    return {
      month: item.month,
      portfolio: portfolioCumulative - 100, // 转换为百分比收益率
      benchmark: benchmarkCumulative - 100
    };
  });
};

// 获取API参数
const getPeriodParam = (timeFrame: string): 'ytd' | '1year' | '3year' | '5year' => {
  switch(timeFrame) {
    case 'ytd': return 'ytd';
    case 'oneYear': return '1year';
    case 'threeYear': return '3year';
    case 'fiveYear': return '5year';
    default: return '1year';
  }
};

const HistoricalTrends = ({ data, portfolioId: propPortfolioId, historicalTrends: propHistoricalTrends }: HistoricalTrendsProps) => {
  const { portfolioId: urlPortfolioId } = useParams<{ portfolioId: string }>();
  const { language, t } = useLanguage();
  
  // 使用props中的portfolioId或URL中的portfolioId
  const portfolioId = propPortfolioId || urlPortfolioId;
  
  // 添加状态来存储API获取的数据
  const [analysisData, setAnalysisData] = useState<PerformanceData | undefined>(data);
  const [historicalTrendsData, setHistoricalTrendsData] = useState<HistoricalTrendsData | undefined>(propHistoricalTrends);
  const [apiStatus, setApiStatus] = useState<ApiStatus>((data || propHistoricalTrends) ? 'success' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // 添加时间段选择器状态
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>('oneYear');
  
  // 添加数据加载状态
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 使用useRef来保存定时器ID
  const refreshTimerRef = useRef<number | null>(null);
  
  // 创建获取数据的函数
  const fetchData = useCallback(async (initialFetch = false) => {
    // 没有portfolioId则不能请求
    if (!portfolioId) {
      setApiStatus('error');
      setErrorMessage(language === 'en' 
        ? 'Portfolio ID is required' 
        : '需要投资组合ID');
      return;
    }
    
    setApiStatus('loading');
    try {
      console.log('正在获取投资组合分析数据，ID:', portfolioId, '时间段:', selectedTimeFrame, '时间:', new Date().toLocaleTimeString());
      
      // 获取所选时间段的数据
      const periodParam = getPeriodParam(selectedTimeFrame);
      console.log(`获取${periodParam}时间段的历史趋势数据`);
      
      setErrorMessage(null);
      setLastUpdated(new Date());
      
      // 请求特定时间段的历史趋势数据
      const trendsData = await getPortfolioHistoricalTrends(portfolioId, periodParam);
      console.log(`API返回历史趋势数据:`, trendsData);
      
      // 如果无法获取历史趋势数据，退回到完整分析数据（可能会被筛选）
      if (!trendsData || initialFetch) {
        console.log('获取完整的投资组合分析数据');
        
        const fullData = await getPortfolioAnalysis(portfolioId);
        console.log('获取到的完整分析数据:', fullData);
        
        if (fullData && fullData.historical_trends) {
          console.log('使用API返回的历史趋势数据');
          setHistoricalTrendsData(fullData.historical_trends);
        } else if (fullData && fullData.performance && fullData.performance.monthlyReturns) {
          console.log('使用API返回的月度收益数据生成历史趋势');
          // 构建历史趋势数据
          const monthlyReturns = fullData.performance.monthlyReturns.map(item => ({
            month: item.month || '',
            return: item.return || item.portfolio || 0,
            benchmark: item.benchmark || item.benchmarkReturn || 0
          }));
          
          setHistoricalTrendsData({
            monthlyReturns,
            cumulativeReturns: calculateCumulativeReturns(monthlyReturns)
          });
        } else {
          console.warn('API返回数据中没有历史趋势数据');
        }
      } else {
        // 使用历史趋势数据
        setHistoricalTrendsData(trendsData);
      }
      
      setApiStatus('success');
    } catch (error) {
      console.error('获取历史趋势数据失败:', error);
      setErrorMessage(error.message);
      setApiStatus('error');
    }
  }, [portfolioId, language, selectedTimeFrame]);
  
  // 处理时间段更改
  const handleTimeFrameChange = (newTimeFrame: string) => {
    console.log(`切换时间段: ${selectedTimeFrame} -> ${newTimeFrame}`);
    setSelectedTimeFrame(newTimeFrame);
    
    // 立即获取新时间段的数据
    // 使用setTimeout确保状态更新后再fetch
    setTimeout(() => {
      fetchData(false);
    }, 0);
  };
  
  // 初始加载和定时刷新
  useEffect(() => {
    let timer: number | undefined;
    
    const initData = async () => {
      console.log('初始加载数据');
      await fetchData(true);
      
      // 设置定时刷新
      if (AUTO_REFRESH_ENABLED) {
        timer = setInterval(() => {
          console.log(`定时刷新数据，当前选择的时间段: ${selectedTimeFrame}`);
          fetchData(false);
        }, REFRESH_INTERVAL);
      }
    };
    
    initData();
    
    return () => {
      if (timer) clearInterval(timer);
    };
    // 注意：这里我们不将selectedTimeFrame作为依赖项
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId, language]);
  
  // 在组件挂载和语言变化时输出当前语言设置
  useEffect(() => {
    console.log('HistoricalTrends - Current language setting:', language);
    console.log('HistoricalTrends - Performance data:', analysisData);
    console.log('HistoricalTrends - Historical trends data:', historicalTrendsData);
    
    // 检查API是否返回了有效数据
    if (!historicalTrendsData && !analysisData) {
      console.warn('No data received from API, will use default data');
    } else if (historicalTrendsData && (!historicalTrendsData.monthlyReturns || historicalTrendsData.monthlyReturns.length === 0)) {
      console.warn('API returned data but no monthly returns in historical_trends, will check performance data');
    }
  }, [language, analysisData, historicalTrendsData]);

  // 硬编码的默认英文月份数据 - 使用更现实的日期
  const generateDefaultMonthlyReturns = () => {
    const result = [];
    const now = new Date();
    
    // 确保我们生成足够的历史数据 - 至少60个月（5年）
    const totalMonths = 60;
    console.log(`正在生成 ${totalMonths} 个月的模拟数据...`);
    
    // 生成过去60个月的数据（5年），使用真实的月份
    for (let i = totalMonths - 1; i >= 0; i--) {
      // 计算日期
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      
      // 获取英文月份名
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const monthName = `${monthNames[month-1]} ${year}`;
      
      // 随机生成性能数据，但确保有些趋势
      const randomFactor = Math.random();
      let portfolioReturn;
      
      if (i < 12) {
        // 最近一年的数据 - 更波动但总体正向
        portfolioReturn = (randomFactor * 10 - 3) + (12 - i) * 0.2;
      } else if (i < 36) {
        // 1-3年的数据 - 中等波动
        portfolioReturn = randomFactor * 8 - 2;
      } else {
        // 3-5年的数据 - 较小波动
        portfolioReturn = randomFactor * 6 - 1.5;
      }
      
      // YTD特殊处理 - 确保今年的数据有特定趋势
      if (year === now.getFullYear()) {
        // 今年的数据先上升后回调
        const monthInYear = month - 1; // 0-11
        if (monthInYear < 3) {
          // Q1上升
          portfolioReturn = monthInYear + randomFactor * 2;
        } else if (monthInYear < 6) {
          // Q2波动
          portfolioReturn = 3 - (monthInYear - 3) + randomFactor * 3 - 1;
        } else if (monthInYear < 9) {
          // Q3回调
          portfolioReturn = randomFactor * 4 - 3;
        } else {
          // Q4反弹
          portfolioReturn = (monthInYear - 9) * 1.2 + randomFactor * 2 - 0.5;
        }
      }
      
      // 基准表现稍弱于投资组合
      const benchmarkReturn = portfolioReturn * (0.7 + randomFactor * 0.2);
      
      result.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        monthName,
        portfolio: parseFloat(portfolioReturn.toFixed(2)),
        benchmark: parseFloat(benchmarkReturn.toFixed(2)),
        excess: parseFloat((portfolioReturn - benchmarkReturn).toFixed(2))
      });
    }
    
    // 确保数据是按月份排序的
    const sortedResult = result.sort((a, b) => a.month.localeCompare(b.month));
    
    console.log(`生成了 ${sortedResult.length} 个月的模拟数据`);
    console.log('模拟数据范围:', sortedResult[0].month, '至', sortedResult[sortedResult.length-1].month);
    
    return sortedResult;
  };

  const defaultMonthlyReturns = generateDefaultMonthlyReturns();

  // 使用API数据或默认数据
  const getMonthlyReturns = () => {
    // 优先使用historical_trends数据
    if (historicalTrendsData && historicalTrendsData.monthlyReturns && historicalTrendsData.monthlyReturns.length > 0) {
      console.log('Using historical_trends.monthlyReturns data');
      return historicalTrendsData.monthlyReturns.map((item, index) => {
        // 获取月份名称和标准化月份格式
        let month = item.month;
        let monthName = '';
        
        // 尝试从月份字符串解析日期
        try {
          const dateParts = item.month.split('-');
          if (dateParts.length >= 2) {
            const year = parseInt(dateParts[0]);
            const monthNum = parseInt(dateParts[1]) - 1; // 月份是0-11
            
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            monthName = `${monthNames[monthNum]} ${year}`;
          } else {
            monthName = item.month;
          }
        } catch (e) {
          monthName = item.month;
        }

        return {
          month,
          monthName,
          portfolio: item.return, // 后端MonthlyReturn中的return表示投资组合收益率
          benchmark: item.benchmark,
          excess: item.return - item.benchmark
        };
      }).sort((a, b) => a.month.localeCompare(b.month)); // 确保按月份顺序排序
    }
    
    // 作为备选，使用performance.monthlyReturns数据
    if (analysisData && analysisData.monthlyReturns && analysisData.monthlyReturns.length > 0) {
      console.log('Using performance.monthlyReturns as fallback');
      
      try {
        // 转换API数据格式
        return analysisData.monthlyReturns.map((item, index) => {
          // 获取月份名称和标准化月份格式
          let month = '';
          let monthName = '';
          
          if (item.month && typeof item.month === 'string') {
            month = item.month;
            
            // 尝试从月份字符串解析日期
            try {
              const dateParts = item.month.split('-');
              if (dateParts.length >= 2) {
                const year = parseInt(dateParts[0]);
                const monthNum = parseInt(dateParts[1]) - 1; // 月份是0-11
                
                const monthNames = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ];
                
                monthName = `${monthNames[monthNum]} ${year}`;
              } else {
                monthName = item.month;
              }
            } catch (e) {
              monthName = item.month;
            }
          } else {
            // 使用索引生成月份
            const now = new Date();
            const monthDate = new Date(now.getFullYear(), now.getMonth() - (analysisData.monthlyReturns.length - 1 - index), 1);
            const year = monthDate.getFullYear();
            const monthNum = monthDate.getMonth() + 1;
            
            month = `${year}-${monthNum.toString().padStart(2, '0')}`;
            
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            monthName = `${monthNames[monthNum-1]} ${year}`;
          }

          // 获取收益率数据
          let portfolioReturn = 0;
          if (typeof item.return === 'number') {
            portfolioReturn = item.return;
          } else if (typeof item === 'number') {
            // 如果item直接是数字，则视为收益率
            portfolioReturn = item;
          } else if (typeof item.portfolio === 'number') {
            portfolioReturn = item.portfolio;
          } else if (typeof item.value === 'number') {
            portfolioReturn = item.value;
          }

          // 获取基准收益率，如果没有则使用组合的80%
          let benchmarkReturn = 0;
          if (typeof item.benchmark === 'number') {
            benchmarkReturn = item.benchmark;
          } else if (typeof item.benchmarkReturn === 'number') {
            benchmarkReturn = item.benchmarkReturn;
          } else {
            benchmarkReturn = portfolioReturn * 0.8;
          }
          
          // 计算超额收益
          const excess = portfolioReturn - benchmarkReturn;

          return {
            month,
            monthName,
            portfolio: portfolioReturn,
            benchmark: benchmarkReturn,
            excess: excess
          };
        }).sort((a, b) => a.month.localeCompare(b.month)); // 确保按月份顺序排序
      } catch (error) {
        console.error('Error processing monthly returns data:', error);
        return defaultMonthlyReturns;
      }
    }
    
    console.log('No monthly returns data available in both sources, using defaults');
    return defaultMonthlyReturns;
  };

  const monthlyReturns = getMonthlyReturns();
  
  // 添加调试日志
  useEffect(() => {
    console.log(`总月度数据点数量: ${monthlyReturns.length}个月`);
    console.log('当前选择的时间段:', selectedTimeFrame);
  }, [monthlyReturns.length, selectedTimeFrame]);
  
  // 时间段选项
  const timeFrameOptions = [
    { id: 'ytd', label: language === 'en' ? 'YTD' : '今年以来' },
    { id: 'oneYear', label: language === 'en' ? '1 Year' : '1年' },
    { id: 'threeYear', label: language === 'en' ? '3 Years' : '3年' },
    { id: 'fiveYear', label: language === 'en' ? '5 Years' : '5年' },
  ];
  
  // 使用useRef保存上一次选择的时间段，帮助调试
  const prevTimeFrameRef = useRef(selectedTimeFrame);
  useEffect(() => {
    if (prevTimeFrameRef.current !== selectedTimeFrame) {
      console.log(`时间段状态变化: ${prevTimeFrameRef.current} -> ${selectedTimeFrame}`);
      prevTimeFrameRef.current = selectedTimeFrame;
    }
  }, [selectedTimeFrame]);

  // 根据所选时间段筛选数据
  const getFilteredMonthlyReturns = useCallback(() => {
    if (!monthlyReturns || monthlyReturns.length === 0) {
      console.warn('无月度收益数据可用');
      return [];
    }
    
    console.log(`筛选前有 ${monthlyReturns.length} 个月的数据，当前选择的时间段: ${selectedTimeFrame}`);
    
    // 确保月度数据按日期排序（从旧到新）
    const sortedMonths = [...monthlyReturns].sort((a, b) => 
      a.month.localeCompare(b.month)
    );
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    let filtered = [];
    
    // 注意：后端已经提供了完整的数据，我们在前端进行筛选
    switch(selectedTimeFrame) {
      case 'ytd':
        // 从今年1月开始到当前月份
        filtered = sortedMonths.filter(item => {
          if (!item.month) return false;
          const parts = item.month.split('-');
          if (parts.length < 2) return false;
          
          const year = parseInt(parts[0]);
          return year === currentYear;
        });
        console.log(`YTD筛选后: ${filtered.length} 个月`);
        break;
      case 'oneYear':
        // 最近12个月
        filtered = sortedMonths.slice(-Math.min(12, sortedMonths.length));
        console.log(`1年筛选后: ${filtered.length} 个月`);
        break;
      case 'threeYear':
        // 最近36个月
        filtered = sortedMonths.slice(-Math.min(36, sortedMonths.length));
        console.log(`3年筛选后: ${filtered.length} 个月`);
        break;
      case 'fiveYear':
        // 最近60个月
        filtered = sortedMonths.slice(-Math.min(60, sortedMonths.length));
        console.log(`5年筛选后: ${filtered.length} 个月`);
        break;
      default:
        // 默认1年
        filtered = sortedMonths.slice(-Math.min(12, sortedMonths.length));
        console.log(`默认筛选后: ${filtered.length} 个月`);
    }
    
    // 确保至少有一个数据点
    if (filtered.length === 0 && sortedMonths.length > 0) {
      console.warn('筛选后没有数据，使用所有可用数据');
      filtered = sortedMonths;
    }
    
    if (filtered.length > 0) {
      console.log('筛选后日期范围:', filtered[0].month, '至', filtered[filtered.length-1].month);
    }
    
    return filtered;
  }, [monthlyReturns, selectedTimeFrame]);

  // 使用筛选后的数据
  const filteredReturns = useMemo(() => getFilteredMonthlyReturns(), [getFilteredMonthlyReturns]);
  
  // 修改图表X轴配置，适应不同的数据量
  const getChartOptions = (dataPoints: number) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#1E3A8A',
            font: {
              size: 12,
              weight: '500' as any
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#1E3A8A',
          bodyColor: '#1E3A8A',
          borderColor: '#A3BFFA',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          boxPadding: 4,
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false, // 允许负值
          grid: {
            color: 'rgba(163, 191, 250, 0.1)'
          },
          ticks: {
            color: '#1E3A8A',
            callback: function(value: any) {
              return value + '%';
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#1E3A8A',
            // 根据数据点数量调整标签旋转和显示频率
            maxRotation: dataPoints > 12 ? 45 : 0,
            minRotation: dataPoints > 12 ? 45 : 0,
            autoSkip: true,
            maxTicksLimit: dataPoints > 36 ? 12 : (dataPoints > 12 ? 6 : dataPoints)
          }
        }
      }
    };
    
    return baseOptions;
  };
  
  // 生成图表数据
  const chartData: ChartData = {
    labels: filteredReturns.map(item => item.monthName),
    datasets: [
      {
        label: language === 'en' ? 'Portfolio' : '投资组合',
        data: filteredReturns.map(item => item.portfolio),
        borderColor: '#1E3A8A',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1E3A8A',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      },
      {
        label: language === 'en' ? 'Benchmark' : '基准',
        data: filteredReturns.map(item => item.benchmark),
        borderColor: '#A3BFFA',
        backgroundColor: 'rgba(163, 191, 250, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#A3BFFA',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      }
    ]
  };

  // 图表配置
  const chartOptions = getChartOptions(filteredReturns.length);
  
  // 计算累计表现
  const calculateCumulativePerformance = (returns: any[]) => {
    // 如果有历史趋势中的cumulative数据，优先使用
    if (historicalTrendsData?.cumulativeReturns && historicalTrendsData.cumulativeReturns.length > 0) {
      console.log('Using historical_trends.cumulativeReturns data');
      
      const cumulativeData = historicalTrendsData.cumulativeReturns.map(item => {
        let monthName = '';
        
        // 尝试从月份字符串解析日期
        try {
          const dateParts = item.month.split('-');
          if (dateParts.length >= 2) {
            const year = parseInt(dateParts[0]);
            const monthNum = parseInt(dateParts[1]) - 1; // 月份是0-11
            
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            monthName = `${monthNames[monthNum]} ${year}`;
          } else {
            monthName = item.month;
          }
        } catch (e) {
          monthName = item.month;
        }
        
        return {
          monthName,
          portfolio: item.portfolio,
          benchmark: item.benchmark
        };
      });
      
      return {
        labels: cumulativeData.map(item => item.monthName),
        portfolioData: cumulativeData.map(item => item.portfolio),
        benchmarkData: cumulativeData.map(item => item.benchmark)
      };
    }
    
    // 否则计算累计表现
    const portfolioCumulative = [100];
    const benchmarkCumulative = [100];
    
    for (let i = 0; i < returns.length; i++) {
      const prevPortfolio = portfolioCumulative[i];
      const prevBenchmark = benchmarkCumulative[i];
      
      portfolioCumulative.push(prevPortfolio * (1 + returns[i].portfolio / 100));
      benchmarkCumulative.push(prevBenchmark * (1 + returns[i].benchmark / 100));
    }
    
    // 移除第一个元素(初始值100)
    portfolioCumulative.shift();
    benchmarkCumulative.shift();
    
    return {
      labels: returns.map(item => item.monthName),
      portfolioData: portfolioCumulative.map(val => parseFloat((val - 100).toFixed(2))), // 转换为百分比收益
      benchmarkData: benchmarkCumulative.map(val => parseFloat((val - 100).toFixed(2)))
    };
  };
  
  // 计算累计收益数据
  const cumulativeData = calculateCumulativePerformance(filteredReturns);
  
  // 累计表现图表数据
  const cumulativeChartData: ChartData = {
    labels: cumulativeData.labels,
    datasets: [
      {
        label: language === 'en' ? 'Portfolio' : '投资组合',
        data: cumulativeData.portfolioData,
        borderColor: '#1E3A8A',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1E3A8A',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      },
      {
        label: language === 'en' ? 'Benchmark' : '基准',
        data: cumulativeData.benchmarkData,
        borderColor: '#A3BFFA',
        backgroundColor: 'rgba(163, 191, 250, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#A3BFFA',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      }
    ]
  };
  
  // 手动刷新数据
  const handleRefresh = () => {
    fetchData(false);
  };
  
  // 渲染加载状态
  if (apiStatus === 'loading' && !analysisData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">
          {language === 'en' ? 'Loading analysis data...' : '加载分析数据中...'}
        </p>
      </div>
    );
  }
  
  // 渲染错误状态
  if (apiStatus === 'error' && !analysisData) {
    return (
      <div className="bg-red-50 text-red-700 p-8 rounded-lg text-center">
        <h3 className="text-lg font-medium mb-2">
          {language === 'en' ? 'Data Loading Error' : '数据加载错误'}
        </h3>
        <p>{errorMessage}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {language === 'en' ? 'Retry' : '重试'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{language === 'en' ? 'Historical Trends' : '历史趋势'}</h2>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-500">
            {language === 'en' ? 'Last updated:' : '最后更新:'} {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      {/* 加载指示器 - 在数据加载中显示 */}
      {apiStatus === 'loading' && (
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded mb-4 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <p className="text-sm">
            {language === 'en' 
              ? `Loading ${timeFrameOptions.find(t => t.id === selectedTimeFrame)?.label} data...` 
              : `正在加载${timeFrameOptions.find(t => t.id === selectedTimeFrame)?.label}数据...`}
          </p>
        </div>
      )}
      
      {/* 添加错误指示器，表明当前显示的是默认数据 */}
      {(!historicalTrendsData || !historicalTrendsData.monthlyReturns || historicalTrendsData.monthlyReturns.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          <p className="text-sm">
            {language === 'en' 
              ? 'Using sample data. Historical trends data not available from server.' 
              : '使用样本数据。服务器上没有可用的历史趋势数据。'}
          </p>
        </div>
      )}
      
      {/* 添加当前显示时间段标记 */}
      <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded mb-4">
        <p className="text-sm font-medium">
          {language === 'en' 
            ? `Currently showing: ${timeFrameOptions.find(t => t.id === selectedTimeFrame)?.label} data` 
            : `当前显示: ${timeFrameOptions.find(t => t.id === selectedTimeFrame)?.label}数据`}
          {filteredReturns.length > 0 && 
            ` (${filteredReturns[0].month} - ${filteredReturns[filteredReturns.length-1].month})`}
        </p>
      </div>
      
      {/* 添加时间段选择器 */}
      <div className="mb-6 flex justify-end">
        <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
          {timeFrameOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleTimeFrameChange(option.id)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedTimeFrame === option.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              disabled={apiStatus === 'loading'}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 添加累计收益走势图 */}
      <div className="bg-white rounded-lg overflow-hidden mb-6 w-full">
        <div className="p-4">
          <h3 className="text-md font-medium mb-2">
            {language === 'en' ? 'Accumulative Performance' : '累计表现'}
          </h3>
          <div className="h-80">
            <Line data={cumulativeChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* 添加月度收益走势图 */}
      <div className="bg-white rounded-lg overflow-hidden mb-6 w-full">
        <div className="p-4">
          <h3 className="text-md font-medium mb-2">
            {language === 'en' ? 'Monthly Performance' : '月度表现'}
          </h3>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      <div className="mt-4 w-full">
        <h3 className="text-md font-medium mb-2">
          {language === 'en' ? 'Monthly Returns (%)' : '月度收益率 (%)'}
        </h3>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'MONTH' : '月份'}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'PORTFOLIO' : '投资组合'}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'BENCHMARK' : '基准'}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'EXCESS RETURN' : '超额收益'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...filteredReturns].reverse().map((item, index) => {
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.monthName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className={item.portfolio >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercent(item.portfolio)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className={item.benchmark >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercent(item.benchmark)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className={item.excess >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.excess >= 0 ? '+' : ''}{formatPercent(item.excess)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          {language === 'en' 
            ? `Showing monthly returns for: ${timeFrameOptions.find(t => t.id === selectedTimeFrame)?.label}` 
            : `当前显示时间范围: ${timeFrameOptions.find(t => t.id === selectedTimeFrame)?.label}`}
          {filteredReturns.length > 0 && 
            ` (${filteredReturns[0].month || ''} - ${filteredReturns[filteredReturns.length-1].month || ''})`}
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          <p>{language === 'en' ? 'Note: These data are for reference only. Actual investment decisions should be based on more comprehensive analysis.' : '注意: 这些数据仅供参考，实际投资决策应基于更全面的分析。'}</p>
        </div>
      </div>
    </div>
  );
};

export default HistoricalTrends; 