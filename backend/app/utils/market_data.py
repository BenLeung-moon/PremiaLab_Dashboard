import pandas as pd
import numpy as np
import os
from pathlib import Path

# 数据目录路径
DATA_DIR = Path(__file__).parent.parent / "data"

def load_price_history():
    """加载价格历史数据"""
    file_path = DATA_DIR / "Constituent_Price_History.csv"
    return pd.read_csv(file_path, parse_dates=True, index_col=0)

def load_factor_exposures():
    """加载因子暴露数据"""
    file_path = DATA_DIR / "Factor_Exposures.xlsx"
    return pd.read_excel(file_path, index_col=0)

def load_factor_covariance():
    """加载因子协方差矩阵"""
    file_path = DATA_DIR / "Factor_Covariance_Matrix.xlsx"
    return pd.read_excel(file_path, index_col=0)

def load_static_data():
    """加载静态数据"""
    file_path = DATA_DIR / "Static_Data.xlsx"
    return pd.read_excel(file_path, index_col=0)

def get_portfolio_returns(portfolio, start_date=None, end_date=None):
    """计算投资组合的历史收益率
    
    Args:
        portfolio: 投资组合字典，包含tickers列表，每个ticker有symbol和weight
        start_date: 开始日期 (可选)
        end_date: 结束日期 (可选)
        
    Returns:
        DataFrame: 投资组合的历史收益率时间序列
    """
    price_history = load_price_history()
    
    # 过滤日期范围
    if start_date:
        price_history = price_history[price_history.index >= start_date]
    if end_date:
        price_history = price_history[price_history.index <= end_date]
    
    # 计算收益率
    returns = price_history.pct_change().dropna()
    
    # 计算投资组合收益率
    portfolio_returns = pd.Series(0.0, index=returns.index)
    
    for ticker in portfolio['tickers']:
        symbol = ticker['symbol']
        weight = ticker['weight']
        
        if symbol in returns.columns:
            portfolio_returns += returns[symbol] * weight
    
    return portfolio_returns

def get_portfolio_factor_exposure(portfolio):
    """计算投资组合的因子暴露
    
    Args:
        portfolio: 投资组合字典，包含tickers列表，每个ticker有symbol和weight
        
    Returns:
        Series: 投资组合的因子暴露
    """
    factor_exposures = load_factor_exposures()
    
    # 初始化投资组合因子暴露
    portfolio_exposures = pd.Series(0.0, index=factor_exposures.columns)
    
    # 计算加权因子暴露
    for ticker in portfolio['tickers']:
        symbol = ticker['symbol']
        weight = ticker['weight']
        
        if symbol in factor_exposures.index:
            portfolio_exposures += factor_exposures.loc[symbol] * weight
    
    return portfolio_exposures

def get_benchmark_composition():
    """获取基准投资组合的组成
    
    Returns:
        dict: 基准投资组合
    """
    return {
        "name": "市场基准",
        "tickers": [
            {"symbol": "SPY", "weight": 1.0}
        ]
    }

