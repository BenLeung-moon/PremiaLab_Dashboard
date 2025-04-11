import axios from 'axios';

const API_URL = '/api/portfolios';
const TEST_MODE = true; // Match with ChatHomePage setting

interface Ticker {
  symbol: string;
  weight: number;
}

interface Portfolio {
  name: string;
  tickers: Ticker[];
}

interface PortfolioResponse {
  id: string;
  created_at: string;
  portfolio: Portfolio;
}

interface AllocationData {
  行业分布: { [key: string]: number };
  地区分布: { [key: string]: number };
  市值分布: { [key: string]: number };
}

interface ComparisonData {
  总收益率: { 投资组合: number; 基准: number; 超额: number };
  年化收益率: { 投资组合: number; 基准: number; 超额: number };
  波动率: { 投资组合: number; 基准: number; 差异: number };
  夏普比率: { 投资组合: number; 基准: number; 差异: number };
  最大回撤: { 投资组合: number; 基准: number; 差异: number };
  相关性: number;
  跟踪误差: number;
  信息比率: number;
  胜率: number;
}

// Stock code to company name mapping
export const stockNameMapping: { [key: string]: string } = {
  "AAPL": "Apple Inc.",
  "MSFT": "Microsoft Corporation",
  "AMZN": "Amazon.com Inc.",
  "GOOGL": "Alphabet Inc. (Google) Class A",
  "GOOG": "Alphabet Inc. (Google) Class C",
  "META": "Meta Platforms Inc.",
  "TSLA": "Tesla Inc.",
  "NVDA": "NVIDIA Corporation",
  "BRK-B": "Berkshire Hathaway Inc. Class B",
  "JPM": "JPMorgan Chase & Co.",
  "JNJ": "Johnson & Johnson",
  "V": "Visa Inc.",
  "PG": "Procter & Gamble Co.",
  "UNH": "UnitedHealth Group Inc.",
  "HD": "Home Depot Inc.",
  "MA": "Mastercard Inc.",
  "BAC": "Bank of America Corp.",
  "DIS": "Walt Disney Co.",
  "ADBE": "Adobe Inc.",
  "CRM": "Salesforce Inc.",
  "KO": "Coca-Cola Co.",
  "NFLX": "Netflix Inc.",
  "PFE": "Pfizer Inc.",
  "CSCO": "Cisco Systems Inc.",
  "AVGO": "Broadcom Inc.",
  "TMO": "Thermo Fisher Scientific Inc.",
  "ABT": "Abbott Laboratories",
  "PEP": "PepsiCo Inc.",
  "COST": "Costco Wholesale Corp.",
  "CMCSA": "Comcast Corp.",
  "ACN": "Accenture plc",
  "WMT": "Walmart Inc.",
  "MRK": "Merck & Co. Inc.",
  "VZ": "Verizon Communications Inc.",
  "NKE": "Nike Inc.",
  "INTC": "Intel Corporation",
  "AMD": "Advanced Micro Devices Inc.",
  "IBM": "International Business Machines Corp.",
  "QCOM": "Qualcomm Inc.",
  "T": "AT&T Inc.",
  "PYPL": "PayPal Holdings Inc.",
  "SBUX": "Starbucks Corp.",
  "MCD": "McDonald's Corp.",
  "TXN": "Texas Instruments Inc.",
  "BA": "Boeing Co.",
  "C": "Citigroup Inc.",
  "GS": "Goldman Sachs Group Inc.",
  "MMM": "3M Co.",
  "CVX": "Chevron Corp.",
  "XOM": "Exxon Mobil Corp.",
  "CAT": "Caterpillar Inc.",
  "AMAT": "Applied Materials Inc.",
  "INTU": "Intuit Inc.",
  "GE": "General Electric Co.",
  "ORCL": "Oracle Corp.",
  "F": "Ford Motor Co.",
  "GM": "General Motors Co.",
  "AMGN": "Amgen Inc.",
  "WFC": "Wells Fargo & Co.",
  "AXP": "American Express Co.",
  "BKNG": "Booking Holdings Inc.",
  "LMT": "Lockheed Martin Corp.",
  "RTX": "Raytheon Technologies Corp.",
  "UNP": "Union Pacific Corp.",
  "UPS": "United Parcel Service Inc.",
  "PM": "Philip Morris International Inc.",
  "LOW": "Lowe's Companies Inc.",
  "DHR": "Danaher Corp.",
  "LIN": "Linde plc",
  "NEE": "NextEra Energy Inc.",
  "AMT": "American Tower Corp.",
  "ISRG": "Intuitive Surgical Inc.",
  "SCHW": "Charles Schwab Corp.",
  "MS": "Morgan Stanley",
  "HON": "Honeywell International Inc.",
  "MDT": "Medtronic plc",
  "BMY": "Bristol-Myers Squibb Co."
};

/**
 * Submit portfolio to backend API
 * @param portfolio Portfolio data
 * @returns Promise containing API response
 */
