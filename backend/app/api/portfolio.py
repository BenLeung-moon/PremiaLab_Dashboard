from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
from ..utils.market_data import (
    get_portfolio_returns, 
    get_portfolio_factor_exposure, 
    compare_with_benchmark,
    get_asset_allocation
)

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
    risk: Dict[str, Any]
    comparison: Dict[str, Any]
    factors: Dict[str, Any]

# 模拟数据库
portfolios_db = {}

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

# 辅助函数：生成模拟历史数据
def generate_historical_data(tickers, days=30):
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

# 辅助函数：计算投资组合绩效指标
def calculate_performance_metrics(historical_data, weights):
    returns = historical_data.pct_change().dropna()
    
    # 投资组合日收益率
    portfolio_returns = np.zeros(len(returns))
    for i, (symbol, weight) in enumerate(weights.items()):
        if symbol in returns.columns:
            portfolio_returns += returns[symbol].values * weight
    
    # 基准收益率 (S&P 500)
    benchmark_returns = returns['SPY'].values
    
    # 计算主要绩效指标
    total_return = (np.prod(1 + portfolio_returns) - 1) * 100
    annualized_return = ((1 + total_return / 100) ** (252 / len(portfolio_returns)) - 1) * 100
    volatility = np.std(portfolio_returns) * np.sqrt(252) * 100
    sharpe_ratio = annualized_return / volatility if volatility > 0 else 0
    
    # 计算最大回撤
    cumulative_returns = np.cumprod(1 + portfolio_returns)
    running_max = np.maximum.accumulate(cumulative_returns)
    drawdowns = (cumulative_returns / running_max - 1) * 100
    max_drawdown = np.min(drawdowns)
    
    # 计算胜率 (相对于基准的表现)
    win_rate = np.mean(portfolio_returns > benchmark_returns) * 100
    
    # 计算月度收益
    monthly_returns = []
    today = datetime.now()
    for i in range(6):
        month = today.month - i - 1
        year = today.year
        if month <= 0:
            month += 12
            year -= 1
        
        month_name = ['一月', '二月', '三月', '四月', '五月', '六月', 
                      '七月', '八月', '九月', '十月', '十一月', '十二月'][month - 1]
        monthly_returns.append({
            'month': month_name,
            'return': random.uniform(-3, 5)  # 模拟月度收益
        })
    
    return {
        'totalReturn': round(total_return, 1),
        'annualizedReturn': round(annualized_return, 1),
        'volatility': round(volatility, 1),
        'sharpeRatio': round(sharpe_ratio, 1),
        'maxDrawdown': round(max_drawdown, 1),
        'winRate': round(win_rate, 1),
        'monthlyReturns': monthly_returns
    }

# 辅助函数：计算资产配置指标
def calculate_allocation(tickers):
    # 按行业统计
    sector_allocation = {}
    for ticker in tickers:
        sector = stocks_db.get(ticker.symbol, {}).get("sector", "Other")
        if sector in sector_allocation:
            sector_allocation[sector] += ticker.weight * 100
        else:
            sector_allocation[sector] = ticker.weight * 100
    
    # 按地区统计 (模拟数据)
    geography_allocation = {
        "美国": 70,
        "中国": 15,
        "欧洲": 10,
        "其他": 5
    }
    
    return {
        'sector': [{'type': k, 'percentage': round(v, 1)} for k, v in sector_allocation.items()],
        'geography': [{'region': k, 'percentage': v} for k, v in geography_allocation.items()]
    }

# 辅助函数：计算风险指标
def calculate_risk_metrics(historical_data, weights):
    returns = historical_data.pct_change().dropna()
    
    # 投资组合日收益率
    portfolio_returns = np.zeros(len(returns))
    for i, (symbol, weight) in enumerate(weights.items()):
        if symbol in returns.columns:
            portfolio_returns += returns[symbol].values * weight
    
    # 基准收益率 (S&P 500)
    benchmark_returns = returns['SPY'].values
    
    # 计算主要风险指标
    volatility = np.std(portfolio_returns) * np.sqrt(252) * 100
    
    # 计算最大回撤
    cumulative_returns = np.cumprod(1 + portfolio_returns)
    running_max = np.maximum.accumulate(cumulative_returns)
    drawdowns = (cumulative_returns / running_max - 1) * 100
    max_drawdown = np.min(drawdowns)
    
    # 计算下行风险
    downside_returns = portfolio_returns[portfolio_returns < 0]
    downside_risk = np.std(downside_returns) * np.sqrt(252) * 100 if len(downside_returns) > 0 else 0
    
    # 计算贝塔系数
    covariance = np.cov(portfolio_returns, benchmark_returns)[0, 1]
    benchmark_variance = np.var(benchmark_returns)
    beta = covariance / benchmark_variance if benchmark_variance > 0 else 1
    
    # 计算VaR (95%)
    var_95 = np.percentile(portfolio_returns, 5) * 100
    
    # 计算夏普比率
    annualized_return = np.mean(portfolio_returns) * 252 * 100
    sharpe_ratio = annualized_return / volatility if volatility > 0 else 0
    
    risk_data = [
        {"name": "波动率", "value": f"{round(volatility, 1)}%", "status": "medium", "percentage": 60},
        {"name": "最大回撤", "value": f"{round(max_drawdown, 1)}%", "status": "low", "percentage": 40},
        {"name": "下行风险", "value": f"{round(downside_risk, 1)}%", "status": "medium", "percentage": 55},
        {"name": "贝塔系数", "value": f"{round(beta, 2)}", "status": "high", "percentage": 75},
        {"name": "VaR (95%)", "value": f"{round(var_95, 1)}%", "status": "low", "percentage": 30},
        {"name": "夏普比率", "value": f"{round(sharpe_ratio, 1)}", "status": "medium", "percentage": 65}
    ]
    
    return risk_data

