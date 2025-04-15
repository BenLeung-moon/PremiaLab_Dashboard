from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
import json
import os
from pathlib import Path
from ..utils.market_data import (
    get_portfolio_returns, 
    get_portfolio_factor_exposure, 
    compare_with_benchmark,
    get_asset_allocation
)
import requests
import time

router = APIRouter()

# 数据模型
class Ticker(BaseModel):
    symbol: str
    weight: float
    name: Optional[str] = None
    sector: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None

class Portfolio(BaseModel):
    name: str
    tickers: List[Ticker]

class PortfolioResponse(BaseModel):
    id: str
    name: str
    created_at: str
    tickers: List[Ticker]

class PortfolioAnalysis(BaseModel):
    performance: Dict[str, Any]
    allocation: Dict[str, Any]
    risk: List[Dict[str, Any]]
    comparison: List[Dict[str, Any]]
    factors: Dict[str, Any]

# 模拟数据库
portfolios_db = {}

# 创建数据目录 - 使用更可靠的路径定义
current_file = Path(__file__)
app_dir = current_file.parent.parent  # backend/app/
data_dir = app_dir / "data"
data_dir.mkdir(exist_ok=True, parents=True)
# 创建缓存目录
cache_dir = data_dir / "cache"
cache_dir.mkdir(exist_ok=True)  # 确保缓存目录存在
portfolios_file = data_dir / "portfolios.json"

# 加载已存在的投资组合数据
def load_portfolios():
    global portfolios_db
    if portfolios_file.exists():
        try:
            with open(portfolios_file, "r") as f:
                portfolios_data = json.load(f)
                # 将读取的JSON数据转换为正确的模型格式
                for port_id, port_data in portfolios_data.items():
                    if "tickers" in port_data:
                        port_data["tickers"] = [
                            Ticker(**ticker) if isinstance(ticker, dict) else ticker
                            for ticker in port_data["tickers"]
                        ]
                portfolios_db = portfolios_data
        except Exception as e:
            print(f"Error loading portfolios: {e}")
            portfolios_db = {}
    else:
        portfolios_db = {}