export const submitPortfolio = async (portfolio: Portfolio): Promise<PortfolioResponse> => {
  try {
    if (TEST_MODE) {
      // Simulate successful response in test mode
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return {
        id: 'test-' + Date.now(),
        created_at: new Date().toISOString(),
        portfolio: portfolio
      };
    }

    const response = await axios.post('/api/portfolio', portfolio);
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw new Error('Could not submit portfolio. Please check your API connection or try again later.');
  }
};

/**
 * Get user's portfolio list
 * @returns Promise containing portfolio array
 */
export const getPortfolios = async (): Promise<Portfolio[]> => {
  try {
    if (TEST_MODE) {
      // Return mock data in test mode
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          name: "Test Portfolio 1",
          tickers: [
            { symbol: "AAPL", weight: 0.4 },
            { symbol: "MSFT", weight: 0.3 },
            { symbol: "GOOGL", weight: 0.2 },
            { symbol: "AMZN", weight: 0.1 }
          ]
        }
      ];
    }

    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch portfolios:', error);
    throw new Error('Could not retrieve portfolio list. Please check your API connection or try again later.');
  }
};

// 获取可用的股票代码列表
export const getAvailableStocks = async (): Promise<string[]> => {
  try {
    // 在实际环境中应该调用后端API获取列表
    // 在测试模式下返回静态列表
    return [
      "A", "AAPL", "ABBV", "ABNB", "ABT", "ACGL", "ACN", "ADBE", "ADI", "ADM", 
      "ADP", "ADSK", "AEE", "AEP", "AES", "AFL", "AIG", "AIZ", "AJG", "AKAM", 
      "ALB", "ALGN", "ALL", "ALLE", "AMAT", "AMCR", "AMD", "AME", "AMGN", "AMP",
      "AMT", "AMZN", "ANET", "ANSS", "AON", "AOS", "APD", "APH", "APTV", "ARE",
      "ATO", "ATVI", "AVB", "AVGO", "AVY", "AWK", "AXP", "AZO", "BA", "BAC", 
      "BAX", "BBWI", "BBY", "BDX", "BEN", "BF-B", "BIIB", "BIO", "BK", "BKNG",
      "BKR", "BLK", "BMY", "BR", "BRK-B", "BRO", "BSX", "BWA", "BXP", "C", 
      "CAG", "CAH", "CARR", "CAT", "CB", "CBOE", "CBRE", "CCI", "CCL", "CDNS",
      "CDW", "CE", "CEG", "CF", "CFG", "CHD", "CHRW", "CHTR", "CI", "CINF", 
      "CL", "CLX", "CMA", "CMCSA", "CME", "CMG", "CMI", "CMS", "CNC", "COF",
      "COIN", "COO", "COP", "COST", "CPB", "CPRT", "CPT", "CRM", "CSCO", "CSX",
      "CTAS", "CTLT", "CTRA", "CTSH", "CTVA", "CVS", "CVX", "CZR", "D", "DAL",
      "DD", "DE", "DFS", "DG", "DGX", "DHI", "DHR", "DIS", "DLR", "DLTR",
      "DOC", "DOV", "DOW", "DPZ", "DRI", "DTE", "DUK", "DVA", "DVN", "DXCM",
      "EA", "EBAY", "ECL", "ED", "EFX", "EIX", "EL", "ELV", "EMN", "EMR",
      "ENPH", "EOG", "EQIX", "EQR", "ES", "ESS", "ETN", "ETR", "ETSY", "EVRG",
      "EW", "EXC", "EXPD", "EXPE", "EXR", "F", "FANG", "FAST", "FB", "FBHS",
      "FCX", "FDS", "FDX", "FE", "FFIV", "FIS", "FISV", "FITB", "FLT", "FMC",
      "FOX", "FOXA", "FRC", "FRT", "FTNT", "FTV", "GD", "GE", "GILD", "GIS",
      "GL", "GLW", "GM", "GOOG", "GOOGL", "GPC", "GPN", "GRMN", "GS", "GWW",
      "HAL", "HAS", "HBAN", "HCA", "HD", "HES", "HIG", "HII", "HLT", "HOLX",
      "HON", "HPE", "HPQ", "HRL", "HSIC", "HST", "HSY", "HUM", "IBM", "ICE",
      "IDXX", "IEX", "IFF", "ILMN", "INCY", "INTC", "INTU", "IP", "IPG", "IQV",
      "IR", "IRM", "ISRG", "IT", "ITW", "IVZ", "J", "JBHT", "JCI", "JKHY",
      "JNJ", "JNPR", "JPM", "K", "KEY", "KEYS", "KHC", "KIM", "KLAC", "KMB",
      "KMI", "KMX", "KO", "KR", "L", "LDOS", "LEN", "LH", "LHX", "LIN",
      "LKQ", "LLY", "LMT", "LNC", "LNT", "LOW", "LRCX", "LUMN", "LUV", "LVS",
      "LW", "LYB", "LYV", "MA", "MAA", "MAR", "MAS", "MCD", "MCHP", "MCK",
      "MCO", "MDLZ", "MDT", "MET", "META", "MGM", "MHK", "MKC", "MKTX", "MLM",
      "MMC", "MMM", "MNST", "MO", "MOH", "MOS", "MPC", "MPWR", "MRK", "MRO",
      "MS", "MSCI", "MSFT", "MSI", "MTB", "MTCH", "MTD", "MU", "NCLH", "NDAQ",
      "NDSN", "NEE", "NEM", "NFLX", "NI", "NKE", "NOC", "NOV", "NOW", "NRG",
      "NSC", "NTAP", "NTRS", "NUE", "NVDA", "NVR", "NWL", "NWS", "NWSA", "O",
      "ODFL", "OGN", "OKE", "OMC", "ON", "ORCL", "ORLY", "OTIS", "OXY", "PARA",
      "PAYC", "PAYX", "PCAR", "PCG", "PEAK", "PEG", "PENN", "PEP", "PFE", "PFG",
      "PG", "PGR", "PH", "PHM", "PKG", "PKI", "PLD", "PM", "PNC", "PNR",
      "PNW", "POOL", "PPG", "PPL", "PRU", "PSA", "PSX", "PTC", "PVH", "PWR",
      "PXD", "PYPL", "QCOM", "QRVO", "RCL", "RE", "REG", "REGN", "RF", "RHI",
      "RJF", "RL", "RMD", "ROK", "ROL", "ROP", "ROST", "RSG", "RTX", "SBAC",
      "SBUX", "SCHW", "SEE", "SHW", "SIVB", "SJM", "SLB", "SNA", "SNPS", "SO",
      "SPG", "SPGI", "SRE", "STE", "STT", "STX", "STZ", "SWK", "SWKS", "SYF",
      "SYK", "SYY", "T", "TAP", "TDG", "TDY", "TECH", "TEL", "TER", "TFC",
      "TFX", "TGT", "TJX", "TMO", "TMUS", "TPR", "TRGP", "TRMB", "TROW", "TRV",
      "TSCO", "TSLA", "TSN", "TT", "TTWO", "TXN", "TXT", "TYL", "UA", "UAA",
      "UAL", "UDR", "UHS", "ULTA", "UNH", "UNP", "UPS", "URI", "USB", "V",
      "VFC", "VICI", "VLO", "VMC", "VNO", "VRSK", "VRSN", "VRTX", "VTR", "VTRS",
      "VZ", "WAB", "WAT", "WBA", "WBD", "WDC", "WEC", "WELL", "WFC", "WHR",
      "WM", "WMB", "WMT", "WRB", "WRK", "WST", "WTW", "WY", "WYNN", "XEL",
      "XOM", "XRAY", "XYL", "YUM", "ZBH", "ZBRA", "ZION", "ZTS"
    ];
  } catch (error) {
    console.error('获取股票代码列表失败:', error);
    throw error;
  }
};