# 辅助函数：计算与基准的比较
def calculate_comparison(historical_data, weights):
    returns = historical_data.pct_change().dropna()
    
    # 投资组合日收益率
    portfolio_returns = np.zeros(len(returns))
    for i, (symbol, weight) in enumerate(weights.items()):
        if symbol in returns.columns:
            portfolio_returns += returns[symbol].values * weight
    
    # 基准收益率 (S&P 500)
    benchmark_returns = returns['SPY'].values
    
    # 计算主要绩效指标
    portfolio_total_return = (np.prod(1 + portfolio_returns) - 1) * 100
    benchmark_total_return = (np.prod(1 + benchmark_returns) - 1) * 100
    
    portfolio_annualized_return = ((1 + portfolio_total_return / 100) ** (252 / len(portfolio_returns)) - 1) * 100
    benchmark_annualized_return = ((1 + benchmark_total_return / 100) ** (252 / len(benchmark_returns)) - 1) * 100
    
    portfolio_volatility = np.std(portfolio_returns) * np.sqrt(252) * 100
    benchmark_volatility = np.std(benchmark_returns) * np.sqrt(252) * 100
    
    portfolio_sharpe = portfolio_annualized_return / portfolio_volatility if portfolio_volatility > 0 else 0
    benchmark_sharpe = benchmark_annualized_return / benchmark_volatility if benchmark_volatility > 0 else 0
    
    # 计算最大回撤
    portfolio_cumulative = np.cumprod(1 + portfolio_returns)
    portfolio_running_max = np.maximum.accumulate(portfolio_cumulative)
    portfolio_drawdowns = (portfolio_cumulative / portfolio_running_max - 1) * 100
    portfolio_max_drawdown = np.min(portfolio_drawdowns)
    
    benchmark_cumulative = np.cumprod(1 + benchmark_returns)
    benchmark_running_max = np.maximum.accumulate(benchmark_cumulative)
    benchmark_drawdowns = (benchmark_cumulative / benchmark_running_max - 1) * 100
    benchmark_max_drawdown = np.min(benchmark_drawdowns)
    
    # 计算贝塔系数
    covariance = np.cov(portfolio_returns, benchmark_returns)[0, 1]
    benchmark_variance = np.var(benchmark_returns)
    beta = covariance / benchmark_variance if benchmark_variance > 0 else 1
    
    # 计算阿尔法
    risk_free_rate = 0.01 / 252  # 假设无风险利率为年化1%
    portfolio_mean_return = np.mean(portfolio_returns)
    benchmark_mean_return = np.mean(benchmark_returns)
    alpha = ((portfolio_mean_return - risk_free_rate) - beta * (benchmark_mean_return - risk_free_rate)) * 252 * 100
    
    comparison_data = [
        {
            "metric": "年化收益率",
            "portfolio": f"{round(portfolio_annualized_return, 1)}%",
            "benchmark": f"{round(benchmark_annualized_return, 1)}%",
            "difference": f"{'+' if portfolio_annualized_return > benchmark_annualized_return else ''}{round(portfolio_annualized_return - benchmark_annualized_return, 1)}%",
            "positive": portfolio_annualized_return > benchmark_annualized_return
        },
        {
            "metric": "夏普比率",
            "portfolio": f"{round(portfolio_sharpe, 1)}",
            "benchmark": f"{round(benchmark_sharpe, 1)}",
            "difference": f"{'+' if portfolio_sharpe > benchmark_sharpe else ''}{round(portfolio_sharpe - benchmark_sharpe, 1)}",
            "positive": portfolio_sharpe > benchmark_sharpe
        },
        {
            "metric": "最大回撤",
            "portfolio": f"{round(portfolio_max_drawdown, 1)}%",
            "benchmark": f"{round(benchmark_max_drawdown, 1)}%",
            "difference": f"{'+' if portfolio_max_drawdown > benchmark_max_drawdown else ''}{round(portfolio_max_drawdown - benchmark_max_drawdown, 1)}%",
            "positive": portfolio_max_drawdown > benchmark_max_drawdown
        },
        {
            "metric": "波动率",
            "portfolio": f"{round(portfolio_volatility, 1)}%",
            "benchmark": f"{round(benchmark_volatility, 1)}%",
            "difference": f"{'+' if portfolio_volatility > benchmark_volatility else ''}{round(portfolio_volatility - benchmark_volatility, 1)}%",
            "positive": portfolio_volatility < benchmark_volatility
        },
        {
            "metric": "贝塔系数",
            "portfolio": f"{round(beta, 2)}",
            "benchmark": "1.00",
            "difference": f"{'+' if beta > 1 else ''}{round(beta - 1, 2)}",
            "positive": beta < 1
        },
        {
            "metric": "年化α值",
            "portfolio": f"{round(alpha, 1)}%",
            "benchmark": "0.0%",
            "difference": f"{'+' if alpha > 0 else ''}{round(alpha, 1)}%",
            "positive": alpha > 0
        }
    ]
    
    return comparison_data