# 保存投资组合数据到文件
def save_portfolios():
    try:
        # 将Ticker对象转换为字典
        portfolios_to_save = {}
        for port_id, port_data in portfolios_db.items():
            portfolios_to_save[port_id] = {**port_data}
            if "tickers" in portfolios_to_save[port_id]:
                portfolios_to_save[port_id]["tickers"] = [
                    ticker.dict() if hasattr(ticker, "dict") else ticker
                    for ticker in portfolios_to_save[port_id]["tickers"]
                ]
        
        with open(portfolios_file, "w") as f:
            json.dump(portfolios_to_save, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving portfolios: {e}")

# 初始加载投资组合
load_portfolios()

# 股票数据库 - 为测试提供一些基本信息
stocks_db = {
    "AAPL": {"name": "Apple Inc.", "sector": "Technology", "price": 173.57, "change": 0.0123},
    "MSFT": {"name": "Microsoft Corp.", "sector": "Technology", "price": 402.28, "change": -0.0056},
    "GOOGL": {"name": "Alphabet Inc.", "sector": "Communication Services", "price": 147.68, "change": 0.0034},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Consumer Discretionary", "price": 178.08, "change": 0.0212},
    "TSLA": {"name": "Tesla, Inc.", "sector": "Consumer Discretionary", "price": 197.42, "change": -0.0145},
    "META": {"name": "Meta Platforms, Inc.", "sector": "Communication Services", "price": 481.73, "change": 0.0078},
    "NVDA": {"name": "NVIDIA Corporation", "sector": "Technology", "price": 922.28, "change": 0.0345},
    "JPM": {"name": "JPMorgan Chase & Co.", "sector": "Financial Services", "price": 196.46, "change": -0.0067},
    "V": {"name": "Visa Inc.", "sector": "Financial Services", "price": 275.96, "change": 0.0021},
    "JNJ": {"name": "Johnson & Johnson", "sector": "Healthcare", "price": 151.14, "change": 0.0015},
}

# 添加更多模拟股票数据
for i in range(50):
    symbol = f"STOCK{i+1}"
    sector_choice = random.choice(["Technology", "Healthcare", "Financial Services", "Consumer Discretionary", 
                                 "Communication Services", "Industrials", "Energy", "Materials", "Utilities"])
    price = round(random.uniform(10, 500), 2)
    change = round(random.uniform(-0.05, 0.05), 4)
    
    stocks_db[symbol] = {
        "name": f"模拟股票 {i+1}",
        "sector": sector_choice,
        "price": price,
        "change": change
    }

# 股票名称映射 - 与前端的stockNameMapping匹配
stock_name_mapping = {
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
    "CRM": "Salesforce Inc."
}

# 更新stocks_db以包含映射中的全部股票
for symbol, name in stock_name_mapping.items():
    if symbol not in stocks_db:
        sector_choice = random.choice(["Technology", "Healthcare", "Financial Services", "Consumer Discretionary", 
                                     "Communication Services", "Industrials", "Energy", "Materials", "Utilities"])
        price = round(random.uniform(10, 500), 2)
        change = round(random.uniform(-0.05, 0.05), 4)
        
        stocks_db[symbol] = {
            "name": name,
            "sector": sector_choice,
            "price": price,
            "change": change
        }

# 加载公司信息数据库
def load_companies_data():
    companies_file = data_dir / "companies.json"
    companies_data = {}
    
    if companies_file.exists():
        try:
            with open(companies_file, "r") as f:
                data = json.load(f)
                companies_data = data.get("companies", {})
        except Exception as e:
            print(f"Error loading companies data: {e}")
    
    return companies_data

# 加载股票映射数据
def load_stock_mappings():
    mappings_file = data_dir / "stock_mappings.json"
    regions = {}
    market_caps = {}
    sectors = {}
    
    # 默认映射，当文件不存在或加载失败时使用
    default_regions = {
        "AAPL": "United States", "MSFT": "United States", "GOOGL": "United States", 
        "AMZN": "United States", "TSLA": "United States", "META": "United States",
        "NVDA": "United States", "JPM": "United States", "V": "United States", 
        "JNJ": "United States", "BABA": "China", "9988.HK": "China", 
        "TCEHY": "China", "SONY": "Japan", "7203.T": "Japan", 
        "SAP": "Europe", "SAN": "Europe", "VOD": "Europe"
    }
    
    default_market_caps = {
        "AAPL": "Large Cap", "MSFT": "Large Cap", "GOOGL": "Large Cap", 
        "AMZN": "Large Cap", "TSLA": "Large Cap", "META": "Large Cap",
        "NVDA": "Large Cap", "JPM": "Large Cap", "V": "Large Cap", 
        "JNJ": "Large Cap", "PG": "Large Cap", "BABA": "Large Cap",
        "AMD": "Mid Cap", "UBER": "Mid Cap", "SPOT": "Mid Cap", 
        "ROKU": "Mid Cap", "ZM": "Mid Cap", "TWLO": "Mid Cap",
        "BYND": "Small Cap", "GRPN": "Small Cap", "GPRO": "Small Cap", 
        "GME": "Small Cap", "AMC": "Small Cap", "BB": "Small Cap"
    }
    
    default_sectors = {
        "AAPL": "Technology", "MSFT": "Technology", 
        "GOOGL": "Communication Services", "AMZN": "Consumer Discretionary",
        "META": "Communication Services", "TSLA": "Consumer Discretionary",
        "NVDA": "Technology", "JPM": "Financial Services",
        "V": "Financial Services", "JNJ": "Healthcare"
    }
    
    if mappings_file.exists():
        try:
            with open(mappings_file, "r") as f:
                data = json.load(f)
                regions = data.get("regions", {})
                market_caps = data.get("marketCap", {})
                sectors = data.get("sectors", {})
                
                # 如果从文件加载的数据是空的，使用默认值
                if not regions:
                    regions = default_regions
                if not market_caps:
                    market_caps = default_market_caps
                if not sectors:
                    sectors = default_sectors
        except Exception as e:
            print(f"Error loading stock mappings: {e}")
            # 加载失败，使用默认值
            regions = default_regions
            market_caps = default_market_caps
            sectors = default_sectors
    else:
        # 文件不存在，使用默认值
        regions = default_regions
        market_caps = default_market_caps
        sectors = default_sectors
    
    return regions, market_caps, sectors

# 加载公司数据
companies_db = load_companies_data()

# 加载股票映射数据
region_mappings, market_cap_mappings, sector_mappings = load_stock_mappings()

# 辅助函数：生成模拟历史数据
def generate_historical_data(tickers, days=365):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    dates = pd.date_range(start=start_date, end=end_date, freq='B')
    
    historical_data = {}
    
    # S&P 500 基准数据
    sp500_returns = np.random.normal(0.0003, 0.01, len(dates))
    sp500_prices = 100 * np.cumprod(1 + sp500_returns)
    historical_data['SPY'] = pd.Series(sp500_prices, index=dates)
    
    # 各股票历史数据
    for ticker in tickers:
        symbol = ticker.symbol
        beta = random.uniform(0.8, 1.2)  # 随机生成贝塔系数
        alpha = random.uniform(-0.0001, 0.0002)  # 随机生成阿尔法
        
        # 根据CAPM模型生成收益率: r = rf + beta * (rm - rf) + alpha + epsilon
        stock_returns = np.zeros(len(dates))
        for i in range(len(dates)):
            market_return = sp500_returns[i]
            noise = np.random.normal(0, 0.01)  # 随机噪声
            stock_returns[i] = alpha + beta * market_return + noise
        
        # 生成价格序列
        stock_prices = 100 * np.cumprod(1 + stock_returns)
        historical_data[symbol] = pd.Series(stock_prices, index=dates)
    
    return pd.DataFrame(historical_data)

# 获取美国国债收益率
def get_us_treasury_yield():
    """获取美国10年期国债收益率
    
    使用FRED API获取实时数据，使用本地缓存避免频繁API调用
    
    Returns:
        float: 美国10年期国债收益率，如0.0425表示4.25%
    """
    cache_file = cache_dir / "treasury_yield_cache.json"
    # 默认收益率（当API调用失败时使用）
    default_yield = 0.043  # 4.3%
    
    try:
        # 检查缓存
        if cache_file.exists():
            with open(cache_file, "r") as f:
                cache_data = json.load(f)
                # 缓存24小时有效
                if (datetime.now() - datetime.fromisoformat(cache_data["timestamp"])).total_seconds() < 86400:
                    return cache_data["yield"]
        
        # 缓存不存在或已过期，调用API
        # 这里使用FRED API (需要注册获取API密钥)
        # FRED API 10年期国债收益率的代码是 DGS10
        api_key = os.getenv("FRED_API_KEY", "")
        
        # 如果没有设置API密钥，使用Yahoo Finance替代方案
        if not api_key:
            # 使用Yahoo Finance API获取^TNX (10年期国债收益率)
            url = "https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers)
            data = response.json()
            
            if response.status_code == 200 and "chart" in data and "result" in data["chart"]:
                # 从返回结果中提取最新收益率，将百分比转换为小数
                latest_yield = data["chart"]["result"][0]["meta"]["regularMarketPrice"] / 100.0
            else:
                # 如果Yahoo Finance API也失败，使用默认值
                latest_yield = default_yield
        else:
            # 使用FRED API
            url = f"https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key={api_key}&file_type=json&sort_order=desc&limit=1"
            response = requests.get(url)
            data = response.json()
            
            if response.status_code == 200 and "observations" in data and len(data["observations"]) > 0:
                # 从返回结果中提取最新收益率，将百分比转换为小数
                latest_yield = float(data["observations"][0]["value"]) / 100.0
            else:
                # 如果API调用失败，使用默认值
                latest_yield = default_yield
        
        # 更新缓存
        with open(cache_file, "w") as f:
            json.dump({
                "yield": latest_yield,
                "timestamp": datetime.now().isoformat()
            }, f)
        
        return latest_yield
    
    except Exception as e:
        print(f"Error fetching treasury yield: {e}")
        return default_yield

# 辅助函数：计算统计数据
def calculate_statistics(historical_data, weights):
    returns = historical_data.pct_change().dropna()
    
    # 投资组合日收益率
    portfolio_returns = np.zeros(len(returns))
    for symbol, weight in weights.items():
        if symbol in returns.columns:
            portfolio_returns += returns[symbol].values * weight
    
    # 基准收益率 (使用SPY作为默认基准)
    benchmark_symbol = 'SPY'
    if benchmark_symbol in returns.columns:
        benchmark_returns = returns[benchmark_symbol].values
    else:
        # 如果没有SPY数据，使用第一个可用的股票作为基准
        for col in returns.columns:
            if col != list(weights.keys())[0]:  # 避免使用投资组合的第一个股票作为基准
                benchmark_returns = returns[col].values
                benchmark_symbol = col
                break
        else:
            # 如果没有其他股票，使用第一个股票
            benchmark_returns = returns[list(returns.columns)[0]].values
            benchmark_symbol = list(returns.columns)[0]
    
    # 计算累计回报
    cumulative_returns = np.cumprod(1 + portfolio_returns) - 1
    
    # 月度收益率
    date_index = historical_data.index
    monthly_returns = []
    
    if len(date_index) > 0:
        current_month = date_index[0].month
        current_year = date_index[0].year
        month_start_idx = 0
        
        for i, date in enumerate(date_index):
            if date.month != current_month or date.year != current_year:
                month_end_idx = i - 1
                if month_start_idx < len(portfolio_returns) and month_end_idx < len(portfolio_returns):
                    month_return = round(float((np.prod(1 + portfolio_returns[month_start_idx:month_end_idx+1]) - 1) * 100), 2)
                    monthly_returns.append({
                        "date": f"{current_year}-{current_month:02d}",
                        "return": month_return
                    })
                month_start_idx = i
                current_month = date.month
                current_year = date.year
        
        # 处理最后一个月
        if month_start_idx < len(portfolio_returns):
            month_return = round(float((np.prod(1 + portfolio_returns[month_start_idx:]) - 1) * 100), 2)
            monthly_returns.append({
                "date": f"{current_year}-{current_month:02d}",
                "return": month_return
            })
    
    # 获取无风险利率
    risk_free_rate = get_us_treasury_yield()
    
    # 统计数据
    total_return = round(float(cumulative_returns[-1] * 100), 2) if len(cumulative_returns) > 0 else 0.0
    annualized_return = round(float(((1 + total_return / 100) ** (252 / len(portfolio_returns)) - 1) * 100), 2) if len(portfolio_returns) > 0 else 0.0
    volatility = round(float(np.std(portfolio_returns) * np.sqrt(252) * 100), 2)
    positive_days = int(np.sum(portfolio_returns > 0))
    negative_days = int(np.sum(portfolio_returns < 0))
    positive_days_pct = round(float(positive_days / len(portfolio_returns) * 100), 2) if len(portfolio_returns) > 0 else 0.0
    
    # 最大回撤
    peak = np.maximum.accumulate(cumulative_returns + 1) - 1
    drawdown = (cumulative_returns + 1) / (peak + 1) - 1
    max_drawdown = round(float(np.min(drawdown) * 100), 2) if len(drawdown) > 0 else 0.0
    
    # 夏普比率
    excess_return = annualized_return - (risk_free_rate * 100)
    sharpe_ratio = round(float(excess_return / volatility), 2) if volatility > 0 else 0.0
    
    # 计算胜率（跑赢基准的天数比例）
    # 确保数组比较后转为Python原生bool，避免NumPy bool_类型问题
    win_days = np.sum([bool(x) for x in (portfolio_returns > benchmark_returns)])
    
    # 确保分母不为零
    total_days = len(portfolio_returns)
    win_rate = round(float(win_days / total_days * 100), 2) if total_days > 0 else 0.0
    
    # 收益率分布
    returns_dist = [round(float(r * 100), 2) for r in portfolio_returns]
    
    # 最佳和最差日
    best_day = round(float(np.max(portfolio_returns) * 100), 2) if len(portfolio_returns) > 0 else 0.0
    worst_day = round(float(np.min(portfolio_returns) * 100), 2) if len(portfolio_returns) > 0 else 0.0
    
    stats = {
        "totalReturn": total_return,
        "annualizedReturn": annualized_return,
        "volatility": volatility,
        "sharpeRatio": sharpe_ratio,
        "positiveDays": positive_days,
        "negativeDays": negative_days,
        "positiveDaysPercentage": positive_days_pct,
        "maxDrawdown": max_drawdown,
        "bestDay": best_day,
        "worstDay": worst_day,
        "winRate": win_rate,
        "monthlyReturns": monthly_returns,
        "returnDistribution": returns_dist,
        "cumulativeReturns": [round(float(r * 100), 2) for r in cumulative_returns]
    }
    
    return stats

# 辅助函数：计算资产配置指标
def calculate_allocation(tickers):
    # 按行业统计
    sector_allocation = {}
    for ticker in tickers:
        # 首先尝试从companies_db获取行业信息
        company_info = companies_db.get(ticker.symbol, {})
        
        # 如果公司信息中有行业信息，使用它；否则从stock_mappings.json中查找；如果都没有，使用stocks_db；最后默认为Other
        sector = (company_info.get("sector") or 
                 sector_mappings.get(ticker.symbol) or 
                 stocks_db.get(ticker.symbol, {}).get("sector", "Other"))
        
        if sector in sector_allocation:
            sector_allocation[sector] += ticker.weight * 100
        else:
            sector_allocation[sector] = ticker.weight * 100
    
    # 为未定义的股票填充默认值
    default_region = "United States"
    default_market_cap = "Large Cap"
    
    # 按地区统计
    region_allocation = {}
    for ticker in tickers:
        # 首先尝试从companies_db获取地区信息，如果没有再从regions_db查找
        company_info = companies_db.get(ticker.symbol, {})
        region = (company_info.get("region") or 
                 region_mappings.get(ticker.symbol, default_region))
        
        if region in region_allocation:
            region_allocation[region] += ticker.weight * 100
        else:
            region_allocation[region] = ticker.weight * 100
    
    # 按市值统计
    market_cap_allocation = {}
    for ticker in tickers:
        # 首先尝试从companies_db获取市值信息，如果没有再从market_cap_db查找
        company_info = companies_db.get(ticker.symbol, {})
        market_cap = (company_info.get("marketCap") or 
                     market_cap_mappings.get(ticker.symbol, default_market_cap))
        
        if market_cap in market_cap_allocation:
            market_cap_allocation[market_cap] += ticker.weight * 100
        else:
            market_cap_allocation[market_cap] = ticker.weight * 100
    
    # 四舍五入到小数点后一位
    sector_allocation = {k: round(v, 1) for k, v in sector_allocation.items()}
    region_allocation = {k: round(v, 1) for k, v in region_allocation.items()}
    market_cap_allocation = {k: round(v, 1) for k, v in market_cap_allocation.items()}
    
    return {
        'sector': [{'type': k, 'percentage': v} for k, v in sector_allocation.items()],
        'geography': [{'region': k, 'percentage': v} for k, v in region_allocation.items()],
        'marketCap': [{'type': k, 'percentage': v} for k, v in market_cap_allocation.items()]
    }

# 辅助函数：计算风险指标
def calculate_risk_metrics(historical_data, weights):
    returns = historical_data.pct_change().dropna()
    
    # 投资组合日收益率
    portfolio_returns = np.zeros(len(returns))
    for symbol, weight in weights.items():
        if symbol in returns.columns:
            portfolio_returns += returns[symbol].values * weight
    
    # 计算个股风险贡献
    risk_contribution = []
    volatility = float(np.std(portfolio_returns) * np.sqrt(252))
    
    if volatility > 0:
        for symbol, weight in weights.items():
            if symbol in returns.columns:
                # 计算资产收益率
                asset_returns = returns[symbol].values
                
                # 计算资产与投资组合的相关性
                correlation = float(np.corrcoef(asset_returns, portfolio_returns)[0, 1])
                
                # 计算资产波动率
                asset_volatility = float(np.std(asset_returns) * np.sqrt(252))
                
                # 计算风险贡献
                risk_contrib = float(weight * correlation * asset_volatility / volatility)
                
                risk_contribution.append({
                    "symbol": symbol,
                    "contribution": round(risk_contrib * 100, 2)
                })
    
    # 排序
    risk_contribution.sort(key=lambda x: x["contribution"], reverse=True)
    
    # 计算VaR (95%)
    var_95 = round(float(np.percentile(portfolio_returns, 5) * np.sqrt(1) * 100), 2)
    
    # 计算CVaR (95%)
    cvar_95 = round(float(np.mean(portfolio_returns[portfolio_returns <= np.percentile(portfolio_returns, 5)]) * 100), 2)
    
    # 计算下行风险
    downside_returns = portfolio_returns[portfolio_returns < 0]
    downside_risk = round(float(np.std(downside_returns) * np.sqrt(252) * 100), 2) if len(downside_returns) > 0 else 0.0
    
    # 计算索提诺比率
    risk_free_rate = get_us_treasury_yield()  # 使用美国国债利率
    annualized_return = round(float(np.mean(portfolio_returns) * 252 * 100), 2)
    sortino_ratio = round(float((annualized_return - risk_free_rate * 100) / downside_risk), 2) if downside_risk > 0 else 0.0
    
    # 计算最长回撤持续时间
    cumulative_returns = np.cumprod(1 + portfolio_returns) - 1
    
    if len(cumulative_returns) > 0:
        peak = np.maximum.accumulate(cumulative_returns)
        drawdown = (cumulative_returns) / peak - 1
        
        in_drawdown = drawdown < 0
        if np.any(in_drawdown):
            # 确保in_drawdown是Python布尔列表
            in_drawdown_list = [bool(x) for x in in_drawdown]
            
            # 计算回撤持续时间
            current_streak = 0
            max_streak = 0
            
            for is_drawdown in in_drawdown_list:
                if is_drawdown:
                    current_streak += 1
                    max_streak = max(max_streak, current_streak)
                else:
                    current_streak = 0
            
            longest_drawdown_days = int(max_streak)
        else:
            longest_drawdown_days = 0
    else:
        longest_drawdown_days = 0
    
    return {
        "riskContribution": risk_contribution,
        "valueAtRisk": var_95,
        "conditionalVaR": cvar_95,
        "downsideRisk": downside_risk,
        "sortinoRatio": sortino_ratio,
        "longestDrawdownDays": longest_drawdown_days
    }

# 辅助函数：计算比较指标
def calculate_comparison(historical_data, weights):
    returns = historical_data.pct_change().dropna()
    
    # 投资组合日收益率
    portfolio_returns = np.zeros(len(returns))
    for symbol, weight in weights.items():
        if symbol in returns.columns:
            portfolio_returns += returns[symbol].values * weight
    
    # 基准收益率 (使用SPY作为默认基准)
    benchmark_symbol = 'SPY'
    if benchmark_symbol in returns.columns:
        benchmark_returns = returns[benchmark_symbol].values
    else:
        # 如果没有SPY数据，使用第一个可用的股票作为基准
        for col in returns.columns:
            benchmark_returns = returns[col].values
            benchmark_symbol = col
            break
    
    # 计算年化收益率
    portfolio_annualized_return = round(float(np.mean(portfolio_returns) * 252 * 100), 2)
    benchmark_annualized_return = round(float(np.mean(benchmark_returns) * 252 * 100), 2)
    
    # 计算波动率
    portfolio_volatility = round(float(np.std(portfolio_returns) * np.sqrt(252) * 100), 2)
    benchmark_volatility = round(float(np.std(benchmark_returns) * np.sqrt(252) * 100), 2)
    
    # 计算最大回撤
    portfolio_cum_returns = np.cumprod(1 + portfolio_returns)
    portfolio_peak = np.maximum.accumulate(portfolio_cum_returns)
    portfolio_drawdown = (portfolio_cum_returns / portfolio_peak - 1) * 100
    portfolio_max_drawdown = round(float(np.min(portfolio_drawdown)), 2)
    
    benchmark_cum_returns = np.cumprod(1 + benchmark_returns)
    benchmark_peak = np.maximum.accumulate(benchmark_cum_returns)
    benchmark_drawdown = (benchmark_cum_returns / benchmark_peak - 1) * 100
    benchmark_max_drawdown = round(float(np.min(benchmark_drawdown)), 2)
    
    # 计算贝塔系数
    covariance = float(np.cov(portfolio_returns, benchmark_returns)[0, 1])
    benchmark_variance = float(np.var(benchmark_returns))
    beta = round(float(covariance / benchmark_variance if benchmark_variance > 0 else 1.0), 2)
    
    # 计算alpha (Jensen's Alpha)
    risk_free_rate = get_us_treasury_yield() / 252  # 每日无风险利率
    expected_return = risk_free_rate + beta * (np.mean(benchmark_returns) - risk_free_rate)
    alpha = round(float((np.mean(portfolio_returns) - expected_return) * 252 * 100), 2)
    
    # 计算信息比率
    tracking_error = round(float(np.std(portfolio_returns - benchmark_returns) * np.sqrt(252) * 100), 2)
    information_ratio = round(float((portfolio_annualized_return - benchmark_annualized_return) / tracking_error if tracking_error > 0 else 0.0), 2)
    
    # 计算相关性
    correlation = round(float(np.corrcoef(portfolio_returns, benchmark_returns)[0, 1]), 2)
    
    # 计算胜率（跑赢基准的天数比例）
    # 确保数组比较后转为Python原生bool，避免NumPy bool_类型问题
    win_days = np.sum([bool(x) for x in (portfolio_returns > benchmark_returns)])
    
    # 确保分母不为零
    total_days = len(portfolio_returns)
    if total_days > 0:
        win_rate = round(float(win_days / total_days * 100), 2)
    else:
        win_rate = 0.0
    
    comparison_data = {
        "portfolioReturn": portfolio_annualized_return,
        "benchmarkReturn": benchmark_annualized_return,
        "portfolioVolatility": portfolio_volatility,
        "benchmarkVolatility": benchmark_volatility,
        "portfolioMaxDrawdown": portfolio_max_drawdown,
        "benchmarkMaxDrawdown": benchmark_max_drawdown,
        "alpha": alpha,
        "beta": beta,
        "informationRatio": information_ratio,
        "correlation": correlation,
        "winRate": win_rate,
        "benchmarkSymbol": benchmark_symbol,
        "outperformance": bool(portfolio_annualized_return > benchmark_annualized_return),
        "lowerVolatility": bool(portfolio_volatility < benchmark_volatility),
        "lowerDrawdown": bool(abs(portfolio_max_drawdown) < abs(benchmark_max_drawdown))
    }
    
    return comparison_data

# 辅助函数：计算因子暴露
def calculate_factor_exposure(tickers, benchmark_tickers=None):
    """
    计算投资组合的因子暴露度
    
    Args:
        tickers: 投资组合的股票列表
        benchmark_tickers: 基准投资组合的股票列表，默认为None
        
    Returns:
        Dict: 包含投资组合因子暴露的数据
    """
    # 获取股票代码列表
    ticker_list = [t.symbol for t in tickers]
    weights = {t.symbol: t.weight for t in tickers}
    
    # 尝试从utils.market_data导入的函数获取真实的因子暴露数据
    try:
        from ..utils.market_data import get_portfolio_factor_exposure
        # 使用实际函数计算因子暴露
        factor_exposure_data = get_portfolio_factor_exposure(tickers)
        
        # 如果函数返回数据为空或出错，使用备用模拟数据
        if not factor_exposure_data:
            raise ValueError("Factor exposure data is empty")
            
        return factor_exposure_data
    except Exception as e:
        print(f"Error calculating factor exposure: {e}")
        
        # 备用方案：使用模拟数据
        # 风格因子暴露
        style_factors = [
            {"name": "Momentum Factor", "portfolio_exposure": 0.68, "benchmark_exposure": 0.45, "difference": 0.23},
            {"name": "Value Factor", "portfolio_exposure": 0.32, "benchmark_exposure": 0.55, "difference": -0.23},
            {"name": "Size Factor", "portfolio_exposure": -0.15, "benchmark_exposure": 0.10, "difference": -0.25},
            {"name": "Volatility Factor", "portfolio_exposure": -0.25, "benchmark_exposure": -0.15, "difference": -0.10},
            {"name": "Quality Factor", "portfolio_exposure": 0.85, "benchmark_exposure": 0.60, "difference": 0.25}
        ]
        
        # 模拟数据：宏观暴露
        macro_factors = [
            {"name": "Economic Growth", "portfolio_exposure": 1.32, "benchmark_exposure": 1.0, "difference": 0.32},
            {"name": "Inflation", "portfolio_exposure": -0.45, "benchmark_exposure": -0.2, "difference": -0.25},
            {"name": "Interest Rate Risk", "portfolio_exposure": 0.78, "benchmark_exposure": 0.5, "difference": 0.28},
            {"name": "Credit Risk", "portfolio_exposure": 0.41, "benchmark_exposure": 0.3, "difference": 0.11},
            {"name": "Emerging Markets", "portfolio_exposure": 0.66, "benchmark_exposure": 0.4, "difference": 0.26}
        ]
        
        return {
            "styleFactors": style_factors,
            "macroFactors": macro_factors
        }

# API端点：创建投资组合
@router.post("/portfolios", response_model=PortfolioResponse)
async def create_portfolio(portfolio: Portfolio):
    # 验证所有权重总和是否接近1
    total_weight = sum(ticker.weight for ticker in portfolio.tickers)
    if abs(total_weight - 1) > 0.01:
        raise HTTPException(status_code=400, detail=f"The sum of weights must be 1, current sum is {total_weight}")
    
    # 获取股票的额外信息
    enriched_tickers = []
    for ticker in portfolio.tickers:
        # 首先尝试从companies_db获取信息
        company_info = companies_db.get(ticker.symbol, {})
        stock_info = stocks_db.get(ticker.symbol, {})
        
        enriched_tickers.append(
            Ticker(
                symbol=ticker.symbol,
                weight=ticker.weight,
                name=company_info.get("name") or stock_info.get("name", ticker.symbol),
                sector=company_info.get("sector") or stock_info.get("sector", "Unknown"),
                price=stock_info.get("price"),
                change=stock_info.get("change")
            )
        )
    
    # 创建投资组合
    portfolio_id = f"port-{len(portfolios_db) + 1}"
    portfolio_data = {
        "id": portfolio_id,
        "name": portfolio.name,
        "created_at": datetime.now().isoformat(),
        "tickers": enriched_tickers
    }
    
    portfolios_db[portfolio_id] = portfolio_data
    
    # 保存到文件
    save_portfolios()
    
    return portfolio_data

@router.get("/stocks-data", response_model=Dict[str, Dict[str, Any]])
async def get_stocks_data():
    """返回所有股票的详细数据"""
    return stocks_db

@router.get("/mock-portfolio-analysis")
async def get_mock_portfolio_analysis():
    """返回模拟的投资组合分析数据，用于前端测试"""
    return {
        "performance": {
            "totalReturn": 15.7,
            "annualizedReturn": 12.3,
            "volatility": 12.5,
            "sharpeRatio": 1.42,
            "maxDrawdown": -8.5,
            "winRate": 58.2,
            "monthlyReturns": [
                { "month": "January", "return": 3.2 },
                { "month": "February", "return": -1.8 },
                { "month": "March", "return": 2.1 },
                { "month": "April", "return": 4.5 },
                { "month": "May", "return": -0.7 },
                { "month": "June", "return": 2.9 }
            ]
        },
        "allocation": {
            "sector": [
                { "type": "Technology", "percentage": 32.5 },
                { "type": "Healthcare", "percentage": 15.8 },
                { "type": "Financials", "percentage": 12.3 },
                { "type": "Consumer", "percentage": 10.5 },
                { "type": "Communication", "percentage": 8.7 },
                { "type": "Industrials", "percentage": 7.9 },
                { "type": "Energy", "percentage": 5.3 },
                { "type": "Materials", "percentage": 4.2 },
                { "type": "Utilities", "percentage": 2.8 }
            ],
            "geography": [
                { "region": "United States", "percentage": 45.7 },
                { "region": "China", "percentage": 21.5 },
                { "region": "Europe", "percentage": 15.8 },
                { "region": "Japan", "percentage": 7.3 },
                { "region": "Emerging Markets", "percentage": 9.7 }
            ]
        },
        "risk": [
            { "name": "Volatility", "value": "12.5%", "status": "medium", "percentage": 60 },
            { "name": "Max Drawdown", "value": "-8.5%", "status": "low", "percentage": 40 },
            { "name": "Downside Risk", "value": "12.3%", "status": "medium", "percentage": 55 },
            { "name": "Beta", "value": "0.85", "status": "high", "percentage": 75 },
            { "name": "VaR (95%)", "value": "-2.8%", "status": "low", "percentage": 30 },
            { "name": "Sharpe Ratio", "value": "1.42", "status": "medium", "percentage": 65 }
        ],
        "comparison": [
            { "metric": "Annualized Return", "portfolio": "12.3%", "benchmark": "10.2%", "difference": "+2.1%", "positive": True },
            { "metric": "Sharpe Ratio", "portfolio": "1.42", "benchmark": "0.9", "difference": "+0.52", "positive": True },
            { "metric": "Max Drawdown", "portfolio": "-8.5%", "benchmark": "-18.2%", "difference": "+9.7%", "positive": True },
            { "metric": "Volatility", "portfolio": "12.5%", "benchmark": "16.4%", "difference": "+3.9%", "positive": False },
            { "metric": "Beta", "portfolio": "0.85", "benchmark": "1.00", "difference": "+0.15", "positive": False },
            { "metric": "Alpha (annualized)", "portfolio": "2.1%", "benchmark": "0.0%", "difference": "+2.1%", "positive": True }
        ],
        "factors": {
            "styleFactors": [
                { "name": "Size", "exposure": 0.85, "positive": True },
                { "name": "Value", "exposure": -0.32, "positive": False },
                { "name": "Momentum", "exposure": 1.27, "positive": True },
                { "name": "Quality", "exposure": 0.53, "positive": True },
                { "name": "Volatility", "exposure": -0.21, "positive": False }
            ],
            "macroFactors": [
                { "name": "Economic Growth", "exposure": 1.32, "positive": True },
                { "name": "Inflation", "exposure": -0.45, "positive": False },
                { "name": "Interest Rate Risk", "exposure": 0.78, "positive": True },
                { "name": "Credit Risk", "exposure": 0.41, "positive": True },
                { "name": "Emerging Markets", "exposure": 0.66, "positive": True }
            ]
        }
    }

@router.get("/portfolios", response_model=List[PortfolioResponse])
async def get_portfolios():
    """获取所有投资组合"""
    return list(portfolios_db.values())

@router.get("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(portfolio_id: str):
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolios_db[portfolio_id]

@router.get("/portfolios/{portfolio_id}/analyze", response_model=PortfolioAnalysis)
async def analyze_portfolio(portfolio_id: str):
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    portfolio = portfolios_db[portfolio_id]
    tickers = portfolio["tickers"]
    
    # 准备权重字典
    weights = {ticker.symbol: ticker.weight for ticker in tickers}
    
    # 生成历史数据
    historical_data = generate_historical_data(tickers)
    
    # 计算各个分析指标
    performance = calculate_statistics(historical_data, weights)
    allocation = calculate_allocation(tickers)
    
    # 获取风险指标和比较指标（这些返回字典）
    risk_data = calculate_risk_metrics(historical_data, weights)
    comparison_data = calculate_comparison(historical_data, weights)
    
    # 转换风险指标为列表格式
    risk_list = [
        {"name": "Value at Risk (95%)", "value": f"{risk_data['valueAtRisk']:.2f}%", "status": "medium", "percentage": 50},
        {"name": "Conditional VaR", "value": f"{risk_data['conditionalVaR']:.2f}%", "status": "medium", "percentage": 55},
        {"name": "Downside Risk", "value": f"{risk_data['downsideRisk']:.2f}%", "status": "medium", "percentage": 60},
        {"name": "Sortino Ratio", "value": f"{risk_data['sortinoRatio']:.2f}", "status": "medium", "percentage": 65},
        {"name": "Longest Drawdown Period", "value": f"{risk_data['longestDrawdownDays']} days", "status": "medium", "percentage": 70}
    ]
    
    # 添加风险贡献（如果有）
    if risk_data["riskContribution"]:
        for item in risk_data["riskContribution"][:3]:  # 只包含前三个
            risk_list.append({
                "name": f"{item['symbol']} Risk Contribution", 
                "value": f"{item['contribution']:.2f}%", 
                "status": "medium", 
                "percentage": 50
            })
    
    # 转换比较指标为列表格式
    comparison_list = [
        {"metric": "Annualized Return", "portfolio": f"{comparison_data['portfolioReturn']:.2f}%", "benchmark": f"{comparison_data['benchmarkReturn']:.2f}%", "difference": f"{comparison_data['portfolioReturn'] - comparison_data['benchmarkReturn']:.2f}%", "positive": comparison_data['outperformance']},
        {"metric": "Volatility", "portfolio": f"{comparison_data['portfolioVolatility']:.2f}%", "benchmark": f"{comparison_data['benchmarkVolatility']:.2f}%", "difference": f"{comparison_data['benchmarkVolatility'] - comparison_data['portfolioVolatility']:.2f}%", "positive": comparison_data['lowerVolatility']},
        {"metric": "Max Drawdown", "portfolio": f"{comparison_data['portfolioMaxDrawdown']:.2f}%", "benchmark": f"{comparison_data['benchmarkMaxDrawdown']:.2f}%", "difference": f"{abs(comparison_data['portfolioMaxDrawdown']) - abs(comparison_data['benchmarkMaxDrawdown']):.2f}%", "positive": comparison_data['lowerDrawdown']},
        {"metric": "Alpha", "portfolio": f"{comparison_data['alpha']:.2f}%", "benchmark": "0.00%", "difference": f"{comparison_data['alpha']:.2f}%", "positive": comparison_data['alpha'] > 0},
        {"metric": "Beta", "portfolio": f"{comparison_data['beta']:.2f}", "benchmark": "1.00", "difference": f"{comparison_data['beta'] - 1:.2f}", "positive": comparison_data['beta'] < 1},
        {"metric": "Information Ratio", "portfolio": f"{comparison_data['informationRatio']:.2f}", "benchmark": "0.00", "difference": f"{comparison_data['informationRatio']:.2f}", "positive": comparison_data['informationRatio'] > 0}
    ]
    
    # 获取因子暴露数据
    factors = calculate_factor_exposure(tickers)
    
    return {
        "performance": performance,
        "allocation": allocation,
        "risk": risk_list,
        "comparison": comparison_list,
        "factors": factors
    }

@router.get("/portfolio/{portfolio_id}/comparison")
async def get_portfolio_comparison(portfolio_id: str):
    """获取投资组合与基准的比较结果"""
    # 在实际应用中，应该从数据库中获取指定ID的投资组合
    # 这里为示例，使用一个模拟的投资组合
    mock_portfolio = {
        "name": "示例投资组合",
        "tickers": [
            {"symbol": "AAPL", "weight": 0.4},
            {"symbol": "MSFT", "weight": 0.3},
            {"symbol": "GOOGL", "weight": 0.2},
            {"symbol": "AMZN", "weight": 0.1}
        ]
    }
    
    # 将字典转换为Ticker对象列表
    tickers = [
        Ticker(
            symbol=t["symbol"],
            weight=t["weight"]
        )
        for t in mock_portfolio["tickers"]
    ]
    
    # 使用市场数据工具进行比较
    comparison_result = compare_with_benchmark(tickers)
    
    return {
        "portfolio_id": portfolio_id,
        "comparison": comparison_result
    }

@router.get("/portfolio/{portfolio_id}/allocation")
async def get_portfolio_allocation(portfolio_id: str):
    """获取投资组合的资产配置分布"""
    # 检查portfolio_id是否存在
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # 获取实际的投资组合数据
    portfolio = portfolios_db[portfolio_id]
    tickers = portfolio["tickers"]
    
    # 确保tickers是Ticker对象列表
    if not all(isinstance(t, Ticker) for t in tickers):
        # 如果不是，创建Ticker对象列表
        from ..models.portfolio import Ticker as ModelTicker
        ticker_objects = [
            ModelTicker(
                symbol=t["symbol"] if isinstance(t, dict) else t.symbol,
                weight=t["weight"] if isinstance(t, dict) else t.weight,
                name=t.get("name", "") if isinstance(t, dict) else getattr(t, "name", ""),
                sector=t.get("sector", "") if isinstance(t, dict) else getattr(t, "sector", "")
            )
            for t in tickers
        ]
    else:
        ticker_objects = tickers
    
    # 使用calculate_allocation函数获取资产配置
    allocation_result = calculate_allocation(ticker_objects)
    
    # 转换为前端期望的格式
    frontend_allocation = {
        "sectorDistribution": {item["type"]: item["percentage"] for item in allocation_result["sector"]},
        "regionDistribution": {item["region"]: item["percentage"] for item in allocation_result["geography"]},
        "marketCapDistribution": {item["type"]: item["percentage"] for item in allocation_result["marketCap"]}
    }
    
    return {
        "portfolio_id": portfolio_id,
        "allocation": frontend_allocation
    }

@router.get("/available-stocks")
async def get_available_stocks():
    """获取所有可用的股票代码和名称"""
    result = []
    for symbol, data in stocks_db.items():
        result.append({
            "symbol": symbol,
            "name": data.get("name", ""),
            "sector": data.get("sector", ""),
            "price": data.get("price", 0),
            "change": data.get("change", 0)
        })
    return result

@router.post("/mock-analyze")
async def mock_analyze_portfolio(portfolio: Portfolio):
    """分析投资组合 - 使用真实数据集

    Args:
        portfolio (Portfolio): 投资组合数据

    Returns:
        dict: 分析结果
    """
    try:
        # 转换tickers对象到请求格式
        tickers = [
            Ticker(
                symbol=ticker.symbol,
                weight=ticker.weight,
                name=stock_name_mapping.get(ticker.symbol, stocks_db.get(ticker.symbol, {}).get("name", "")),
                sector=stocks_db.get(ticker.symbol, {}).get("sector", "未分类"),
                price=stocks_db.get(ticker.symbol, {}).get("price", 0),
                change=stocks_db.get(ticker.symbol, {}).get("change", 0)
            )
            for ticker in portfolio.tickers
        ]
        
        # 使用实际数据计算各项指标
        from ..utils.market_data import (
            get_portfolio_returns, 
            compare_with_benchmark,
            get_asset_allocation
        )
        
        # 计算资产配置
        allocation_data = get_asset_allocation(tickers)
        
        # 计算与基准的对比（包含不同时间段）
        comparison_data = compare_with_benchmark(tickers)
        
        # 计算投资组合收益率（包含不同时间段）
        returns_data = get_portfolio_returns(
            tickers, 
            {ticker.symbol: ticker.weight for ticker in tickers},
            include_timeframes=True
        )
        
        # 提取不同时间段数据
        timeframes_data = returns_data.get('timeFrames', {})
        
        # 补充timeframes_data中的基准比较数据
        if 'timeFrames' in comparison_data:
            for time_frame, data in comparison_data['timeFrames'].items():
                if time_frame in timeframes_data and timeframes_data[time_frame] is not None:
                    if data:
                        if 'return' in data:
                            timeframes_data[time_frame]['benchmarkReturn'] = data['return']['benchmark']
                            timeframes_data[time_frame]['excessReturn'] = data['return']['excess']
        
        # 计算因子暴露 - 使用新的实时计算函数
        factor_exposure = calculate_factor_exposure(tickers)
        
        # 构建响应数据
        response = {
            "portfolio": {
                "id": f"mock-{portfolio.name.lower().replace(' ', '-')}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "name": portfolio.name,
                "tickers": [ticker.dict() for ticker in tickers]
            },
            "analysis": {
                "performance": {
                    "totalReturn": comparison_data["totalReturn"]["portfolio"],
                    "annualizedReturn": comparison_data["annualizedReturn"]["portfolio"],
                    "sharpeRatio": comparison_data["sharpeRatio"]["portfolio"],
                    "maxDrawdown": comparison_data["maxDrawdown"]["portfolio"],
                    "volatility": comparison_data["volatility"]["portfolio"],
                    "winRate": comparison_data["winRate"],
                    "monthlyReturns": [
                        {"month": "January", "return": 2.3},
                        {"month": "February", "return": -0.7},
                        {"month": "March", "return": 1.5},
                        {"month": "April", "return": 3.2},
                        {"month": "May", "return": 0.8},
                        {"month": "June", "return": 1.9}
                    ],
                    "timeFrames": timeframes_data
                },
                "allocation": allocation_data,
                "risk": [
                    {"name": "Volatility", "value": f"{comparison_data['volatility']['portfolio']}%", "status": "medium", "percentage": 60},
                    {"name": "Max Drawdown", "value": f"{comparison_data['maxDrawdown']['portfolio']}%", "status": "low", "percentage": 40},
                    {"name": "Downside Risk", "value": "12.3%", "status": "medium", "percentage": 55},
                    {"name": "Beta", "value": "0.85", "status": "high", "percentage": 75},
                    {"name": "VaR (95%)", "value": "-2.8%", "status": "low", "percentage": 30},
                    {"name": "Sharpe Ratio", "value": f"{comparison_data['sharpeRatio']['portfolio']}", "status": "medium", "percentage": 65}
                ],
                "comparison": [
                    {"metric": "Annualized Return", "portfolio": f"{comparison_data['annualizedReturn']['portfolio']}%", "benchmark": f"{comparison_data['annualizedReturn']['benchmark']}%", "difference": f"{comparison_data['annualizedReturn']['excess']}%", "positive": comparison_data['annualizedReturn']['excess'] > 0},
                    {"metric": "Sharpe Ratio", "portfolio": f"{comparison_data['sharpeRatio']['portfolio']}", "benchmark": f"{comparison_data['sharpeRatio']['benchmark']}", "difference": f"{comparison_data['sharpeRatio']['difference']}", "positive": comparison_data['sharpeRatio']['difference'] > 0},
                    {"metric": "Max Drawdown", "portfolio": f"{comparison_data['maxDrawdown']['portfolio']}%", "benchmark": f"{comparison_data['maxDrawdown']['benchmark']}%", "difference": f"{comparison_data['maxDrawdown']['difference']}%", "positive": comparison_data['maxDrawdown']['difference'] > 0},
                    {"metric": "Volatility", "portfolio": f"{comparison_data['volatility']['portfolio']}%", "benchmark": f"{comparison_data['volatility']['benchmark']}%", "difference": f"{comparison_data['volatility']['difference']}%", "positive": comparison_data['volatility']['difference'] < 0},
                    {"metric": "Beta", "portfolio": "0.85", "benchmark": "1.00", "difference": "-0.15", "positive": False},
                    {"metric": "Alpha (annualized)", "portfolio": "2.1%", "benchmark": "0.0%", "difference": "+2.1%", "positive": True}
                ],
                "factors": factor_exposure,
                "timeFrames": comparison_data.get('timeFrames', {})
            }
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"投资组合分析失败: {str(e)}")

@router.get("/chat/{chat_id}/portfolio-analysis")
async def get_chat_portfolio_analysis(chat_id: str):
    """获取与聊天相关的投资组合分析数据"""
    # 这里直接返回模拟数据
    return await get_mock_portfolio_analysis()

@router.delete("/portfolios/{portfolio_id}")
async def delete_portfolio(portfolio_id: str):
    """删除指定的投资组合"""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # 删除投资组合
    del portfolios_db[portfolio_id]
    
    # 保存更改
    save_portfolios()
    
    return {"message": "Portfolio deleted successfully"}

@router.put("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(portfolio_id: str, portfolio: Portfolio):
    """更新现有投资组合"""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # 验证所有权重总和是否接近1
    total_weight = sum(ticker.weight for ticker in portfolio.tickers)
    if abs(total_weight - 1) > 0.01:
        raise HTTPException(status_code=400, detail=f"The sum of weights must be 1, current sum is {total_weight}")
    
    # 获取股票的额外信息
    enriched_tickers = []
    for ticker in portfolio.tickers:
        # 首先尝试从companies_db获取信息
        company_info = companies_db.get(ticker.symbol, {})
        stock_info = stocks_db.get(ticker.symbol, {})
        
        enriched_tickers.append(
            Ticker(
                symbol=ticker.symbol,
                weight=ticker.weight,
                name=company_info.get("name") or stock_info.get("name", ticker.symbol),
                sector=company_info.get("sector") or stock_info.get("sector", "Unknown"),
                price=stock_info.get("price"),
                change=stock_info.get("change")
            )
        )
    
    # 更新投资组合
    portfolios_db[portfolio_id].update({
        "name": portfolio.name,
        "tickers": enriched_tickers,
        "updated_at": datetime.now().isoformat()
    })
    
    # 保存更改
    save_portfolios()
    
    return portfolios_db[portfolio_id]

@router.get("/test-spy-data")
async def test_spy_data():
    """测试YFinance获取SPY数据"""
    from ..utils.market_data import get_spy_data
    from datetime import datetime, timedelta
    
    # 获取过去5年的SPY数据
    today = datetime.now()
    five_years_ago = today - timedelta(days=365*5)
    
    try:
        spy_data = get_spy_data(five_years_ago, today)
        
        # 检查数据是否正常获取
        if not spy_data.empty:
            # 返回基本统计信息
            return {
                "status": "success",
                "message": "成功获取SPY数据",
                "data_points": len(spy_data),
                "date_range": f"{spy_data.index.min()} 至 {spy_data.index.max()}",
                "recent_values": spy_data.tail(5).to_dict(),
                "statistics": {
                    "mean": float(spy_data.mean()),
                    "min": float(spy_data.min()),
                    "max": float(spy_data.max()),
                    "std": float(spy_data.std())
                }
            }
        else:
            return {
                "status": "error",
                "message": "SPY数据为空",
                "data_points": 0
            }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"获取SPY数据失败: {str(e)}",
            "error": str(e)
        } 