// 获取可用的股票代码和公司名称列表
export const getAvailableStocksWithNames = async (): Promise<{symbol: string, name: string}[]> => {
  try {
    const stocks = await getAvailableStocks();
    return stocks.map(symbol => ({
      symbol,
      name: stockNameMapping[symbol] || ''
    }));
  } catch (error) {
    console.error('获取股票代码和名称列表失败:', error);
    throw error;
  }
};

/**
 * 获取投资组合的资产配置数据
 * @param portfolioId 投资组合ID
 * @returns 资产配置数据
 */
export const getPortfolioAllocation = async (portfolioId: string): Promise<AllocationData> => {
  try {
    if (TEST_MODE) {
      // 模拟响应
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        行业分布: {
          '信息技术': 55.0,
          '通信服务': 20.0,
          '消费者非必需品': 15.0,
          '其他': 10.0
        },
        地区分布: {
          '美国': 90.0,
          '欧洲': 5.0,
          '亚洲': 5.0
        },
        市值分布: {
          '大盘股': 80.0,
          '中盘股': 15.0,
          '小盘股': 5.0
        }
      };
    }

    const response = await axios.get(`/api/portfolio/${portfolioId}/allocation`);
    return response.data.allocation;
  } catch (error) {
    console.error('获取资产配置数据失败:', error);
    throw new Error('无法获取资产配置数据。请稍后重试。');
  }
};

/**
 * 获取投资组合与基准的对比数据
 * @param portfolioId 投资组合ID
 * @returns 比较数据
 */
export const getPortfolioComparison = async (portfolioId: string): Promise<ComparisonData> => {
  try {
    if (TEST_MODE) {
      // 模拟响应
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        总收益率: { 投资组合: 15.2, 基准: 10.5, 超额: 4.7 },
        年化收益率: { 投资组合: 12.4, 基准: 9.1, 超额: 3.3 },
        波动率: { 投资组合: 14.2, 基准: 12.7, 差异: 1.5 },
        夏普比率: { 投资组合: 1.36, 基准: 1.12, 差异: 0.24 },
        最大回撤: { 投资组合: 8.6, 基准: 11.7, 差异: -3.1 },
        相关性: 0.89,
        跟踪误差: 5.2,
        信息比率: 1.05,
        胜率: 58.3
      };
    }

    const response = await axios.get(`/api/portfolio/${portfolioId}/comparison`);
    return response.data.comparison;
  } catch (error) {
    console.error('获取比较数据失败:', error);
    throw new Error('无法获取比较数据。请稍后重试。');
  }
}; 