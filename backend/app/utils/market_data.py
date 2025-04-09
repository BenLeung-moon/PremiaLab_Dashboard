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
            {"symbol": "SPY", "weight": 0.6},
            {"symbol": "AGG", "weight": 0.4}
        ]
    } 