# 辅助函数：计算因子暴露
def calculate_factor_exposure():
    # 模拟数据：风格因子暴露
    style_factors = [
        {"name": "价值", "exposure": 0.65, "positive": True},
        {"name": "成长", "exposure": 0.42, "positive": True},
        {"name": "规模", "exposure": -0.28, "positive": False},
        {"name": "动量", "exposure": 0.36, "positive": True},
        {"name": "质量", "exposure": 0.72, "positive": True},
        {"name": "波动性", "exposure": -0.18, "positive": False}
    ]
    
    # 模拟数据：宏观暴露
    macro_factors = [
        {"name": "货币政策", "exposure": 0.22, "positive": True},
        {"name": "信贷环境", "exposure": 0.31, "positive": True},
        {"name": "经济增长", "exposure": 0.58, "positive": True},
        {"name": "通货膨胀", "exposure": -0.17, "positive": False},
        {"name": "利率变化", "exposure": -0.25, "positive": False},
        {"name": "能源价格", "exposure": 0.12, "positive": True}
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
        raise HTTPException(status_code=400, detail=f"权重总和必须为1，当前总和为{total_weight}")
    
    # 获取股票的额外信息
    enriched_tickers = []
    for ticker in portfolio.tickers:
        stock_info = stocks_db.get(ticker.symbol, {})
        enriched_tickers.append(
            Ticker(
                symbol=ticker.symbol,
                weight=ticker.weight,
                name=stock_info.get("name", ticker.symbol),
                sector=stock_info.get("sector", "Unknown"),
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
                { "month": "一月", "return": 3.2 },
                { "month": "二月", "return": -1.8 },
                { "month": "三月", "return": 2.1 },
                { "month": "四月", "return": 4.5 },
                { "month": "五月", "return": -0.7 },
                { "month": "六月", "return": 2.9 }
            ]
        },
        "allocation": {
            "sector": [
                { "type": "科技", "percentage": 32.5 },
                { "type": "医疗健康", "percentage": 15.8 },
                { "type": "金融", "percentage": 12.3 },
                { "type": "消费品", "percentage": 10.5 },
                { "type": "通信服务", "percentage": 8.7 },
                { "type": "工业", "percentage": 7.9 },
                { "type": "能源", "percentage": 5.3 },
                { "type": "材料", "percentage": 4.2 },
                { "type": "公用事业", "percentage": 2.8 }
            ],
            "geography": [
                { "region": "美国", "percentage": 45.7 },
                { "region": "中国", "percentage": 21.5 },
                { "region": "欧洲", "percentage": 15.8 },
                { "region": "日本", "percentage": 7.3 },
                { "region": "新兴市场", "percentage": 9.7 }
            ]
        },
        "risk": [
            { "name": "波动率", "value": "12.5%", "status": "medium", "percentage": 60 },
            { "name": "最大回撤", "value": "-8.5%", "status": "low", "percentage": 40 },
            { "name": "下行风险", "value": "12.3%", "status": "medium", "percentage": 55 },
            { "name": "贝塔系数", "value": "0.85", "status": "high", "percentage": 75 },
            { "name": "VaR (95%)", "value": "-2.8%", "status": "low", "percentage": 30 },
            { "name": "夏普比率", "value": "1.42", "status": "medium", "percentage": 65 }
        ],
        "comparison": [
            { "metric": "年化收益率", "portfolio": "12.3%", "benchmark": "10.2%", "difference": "+2.1%", "positive": True },
            { "metric": "夏普比率", "portfolio": "1.42", "benchmark": "0.9", "difference": "+0.52", "positive": True },
            { "metric": "最大回撤", "portfolio": "-8.5%", "benchmark": "-18.2%", "difference": "+9.7%", "positive": True },
            { "metric": "波动率", "portfolio": "12.5%", "benchmark": "16.4%", "difference": "+3.9%", "positive": False },
            { "metric": "贝塔系数", "portfolio": "0.85", "benchmark": "1.00", "difference": "+0.15", "positive": False },
            { "metric": "年化α值", "portfolio": "2.1%", "benchmark": "0.0%", "difference": "+2.1%", "positive": True }
        ],
        "factors": {
            "styleFactors": [
                { "name": "规模", "exposure": 0.85, "positive": True },
                { "name": "价值", "exposure": -0.32, "positive": False },
                { "name": "动量", "exposure": 1.27, "positive": True },
                { "name": "质量", "exposure": 0.53, "positive": True },
                { "name": "波动性", "exposure": -0.21, "positive": False }
            ],
            "macroFactors": [
                { "name": "经济增长", "exposure": 1.32, "positive": True },
                { "name": "通货膨胀", "exposure": -0.45, "positive": False },
                { "name": "利率风险", "exposure": 0.78, "positive": True },
                { "name": "信用风险", "exposure": 0.41, "positive": True },
                { "name": "新兴市场", "exposure": 0.66, "positive": True }
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
        raise HTTPException(status_code=404, detail="投资组合未找到")
    return portfolios_db[portfolio_id]

@router.get("/portfolios/{portfolio_id}/analyze", response_model=PortfolioAnalysis)
async def analyze_portfolio(portfolio_id: str):
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="投资组合未找到")
    
    portfolio = portfolios_db[portfolio_id]
    tickers = portfolio["tickers"]
    
    # 准备权重字典
    weights = {ticker.symbol: ticker.weight for ticker in tickers}
    
    # 生成历史数据
    historical_data = generate_historical_data(tickers)
    
    # 计算各个分析指标
    performance = calculate_performance_metrics(historical_data, weights)
    allocation = calculate_allocation(tickers)
    risk = calculate_risk_metrics(historical_data, weights)
    comparison = calculate_comparison(historical_data, weights)
    factors = calculate_factor_exposure()
    
    return {
        "performance": performance,
        "allocation": allocation,
        "risk": risk,
        "comparison": comparison,
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
    
    # 使用市场数据工具进行比较
    comparison_result = compare_with_benchmark(mock_portfolio)
    
    return {
        "portfolio_id": portfolio_id,
        "comparison": comparison_result
    }

@router.get("/portfolio/{portfolio_id}/allocation")
async def get_portfolio_allocation(portfolio_id: str):
    """获取投资组合的资产配置分布"""
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
    
    # 使用市场数据工具获取资产配置
    allocation_result = get_asset_allocation(mock_portfolio)
    
    return {
        "portfolio_id": portfolio_id,
        "allocation": allocation_result
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
            get_portfolio_factor_exposure, 
            compare_with_benchmark,
            get_asset_allocation
        )
        
        # 计算资产配置
        allocation_data = get_asset_allocation(tickers)
        
        # 计算与基准的对比
        comparison_data = compare_with_benchmark(tickers)
        
        # 计算因子暴露
        factor_exposure = get_portfolio_factor_exposure(tickers)
        
        # 构建响应数据
        response = {
            "portfolio": {
                "id": f"mock-{portfolio.name.lower().replace(' ', '-')}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "name": portfolio.name,
                "tickers": [ticker.dict() for ticker in tickers]
            },
            "analysis": {
                "performance": {
                    "annualReturn": comparison_data["年化收益率"]["投资组合"],
                    "sharpeRatio": comparison_data["夏普比率"]["投资组合"],
                    "maxDrawdown": comparison_data["最大回撤"]["投资组合"],
                    "volatility": comparison_data["波动率"]["投资组合"]
                },
                "allocation": allocation_data,
                "risk": {
                    "volatility": comparison_data["波动率"]["投资组合"],
                    "maxDrawdown": abs(comparison_data["最大回撤"]["投资组合"]),
                    "beta": 1.05,
                    "var": 2.3,
                    "downside_risk": 6.2,
                    "sortino": 0.92
                },
                "comparison": comparison_data,
                "factors": factor_exposure
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