def compare_with_benchmark(portfolio, start_date=None, end_date=None):
    """将投资组合与基准(SPY)进行比较
    
    Args:
        portfolio: 投资组合字典
        start_date: 开始日期 (可选)
        end_date: 结束日期 (可选)
        
    Returns:
        dict: 包含两者对比的各种指标
    """
    # 获取基准投资组合
    benchmark = get_benchmark_composition()
    
    # 计算投资组合和基准的历史收益率
    portfolio_returns = get_portfolio_returns(portfolio, start_date, end_date)
    benchmark_returns = get_portfolio_returns(benchmark, start_date, end_date)
    
    # 确保两个收益率序列有相同的索引
    common_dates = portfolio_returns.index.intersection(benchmark_returns.index)
    portfolio_returns = portfolio_returns.loc[common_dates]
    benchmark_returns = benchmark_returns.loc[common_dates]
    
    # 计算各种对比指标
    portfolio_total_return = (1 + portfolio_returns).prod() - 1
    benchmark_total_return = (1 + benchmark_returns).prod() - 1
    
    portfolio_annualized_return = (1 + portfolio_total_return) ** (252 / len(portfolio_returns)) - 1
    benchmark_annualized_return = (1 + benchmark_total_return) ** (252 / len(benchmark_returns)) - 1
    
    portfolio_volatility = portfolio_returns.std() * np.sqrt(252)
    benchmark_volatility = benchmark_returns.std() * np.sqrt(252)
    
    portfolio_sharpe = portfolio_annualized_return / portfolio_volatility if portfolio_volatility != 0 else 0
    benchmark_sharpe = benchmark_annualized_return / benchmark_volatility if benchmark_volatility != 0 else 0
    
    # 计算最大回撤
    portfolio_cumulative = (1 + portfolio_returns).cumprod()
    benchmark_cumulative = (1 + benchmark_returns).cumprod()
    
    portfolio_max_drawdown = calculate_max_drawdown(portfolio_cumulative)
    benchmark_max_drawdown = calculate_max_drawdown(benchmark_cumulative)
    
    # 计算相关性
    correlation = portfolio_returns.corr(benchmark_returns)
    
    # 计算跟踪误差
    tracking_error = (portfolio_returns - benchmark_returns).std() * np.sqrt(252)
    
    # 计算信息比率
    information_ratio = (portfolio_annualized_return - benchmark_annualized_return) / tracking_error if tracking_error != 0 else 0
    
    # 计算胜率 (超过基准的交易日比例)
    win_rate = (portfolio_returns > benchmark_returns).mean()
    
    # 返回结果
    return {
        "总收益率": {
            "投资组合": round(portfolio_total_return * 100, 2),
            "基准": round(benchmark_total_return * 100, 2),
            "超额": round((portfolio_total_return - benchmark_total_return) * 100, 2)
        },
        "年化收益率": {
            "投资组合": round(portfolio_annualized_return * 100, 2),
            "基准": round(benchmark_annualized_return * 100, 2),
            "超额": round((portfolio_annualized_return - benchmark_annualized_return) * 100, 2)
        },
        "波动率": {
            "投资组合": round(portfolio_volatility * 100, 2),
            "基准": round(benchmark_volatility * 100, 2),
            "差异": round((portfolio_volatility - benchmark_volatility) * 100, 2)
        },
        "夏普比率": {
            "投资组合": round(portfolio_sharpe, 2),
            "基准": round(benchmark_sharpe, 2),
            "差异": round(portfolio_sharpe - benchmark_sharpe, 2)
        },
        "最大回撤": {
            "投资组合": round(portfolio_max_drawdown * 100, 2),
            "基准": round(benchmark_max_drawdown * 100, 2),
            "差异": round((portfolio_max_drawdown - benchmark_max_drawdown) * 100, 2)
        },
        "相关性": round(correlation, 2),
        "跟踪误差": round(tracking_error * 100, 2),
        "信息比率": round(information_ratio, 2),
        "胜率": round(win_rate * 100, 2)
    }

def calculate_max_drawdown(cumulative_returns):
    """计算最大回撤
    
    Args:
        cumulative_returns: 累积收益率序列
        
    Returns:
        float: 最大回撤比例 (正值表示损失)
    """
    # 计算每个点的历史最高值
    running_max = cumulative_returns.cummax()
    
    # 计算从历史最高点的回撤
    drawdown = (cumulative_returns - running_max) / running_max
    
    # 返回最大回撤
    return -drawdown.min() if not drawdown.empty else 0

def get_asset_allocation(portfolio):
    """获取投资组合的资产配置分布
    
    Args:
        portfolio: 投资组合字典
        
    Returns:
        dict: 资产配置分布
    """
    # 加载静态数据，包含股票的行业和国家信息
    static_data = load_static_data()
    
    # 初始化行业和地区分布
    sectors = {}
    regions = {}
    market_caps = {}
    
    # 计算资产配置
    for ticker in portfolio['tickers']:
        symbol = ticker['symbol']
        weight = ticker['weight']
        
        if symbol in static_data.index:
            # 行业分布
            sector = static_data.loc[symbol, 'Sector'] if 'Sector' in static_data.columns else '未分类'
            sectors[sector] = sectors.get(sector, 0) + weight
            
            # 地区分布
            region = static_data.loc[symbol, 'Country'] if 'Country' in static_data.columns else '未分类'
            regions[region] = regions.get(region, 0) + weight
            
            # 市值分布
            market_cap = static_data.loc[symbol, 'Market_Cap'] if 'Market_Cap' in static_data.columns else '未分类'
            if isinstance(market_cap, (int, float)) and not np.isnan(market_cap):
                if market_cap > 10e9:
                    cap_category = '大盘股'
                elif market_cap > 2e9:
                    cap_category = '中盘股'
                else:
                    cap_category = '小盘股'
                
                market_caps[cap_category] = market_caps.get(cap_category, 0) + weight
            else:
                market_caps['未分类'] = market_caps.get('未分类', 0) + weight
        else:
            # 如果没有静态数据，归为未分类
            sectors['未分类'] = sectors.get('未分类', 0) + weight
            regions['未分类'] = regions.get('未分类', 0) + weight
            market_caps['未分类'] = market_caps.get('未分类', 0) + weight
    
    # 将权重转换为百分比
    sectors = {k: round(v * 100, 2) for k, v in sectors.items()}
    regions = {k: round(v * 100, 2) for k, v in regions.items()}
    market_caps = {k: round(v * 100, 2) for k, v in market_caps.items()}
    
    return {
        "行业分布": sectors,
        "地区分布": regions,
        "市值分布": market_caps,
    } 