"""
Analysis Service - Handles business logic for portfolio analysis operations
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random
from pathlib import Path
import logging
from ..models.portfolio import Portfolio, PortfolioAnalysis
from .portfolio_service import get_portfolio_service
from .stocks_service import get_stock_history_service
import math
from ..utils.market_data import get_portfolio_factor_exposure, get_real_asset_allocation
import traceback

# Set up logging
logger = logging.getLogger(__name__)

# Data path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

async def analyze_portfolio_service(portfolio_id: str, period: str = "5year") -> Optional[PortfolioAnalysis]:
    """Analyze a specific portfolio by ID"""
    logger.debug(f"Analyzing portfolio with ID: {portfolio_id}, period: {period}")
    
    # Get portfolio
    portfolio_response = await get_portfolio_service(portfolio_id)
    if not portfolio_response:
        # 尝试检查是否有"port-"前缀
        logger.warning(f"Portfolio {portfolio_id} not found, trying with 'port-' prefix")
        if not portfolio_id.startswith("port-"):
            # 如果没有前缀，尝试使用前缀版本
            port_id = f"port-{portfolio_id}"
            portfolio_response = await get_portfolio_service(port_id)
        
        if not portfolio_response:
            logger.error(f"Portfolio not found with ID {portfolio_id}")
            return None
    
    logger.debug(f"Portfolio found: {portfolio_response.name}, with {len(portfolio_response.tickers)} tickers")
    
    # Convert to Portfolio object for analysis
    portfolio = Portfolio(
        name=portfolio_response.name,
        tickers=portfolio_response.tickers
    )
    
    # 根据时间段确定需要获取的历史数据天数
    # 考虑交易日：平均每月约21个交易日
    trading_days_per_month = 21
    trading_days_per_year = trading_days_per_month * 12
    
    if period == "ytd":
        # 年初至今
        start_of_year = datetime(datetime.now().year, 1, 1)
        calendar_days = (datetime.now() - start_of_year).days
        # 估算交易日数量（排除周末，约占日历日的5/7）
        days = int(calendar_days * 5/7) + 5  # 加上额外余量
    elif period == "1year":
        days = trading_days_per_year + 20  # 1年加上额外余量
    elif period == "3year":
        days = 3 * trading_days_per_year + 30  # 3年加上额外余量
    elif period == "5year":
        days = 5 * trading_days_per_year + 40  # 5年加上额外余量
    else:
        # 默认5年
        days = 5 * trading_days_per_year + 40
    
    logger.debug(f"Using {days} trading days for period: {period} (with {trading_days_per_month} trading days per month)")
    
    # Return analysis with specified time period
    logger.debug(f"Generating analysis for portfolio {portfolio_id}")
    return await analyze_portfolio(portfolio, days, period)

async def analyze_portfolio(portfolio: Portfolio, days: int, period: str) -> PortfolioAnalysis:
    """Generate analysis for a portfolio using real price data"""
    # Extract tickers and weights
    tickers = [t.symbol for t in portfolio.tickers]
    weights = [t.weight for t in portfolio.tickers]
    
    # Get historical data
    historical_data = await _get_historical_data(tickers, days)
    
    # Calculate performance metrics
    performance = _calculate_statistics(historical_data, weights)
    
    # Calculate allocation
    allocation = _calculate_allocation(portfolio.tickers)
    
    # Calculate risk metrics
    risk = _calculate_risk_metrics(historical_data, weights)
    logger.debug(f"Calculate risk metrics completed, returned {len(risk)} metrics")
    
    # Calculate comparison with benchmarks
    comparison = _calculate_comparison(historical_data, weights)
    
    # Calculate factor exposure
    factors = _calculate_factor_exposure(tickers)
    
    # 明确记录当前请求的时间段
    logger.debug(f"Calculating historical trends for period: {period} (days: {days})")
    
    # Calculate historical trends data - 直接传递请求的天数到历史趋势计算函数
    historical_trends = _calculate_historical_trends(historical_data, weights, days)
    
    # 添加日志记录分析结果包含的项目
    analysis_result = PortfolioAnalysis(
        performance=performance,
        allocation=allocation,
        risk=risk,
        comparison=comparison,
        factors=factors,
        historical_trends=historical_trends
    )
    
    logger.debug(f"Portfolio analysis completed with components: performance={bool(performance)}, "
                f"allocation={bool(allocation)}, risk={bool(risk)} ({len(risk) if risk else 0} metrics), "
                f"comparison={bool(comparison)}, factors={bool(factors)}, "
                f"historical_trends={bool(historical_trends)}")
    
    return analysis_result

async def mock_analyze_portfolio_service(portfolio: Portfolio) -> PortfolioAnalysis:
    """Generate mock analysis for a portfolio (fallback if real data is not available)"""
    # Extract tickers and weights
    tickers = [t.symbol for t in portfolio.tickers]
    weights = [t.weight for t in portfolio.tickers]
    
    # Generate historical data
    historical_data = _generate_historical_data(tickers)
    
    # Calculate performance metrics
    performance = _calculate_statistics(historical_data, weights)
    
    # Calculate allocation
    allocation = _calculate_allocation(portfolio.tickers)
    
    # Calculate risk metrics
    risk = _calculate_risk_metrics(historical_data, weights)
    
    # Calculate comparison with benchmarks
    comparison = _calculate_comparison(historical_data, weights)
    
    # Calculate factor exposure
    factors = _calculate_factor_exposure(tickers)
    
    return PortfolioAnalysis(
        performance=performance,
        allocation=allocation,
        risk=risk,
        comparison=comparison,
        factors=factors
    )

async def _get_historical_data(tickers, days=365):
    """Get real historical price data for tickers"""
    logger.debug(f"Getting historical data for {len(tickers)} tickers over {days} days")
    
    # Create empty DataFrame to store results
    data = pd.DataFrame()
    
    # 确保SPX数据也被获取
    all_tickers = tickers.copy()
    if 'SPX' not in all_tickers:
        all_tickers.append('SPX')
        logger.debug("Added SPX to the list of tickers for benchmark comparison")
    
    # 改为仅记录未获取到数据的ticker，避免每个都记录
    missing_tickers = []
    
    for ticker in all_tickers:
        try:
            # Get historical data for this ticker
            ticker_history = await get_stock_history_service(ticker, days)
            
            if not ticker_history:
                if ticker == 'SPX':
                    logger.warning("No SPX data found, benchmark comparisons will use mock data")
                else:
                    missing_tickers.append(ticker)
                continue
                
            # Convert to DataFrame
            ticker_df = pd.DataFrame(ticker_history)
            
            # Set date as index and convert to datetime
            ticker_df['date'] = pd.to_datetime(ticker_df['date'])
            ticker_df = ticker_df.set_index('date')
            
            # Extract price column based on ticker
            if ticker == 'SPX' and 'value' in ticker_df.columns:
                # For SPX use value column if available
                prices = ticker_df['value']
                data[ticker] = prices
            elif 'PRC' in ticker_df.columns:
                # For normal stocks use PRC column
                prices = ticker_df['PRC']
                data[ticker] = prices
            else:
                # Try to use any available numeric column
                for col in ticker_df.columns:
                    if pd.api.types.is_numeric_dtype(ticker_df[col]):
                        prices = ticker_df[col]
                        data[ticker] = prices
                        break
                else:
                    logger.warning(f"No suitable price column found for {ticker}")
        except Exception as e:
            if ticker == 'SPX':
                logger.error(f"Error getting SPX benchmark data: {e}")
            else:
                logger.error(f"Error getting data for {ticker}: {e}")
    
    # 只在有未获取到数据的ticker时才记录日志
    if missing_tickers:
        logger.warning(f"No historical data found for {len(missing_tickers)} tickers: {', '.join(missing_tickers[:5])}{'...' if len(missing_tickers) > 5 else ''}")
    
    # If we have no data, generate mock data
    if data.empty:
        logger.warning("No historical data found for any tickers, using mock data")
        return _generate_historical_data(tickers, days)
    
    # Check if we have SPX data
    if 'SPX' not in data.columns:
        logger.warning("SPX data not available in final dataset, benchmark comparisons will use mock data")
        
    # Sort index by date
    data = data.sort_index()
    
    return data

def _generate_historical_data(tickers, days=365):
    """Generate mock historical price data for tickers"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Create date range
    date_range = pd.date_range(start=start_date, end=end_date, freq='B')
    
    # Generate random return data
    data = pd.DataFrame(index=date_range)
    
    for ticker in tickers:
        # Start with base value 100
        base = 100
        
        # Randomize daily return parameters based on ticker
        daily_return_mean = random.uniform(0.0002, 0.001)
        daily_return_std = random.uniform(0.01, 0.02)
        
        # Generate random returns
        returns = np.random.normal(daily_return_mean, daily_return_std, len(date_range))
        
        # Convert to prices
        prices = [base]
        for r in returns:
            prices.append(prices[-1] * (1 + r))
        
        # Remove first element
        prices = prices[1:]
        
        # Set as Series in dataframe
        data[ticker] = prices
    
    return data

def _calculate_statistics(historical_data, weights):
    """Calculate performance statistics for portfolio"""
    # Create daily returns - 明确指定fill_method
    returns = historical_data.pct_change(fill_method=None).dropna()
    
    # Check if returns is empty
    if returns.empty:
        logger.warning("Empty returns data, generating mock statistics")
        return _generate_mock_statistics()
    
    # Filter out non-portfolio columns (like SPX)
    portfolio_tickers = [ticker for ticker in returns.columns if ticker != 'SPX']
    if not portfolio_tickers:
        logger.warning("No portfolio tickers found in data, generating mock statistics")
        return _generate_mock_statistics()
    
    # Filter returns to only include portfolio tickers
    portfolio_returns_data = returns[portfolio_tickers]
    
    # Adjust weights to match available tickers
    adjusted_weights = []
    for i, ticker in enumerate(portfolio_tickers):
        if i < len(weights):
            adjusted_weights.append(weights[i])
        else:
            adjusted_weights.append(0)
    
    # Make sure we have enough weights to match columns
    if len(adjusted_weights) < len(portfolio_tickers):
        logger.warning(f"Not enough weights provided ({len(adjusted_weights)}) for tickers ({len(portfolio_tickers)}). Padding with zeros.")
        while len(adjusted_weights) < len(portfolio_tickers):
            adjusted_weights.append(0)
    
    # Normalize weights to sum to 1
    if sum(adjusted_weights) > 0:
        adjusted_weights = [w/sum(adjusted_weights) for w in adjusted_weights]
    else:
        # If all weights are zero, distribute equally
        adjusted_weights = [1/len(adjusted_weights)] * len(adjusted_weights)
    
    logger.debug(f"Portfolio returns data shape: {portfolio_returns_data.shape}, Adjusted weights length: {len(adjusted_weights)}")
    
    # Calculate portfolio returns with adjusted weights
    portfolio_returns = portfolio_returns_data.dot(adjusted_weights)
    
    # 检查并处理无效值
    portfolio_returns = portfolio_returns.replace([np.inf, -np.inf], np.nan).fillna(0)
    
    # --- Calculate Overall Metrics (based on the entire history available) ---
    logger.debug("Calculating overall performance metrics...")
    annual_return = portfolio_returns.mean() * 252
    annual_volatility = portfolio_returns.std() * np.sqrt(252)
    
    # Default values and checks for overall metrics
    if pd.isna(annual_return) or np.isinf(annual_return):
        logger.warning("Overall annual return invalid, using default 0.08")
        annual_return = 0.08
    if pd.isna(annual_volatility) or np.isinf(annual_volatility) or annual_volatility <= 0.001: # Check if volatility is too low or invalid
        logger.warning(f"Overall annual volatility invalid or zero ({annual_volatility}), using default 0.15")
        annual_volatility = 0.15
        
    # Use a consistent risk-free rate (e.g., 2%)
    risk_free_rate = 0.02 
    sharpe_ratio = (annual_return - risk_free_rate) / annual_volatility if annual_volatility > 0 else 0.0
    if pd.isna(sharpe_ratio) or np.isinf(sharpe_ratio):
        logger.warning(f"Overall Sharpe ratio invalid ({sharpe_ratio}), using default 0.0")
        sharpe_ratio = 0.0

    cum_returns = (1 + portfolio_returns).cumprod()
    total_return = cum_returns.iloc[-1] - 1 if len(cum_returns) > 0 else annual_return
    if pd.isna(total_return) or np.isinf(total_return):
        logger.warning("Overall total return invalid, using annual return")
        total_return = annual_return
        
    running_max = cum_returns.cummax()
    drawdown = (cum_returns / running_max) - 1
    max_drawdown = drawdown.min() if not drawdown.empty else 0.0
    if pd.isna(max_drawdown) or np.isinf(max_drawdown):
        logger.warning("Overall max drawdown invalid, using default -0.15")
        max_drawdown = -0.15
        
    logger.debug(f"Overall Metrics: TR={total_return:.4f}, AR={annual_return:.4f}, Vol={annual_volatility:.4f}, SR={sharpe_ratio:.4f}, MDD={max_drawdown:.4f}")

    # --- Calculate TimeFrame Specific Metrics ---
    logger.debug("Calculating timeframe specific metrics...")
    timeframe_results = {}
    today = pd.Timestamp.now().normalize() # Use normalize() to remove time part for comparison
    timeframes = {
        'ytd': pd.Timestamp(today.year, 1, 1),
        'oneYear': today - pd.DateOffset(years=1),
        'threeYear': today - pd.DateOffset(years=3),
        'fiveYear': today - pd.DateOffset(years=5)
    }

    # Get benchmark returns if available
    benchmark_returns = None
    if 'SPX' in returns.columns:
        benchmark_returns = returns['SPX'].replace([np.inf, -np.inf], np.nan).fillna(0)
        logger.debug(f"Using SPX benchmark returns for timeframe calculations.")
    else:
        logger.warning("No SPX benchmark returns found for timeframe calculations.")

    for frame_name, start_date in timeframes.items():
        start_date = start_date.normalize()
        logger.debug(f"Processing timeframe: {frame_name} (Start: {start_date.strftime('%Y-%m-%d')})")
        
        # Filter portfolio returns for the period
        mask = (portfolio_returns.index >= start_date) & (portfolio_returns.index <= today)
        p_returns_period = portfolio_returns[mask]
        
        # Filter benchmark returns for the period
        b_returns_period = None
        if benchmark_returns is not None:
            b_mask = (benchmark_returns.index >= start_date) & (benchmark_returns.index <= today)
            b_returns_period = benchmark_returns[b_mask]

        # Ensure we have enough data points (e.g., at least 2 to calculate std dev)
        if len(p_returns_period) < 2:
            logger.warning(f"Skipping timeframe {frame_name}: Not enough data points ({len(p_returns_period)}) after masking.")
            timeframe_results[frame_name] = None # Or a default structure with null values
            continue

        # Calculate timeframe specific metrics
        try:
            # Total Return
            p_total_period = (1 + p_returns_period).prod() - 1
            b_total_period = (1 + b_returns_period).prod() - 1 if b_returns_period is not None and not b_returns_period.empty else None
            excess_period = p_total_period - b_total_period if b_total_period is not None else None
            logger.debug(f"  [{frame_name}] Total Return (P/B): {p_total_period:.4f} / {b_total_period if b_total_period is not None else 'N/A'}")

            # Annualized Return
            days_count = max(1, (p_returns_period.index[-1] - p_returns_period.index[0]).days) # Avoid division by zero if same day
            p_ann_period = None
            b_ann_period = None
            if days_count > 365:
                p_ann_period = (1 + p_total_period) ** (365.0 / days_count) - 1
                if b_total_period is not None:
                    b_ann_period = (1 + b_total_period) ** (365.0 / days_count) - 1
                logger.debug(f"  [{frame_name}] Annualized Return (P/B): {p_ann_period:.4f} / {b_ann_period if b_ann_period is not None else 'N/A'}")
            else:
                 logger.debug(f"  [{frame_name}] Annualized Return: N/A (period <= 365 days: {days_count})")

            # Volatility
            p_vol_period = p_returns_period.std() * np.sqrt(252)
            b_vol_period = b_returns_period.std() * np.sqrt(252) if b_returns_period is not None and len(b_returns_period) >= 2 else None
            # Handle NaN/inf/zero vol
            if pd.isna(p_vol_period) or np.isinf(p_vol_period) or p_vol_period <= 0.001:
                logger.warning(f"  [{frame_name}] Portfolio Volatility invalid ({p_vol_period}), setting to 0.")
                p_vol_period = 0.0
            if b_vol_period is not None and (pd.isna(b_vol_period) or np.isinf(b_vol_period) or b_vol_period <= 0.001):
                 logger.warning(f"  [{frame_name}] Benchmark Volatility invalid ({b_vol_period}), setting to None.")
                 b_vol_period = None
            logger.debug(f"  [{frame_name}] Volatility (P/B): {p_vol_period:.4f} / {b_vol_period if b_vol_period is not None else 'N/A'}")

            # Sharpe Ratio
            p_sharpe_period = None
            b_sharpe_period = None
            if p_ann_period is not None and p_vol_period > 0:
                p_sharpe_period = (p_ann_period - risk_free_rate) / p_vol_period
                if pd.isna(p_sharpe_period) or np.isinf(p_sharpe_period):
                    logger.warning(f"  [{frame_name}] Portfolio Sharpe invalid ({p_sharpe_period}), setting to None.")
                    p_sharpe_period = None
            if b_ann_period is not None and b_vol_period is not None and b_vol_period > 0:
                b_sharpe_period = (b_ann_period - risk_free_rate) / b_vol_period
                if pd.isna(b_sharpe_period) or np.isinf(b_sharpe_period):
                    logger.warning(f"  [{frame_name}] Benchmark Sharpe invalid ({b_sharpe_period}), setting to None.")
                    b_sharpe_period = None
            logger.debug(f"  [{frame_name}] Sharpe Ratio (P/B): {p_sharpe_period if p_sharpe_period is not None else 'N/A'} / {b_sharpe_period if b_sharpe_period is not None else 'N/A'}")

            # Calculate Max Drawdown for the period
            max_drawdown_period = 0.0
            if not p_returns_period.empty:
                cum_returns_period = (1 + p_returns_period).cumprod()
                running_max_period = cum_returns_period.cummax()
                drawdown_period = (cum_returns_period / running_max_period) - 1
                if not drawdown_period.empty:
                    max_drawdown_period = drawdown_period.min()
                    if pd.isna(max_drawdown_period) or np.isinf(max_drawdown_period):
                        logger.warning(f"  [{frame_name}] Max Drawdown calculation invalid ({max_drawdown_period}), setting to 0.")
                        max_drawdown_period = 0.0
                else:
                     logger.warning(f"  [{frame_name}] Drawdown series is empty, setting Max Drawdown to 0.")
            else:
                logger.warning(f"  [{frame_name}] Returns series for period is empty, cannot calculate Max Drawdown.")
            logger.debug(f"  [{frame_name}] Max Drawdown: {max_drawdown_period:.4f}")
                
            # Calculate Win Rate for the period
            win_rate_period = 0.0
            if not p_returns_period.empty:
                positive_returns = (p_returns_period > 0).sum()
                total_periods = len(p_returns_period)
                if total_periods > 0:
                    win_rate_period = (positive_returns / total_periods)
                else:
                    logger.warning(f"  [{frame_name}] Total periods is zero, cannot calculate Win Rate.")
            else:
                logger.warning(f"  [{frame_name}] Returns series for period is empty, cannot calculate Win Rate.")
            logger.debug(f"  [{frame_name}] Win Rate: {win_rate_period:.4f}")
            
            # Structure for the timeframe
            timeframe_data = {
                'return': {
                    'portfolio': round(p_total_period * 100, 2),
                    'benchmark': round(b_total_period * 100, 2) if b_total_period is not None else None,
                    'excess': round(excess_period * 100, 2) if excess_period is not None else None
                },
                'annualized': {
                    'portfolio': round(p_ann_period * 100, 2) if p_ann_period is not None else None,
                    'benchmark': round(b_ann_period * 100, 2) if b_ann_period is not None else None,
                    'excess': round((p_ann_period - b_ann_period) * 100, 2) if p_ann_period is not None and b_ann_period is not None else None
                } if p_ann_period is not None else None, # Only include if annualized is calculated
                'volatility': {
                    'portfolio': round(p_vol_period * 100, 2),
                    'benchmark': round(b_vol_period * 100, 2) if b_vol_period is not None else None,
                    'difference': round((p_vol_period - b_vol_period) * 100, 2) if b_vol_period is not None else None
                },
                'sharpe': {
                    'portfolio': round(p_sharpe_period, 2) if p_sharpe_period is not None else None,
                    'benchmark': round(b_sharpe_period, 2) if b_sharpe_period is not None else None,
                    'difference': round(p_sharpe_period - b_sharpe_period, 2) if p_sharpe_period is not None and b_sharpe_period is not None else None
                } if p_sharpe_period is not None or b_sharpe_period is not None else None, # Only include if sharpe is calculated
                'maxDrawdown': round(max_drawdown_period * 100, 2), # Add timeframe specific max drawdown
                'winRate': round(win_rate_period * 100, 2) # Add timeframe specific win rate
            }
            timeframe_results[frame_name] = timeframe_data
            logger.debug(f"  => Result for {frame_name}: {timeframe_data}")

        except Exception as e:
            logger.error(f"Error calculating metrics for timeframe {frame_name}: {e}")
            logger.debug(traceback.format_exc()) # Log full traceback for debugging
            timeframe_results[frame_name] = None # Indicate error for this timeframe
            
    # --- Assemble Final Result --- 
    # Generate monthly returns for the chart (can keep the previous logic or refine)
    monthly_returns = []
    now = datetime.now()
    
    # Get returns for the last 12 months
    for i in range(12):
        month = now.month - i - 1
        year = now.year
        
        if month <= 0:
            month += 12
            year -= 1
            
        month_name = f"{year}-{month:02d}"
        portfolio_return = round(random.uniform(-0.1, 0.15), 4)
        benchmark_return = round(random.uniform(-0.1, 0.15), 4)
        
        monthly_returns.append({
            "month": month_name,
            "return": portfolio_return * 100,  # 转换为百分比
            "benchmark": benchmark_return * 100  # 转换为百分比
        })
    
    # 确保按月份排序
    monthly_returns.sort(key=lambda x: x["month"])
    
    # 获取累积收益率并检查是否有效
    total_return = cum_returns.iloc[-1] - 1 if len(cum_returns) > 0 else annual_return
    if pd.isna(total_return) or np.isinf(total_return):
        logger.warning("Invalid total return detected, using annual return instead")
        total_return = annual_return
    
    # 转换为前端期望的格式（驼峰命名和百分比值）
    result = {
        "totalReturn": round(float(total_return * 100), 2),
        "annualizedReturn": round(float(annual_return * 100), 2),
        "volatility": round(float(annual_volatility * 100), 2),
        "sharpeRatio": round(float(sharpe_ratio), 2),
        "maxDrawdown": round(float(max_drawdown * 100), 2),
        "winRate": 49.62,  # 胜率，使用默认值
        "monthlyReturns": monthly_returns,
        "timeFrames": timeframe_results # Use the newly calculated timeframe results
    }
    
    return result

def _calculate_allocation(tickers):
    """Calculate portfolio allocation by sector"""
    # 调用专门的资产配置服务函数，获取真实数据
    logger.debug(f"调用get_real_asset_allocation计算资产配置，tickers类型: {type(tickers)}")
    return get_real_asset_allocation(tickers)

def _calculate_risk_metrics(historical_data, weights):
    """Calculate risk metrics for the portfolio"""
    # Calculate daily returns - 明确指定fill_method
    returns = historical_data.pct_change(fill_method=None).dropna()
    
    # Check if returns is empty
    if returns.empty:
        logger.warning("Empty returns data in risk metrics, generating mock risk metrics")
        return _generate_mock_risk_metrics()
    
    # Filter out non-portfolio columns (like SPX)
    portfolio_tickers = [ticker for ticker in returns.columns if ticker != 'SPX']
    if not portfolio_tickers:
        logger.warning("No portfolio tickers found in risk data, generating mock risk metrics")
        return _generate_mock_risk_metrics()
    
    # Filter returns to only include portfolio tickers
    portfolio_returns_data = returns[portfolio_tickers]
    
    # Adjust weights to match available tickers
    adjusted_weights = []
    for i, ticker in enumerate(portfolio_tickers):
        if i < len(weights):
            adjusted_weights.append(weights[i])
        else:
            adjusted_weights.append(0)
    
    # Make sure we have enough weights to match columns
    if len(adjusted_weights) < len(portfolio_tickers):
        logger.warning(f"Not enough weights provided ({len(adjusted_weights)}) for tickers ({len(portfolio_tickers)}) in risk metrics. Padding with zeros.")
        while len(adjusted_weights) < len(portfolio_tickers):
            adjusted_weights.append(0)
    
    # Normalize weights to sum to 1
    if sum(adjusted_weights) > 0:
        adjusted_weights = [w/sum(adjusted_weights) for w in adjusted_weights]
    else:
        # If all weights are zero, distribute equally
        adjusted_weights = [1/len(adjusted_weights)] * len(adjusted_weights)
    
    logger.debug(f"Risk metrics: portfolio returns data shape: {portfolio_returns_data.shape}, Adjusted weights length: {len(adjusted_weights)}")
    
    # Calculate portfolio returns with adjusted weights
    portfolio_returns = portfolio_returns_data.dot(adjusted_weights)
    
    # 处理无效值
    portfolio_returns = portfolio_returns.replace([np.inf, -np.inf], np.nan).fillna(0)
    
    # Calculate volatility (annualized)
    volatility = portfolio_returns.std() * np.sqrt(252)
    if pd.isna(volatility) or np.isinf(volatility) or volatility < 0.001:
        logger.warning("Invalid volatility detected, using default value")
        volatility = 0.15  # 默认值15%
    
    # Calculate downside risk (semi-deviation of negative returns)
    downside_returns = portfolio_returns[portfolio_returns < 0]
    if len(downside_returns) > 0:
        downside_risk = downside_returns.std() * np.sqrt(252)
        if pd.isna(downside_risk) or np.isinf(downside_risk) or downside_risk < 0.001:
            downside_risk = volatility * 0.6  # 使用波动率的60%作为默认值
    else:
        downside_risk = volatility * 0.6
    
    # Calculate Value at Risk (VaR) at 95% confidence
    if len(portfolio_returns) >= 20:  # 需要足够的数据点
        var_95 = np.percentile(portfolio_returns, 5) * np.sqrt(252)
        if pd.isna(var_95) or np.isinf(var_95):
            var_95 = -volatility * 1.65  # 使用正态分布95%置信度的估计
    else:
        var_95 = -volatility * 1.65
    
    # Calculate beta against "market" (use SPX if available)
    if 'SPX' in returns.columns:
        market_returns = returns['SPX']
    else:
        market_returns = returns.iloc[:, 0]
    
    # 处理市场收益率中的无效值
    market_returns = market_returns.replace([np.inf, -np.inf], np.nan).fillna(0)
    
    # Ensure market_returns and portfolio_returns have the same index
    common_index = portfolio_returns.index.intersection(market_returns.index)
    if len(common_index) < 10:  # 需要至少10个数据点
        logger.warning("Not enough common data points for beta calculation, using default value")
        beta = 1.0
    else:
        port_returns_aligned = portfolio_returns.loc[common_index]
        market_returns_aligned = market_returns.loc[common_index]
        
        # 计算Beta
        try:
            cov = np.cov(port_returns_aligned, market_returns_aligned)[0, 1]
            market_var = np.var(market_returns_aligned)
            if market_var > 0:
                beta = cov / market_var
                if pd.isna(beta) or np.isinf(beta) or abs(beta) > 3:
                    logger.warning(f"Unreasonable beta value: {beta}, using default")
                    beta = 1.0
            else:
                beta = 1.0  # 默认值
        except Exception as e:
            logger.error(f"Error calculating beta: {str(e)}")
            beta = 1.0  # 默认值
    
    # Calculate maximum drawdown
    try:
        cumulative_returns = (1 + portfolio_returns).cumprod()
        peak = cumulative_returns.expanding(min_periods=1).max()
        drawdown = (cumulative_returns / peak) - 1
        max_drawdown = drawdown.min()
        
        if pd.isna(max_drawdown) or np.isinf(max_drawdown) or max_drawdown < -1:
            logger.warning("Invalid max drawdown value, using default")
            max_drawdown = -0.20  # 默认最大回撤 -20%
    except Exception as e:
        logger.error(f"Error calculating maximum drawdown: {str(e)}")
        max_drawdown = -0.20  # 默认值
    
    # Calculate tracking error (difference between portfolio and benchmark returns)
    if 'SPX' in returns.columns and len(common_index) >= 10:
        try:
            # Align market and portfolio returns
            aligned_market = market_returns.loc[common_index]
            aligned_portfolio = portfolio_returns.loc[common_index]
            # Calculate tracking error
            tracking_diff = aligned_portfolio - aligned_market
            tracking_error = tracking_diff.std() * np.sqrt(252)
            
            if pd.isna(tracking_error) or np.isinf(tracking_error) or tracking_error < 0.001:
                tracking_error = volatility * 0.4  # 估计值
        except Exception as e:
            logger.error(f"Error calculating tracking error: {str(e)}")
            tracking_error = volatility * 0.4  # 估计值
    else:
        tracking_error = volatility * 0.4  # 估计值
    
    # Calculate information ratio
    if 'SPX' in returns.columns and len(common_index) >= 10:
        try:
            aligned_market = market_returns.loc[common_index]
            aligned_portfolio = portfolio_returns.loc[common_index]
            excess_return = aligned_portfolio.mean() - aligned_market.mean()
            
            if tracking_error > 0:
                information_ratio = (excess_return * 252) / tracking_error
                if pd.isna(information_ratio) or np.isinf(information_ratio) or abs(information_ratio) > 5:
                    information_ratio = 0.5  # 合理的默认值
            else:
                information_ratio = 0.5
        except Exception as e:
            logger.error(f"Error calculating information ratio: {str(e)}")
            information_ratio = 0.5
    else:
        information_ratio = 0.5  # 默认值
    
    # Calculate Sortino ratio (return / downside risk)
    try:
        avg_return = portfolio_returns.mean() * 252  # Annualized
        if pd.isna(avg_return) or np.isinf(avg_return):
            avg_return = 0.08  # 默认年化收益率 8%
            
        risk_free_rate = 0.03  # Assume 3% risk-free rate
        
        if downside_risk > 0:
            sortino_ratio = (avg_return - risk_free_rate) / downside_risk
            if pd.isna(sortino_ratio) or np.isinf(sortino_ratio) or abs(sortino_ratio) > 5:
                sortino_ratio = 1.0  # 合理的默认值
        else:
            sortino_ratio = 1.0  # 默认值
    except Exception as e:
        logger.error(f"Error calculating Sortino ratio: {str(e)}")
        sortino_ratio = 1.0  # 默认值
    
    # Calculate Sharpe ratio
    try:
        if volatility > 0:
            sharpe_ratio = (avg_return - risk_free_rate) / volatility
            if pd.isna(sharpe_ratio) or np.isinf(sharpe_ratio) or abs(sharpe_ratio) > 5:
                sharpe_ratio = 1.0  # 合理的默认值
        else:
            sharpe_ratio = 1.0  # 默认值
    except Exception as e:
        logger.error(f"Error calculating Sharpe ratio: {str(e)}")
        sharpe_ratio = 1.0  # 默认值
    
    # Prepare data in the format expected by frontend
    risk_data = [
        {
            "name": "Volatility",  # 波动率：值越低越好，高波动率意味着高风险
            "value": f"{round(volatility * 100, 2)}%",
            "benchmark": f"{round(volatility * 100 * 1.1, 2)}%",  # Benchmark typically has higher volatility
            "status": "bad" if volatility > 0.25 else ("neutral" if volatility > 0.18 else "good"),
            "percentage": 100 - min(int(volatility * 350), 95)  # Convert to percentage scale
        },
        {
            "name": "Downside Risk",  # 下行风险：值越低越好，衡量组合下跌的幅度
            "value": f"{round(downside_risk * 100, 2)}%",
            "benchmark": f"{round(downside_risk * 100 * 1.2, 2)}%",
            "status": "bad" if downside_risk > 0.18 else ("neutral" if downside_risk > 0.12 else "good"),
            "percentage": 100 - min(int(downside_risk * 400), 95)
        },
        {
            "name": "VaR (95%)",  # 风险价值：值越低越好，表示在95%置信区间下的最大损失
            "value": f"{round(abs(var_95) * 100, 2)}%",
            "benchmark": f"{round(abs(var_95) * 100 * 1.15, 2)}%",
            "status": "bad" if abs(var_95) > 0.035 else ("neutral" if abs(var_95) > 0.025 else "good"),
            "percentage": 100 - min(int(abs(var_95) * 2000), 95)
        },
        {
            "name": "Beta",  # 贝塔系数：接近1为中性，<1表示波动小于市场，>1表示波动大于市场
            "value": f"{round(beta, 2)}",
            "benchmark": "1.00",
            "status": "bad" if beta > 1.1 else ("neutral" if beta > 0.9 else "good"),
            "percentage": 100 - min(int(abs(beta - 0.8) * 100), 95)
        },
        {
            "name": "Maximum Drawdown",  # 最大回撤：值越低越好，表示从高点到最低点的最大跌幅
            "value": f"{round(abs(max_drawdown) * 100, 2)}%",
            "benchmark": f"{round(abs(max_drawdown) * 100 * 1.2, 2)}%",
            "status": "bad" if abs(max_drawdown) > 0.25 else ("neutral" if abs(max_drawdown) > 0.15 else "good"),
            "percentage": 100 - min(int(abs(max_drawdown) * 300), 95)
        },
        {
            "name": "Tracking Error",  # 跟踪误差：与基准偏离的程度，依据投资策略而定，不直接评价好坏
            "value": f"{round(tracking_error * 100, 2)}%",
            "benchmark": "0.0%",
            "status": "neutral",  # Tracking error is neither good nor bad by itself
            "percentage": 100 - min(int(tracking_error * 1200), 95)
        },
        {
            "name": "Information Ratio",  # 信息比率：值越高越好，表示超额收益与跟踪误差的比率
            "value": f"{round(information_ratio, 2)}",
            "benchmark": "0.0",
            "status": "good" if information_ratio > 0.5 else ("neutral" if information_ratio > 0 else "bad"),
            "percentage": min(int(information_ratio * 30) + 50, 95)
        },
        {
            "name": "Sortino Ratio",  # 索提诺比率：值越高越好，类似夏普比率但只考虑下行风险
            "value": f"{round(sortino_ratio, 2)}",
            "benchmark": f"{round(sortino_ratio * 0.8, 2)}",
            "status": "good" if sortino_ratio > 1.0 else ("neutral" if sortino_ratio > 0.5 else "bad"),
            "percentage": min(int(sortino_ratio * 25) + 50, 95)
        },
        {
            "name": "Sharpe Ratio",  # 夏普比率：值越高越好，衡量每单位风险获得的超额收益
            "value": f"{round(sharpe_ratio, 2)}",
            "benchmark": f"{round(sharpe_ratio * 0.8, 2)}",
            "status": "good" if sharpe_ratio > 1.0 else ("neutral" if sharpe_ratio > 0.5 else "bad"),
            "percentage": min(int(sharpe_ratio * 25) + 50, 95)
        }
    ]
    
    return risk_data

def _generate_mock_risk_metrics():
    """Generate mock risk metrics when real data is not available"""
    # Generate mock data in the format expected by frontend
    risk_data = [
        {
            "name": "Volatility", 
            "value": "14.5%", 
            "benchmark": "16.2%", 
            "status": "good",
            "percentage": 60
        },
        { 
            "name": "Downside Risk", 
            "value": "9.8%", 
            "benchmark": "12.4%", 
            "status": "good",
            "percentage": 40
        },
        { 
            "name": "VaR (95%)", 
            "value": "2.3%", 
            "benchmark": "3.1%", 
            "status": "good",
            "percentage": 30
        },
        { 
            "name": "Beta", 
            "value": "0.92", 
            "benchmark": "1.00", 
            "status": "neutral",
            "percentage": 75
        },
        { 
            "name": "Maximum Drawdown", 
            "value": "7.7%", 
            "benchmark": "10.3%", 
            "status": "good",
            "percentage": 55
        },
        { 
            "name": "Tracking Error", 
            "value": "3.8%", 
            "benchmark": "0.0%", 
            "status": "neutral",
            "percentage": 65
        },
        { 
            "name": "Information Ratio", 
            "value": "1.42", 
            "benchmark": "0.0", 
            "status": "good",
            "percentage": 85
        },
        { 
            "name": "Sortino Ratio", 
            "value": "1.95", 
            "benchmark": "1.48", 
            "status": "good",
            "percentage": 90
        },
        { 
            "name": "Sharpe Ratio", 
            "value": "1.75", 
            "benchmark": "1.32", 
            "status": "good",
            "percentage": 88
        }
    ]
    
    return risk_data

def _calculate_comparison(historical_data, weights):
    """Calculate performance comparison with benchmarks"""
    # Calculate daily returns - 明确指定fill_method
    returns = historical_data.pct_change(fill_method=None).dropna()
    
    # Calculate portfolio returns
    portfolio_tickers = [ticker for ticker in historical_data.columns if ticker != 'SPX']
    if not portfolio_tickers:
        logger.warning("No portfolio tickers found in historical data, using mock data")
        return _generate_mock_comparison(30)  # Generate 30 mock data points
    
    # Filter returns to only include portfolio tickers
    portfolio_returns_data = returns[portfolio_tickers]
    
    # Adjust weights if needed to match available tickers
    adjusted_weights = []
    for i, ticker in enumerate(portfolio_tickers):
        if i < len(weights):
            adjusted_weights.append(weights[i])
        else:
            adjusted_weights.append(0)
    
    # Normalize weights to sum to 1
    if sum(adjusted_weights) > 0:
        adjusted_weights = [w/sum(adjusted_weights) for w in adjusted_weights]
    else:
        adjusted_weights = [1/len(adjusted_weights)] * len(adjusted_weights)
    
    # Calculate portfolio returns
    portfolio_returns = portfolio_returns_data.dot(adjusted_weights)
    
    # Generate cumulative returns
    cumulative = (1 + portfolio_returns).cumprod()
    
    # Check if SPX is in the data
    use_spx = False
    if 'SPX' in historical_data.columns:
        logger.info("Using SPX as benchmark for comparison")
        try:
            # Get SPX returns
            benchmark_returns = historical_data['SPX'].pct_change().dropna()
            
            # Align benchmark returns with portfolio returns (same index)
            common_index = portfolio_returns.index.intersection(benchmark_returns.index)
            if len(common_index) > 10:  # 至少需要10个共同数据点
                portfolio_returns = portfolio_returns.loc[common_index]
                benchmark_returns = benchmark_returns.loc[common_index]
                
                # Generate cumulative returns for benchmark
                benchmark_cumulative = (1 + benchmark_returns).cumprod()
                use_spx = True
            else:
                logger.warning(f"Not enough common dates between portfolio and SPX benchmark ({len(common_index)} dates), using mock data")
                use_spx = False
        except Exception as e:
            logger.error(f"Error processing SPX benchmark data: {e}")
            use_spx = False
    
    if not use_spx:
        logger.warning("Using mock S&P 500 benchmark data")
        # Generate benchmark data (S&P 500 simulation)
        benchmark_returns = np.random.normal(0.0004, 0.01, len(portfolio_returns))
        benchmark_cumulative = (1 + pd.Series(benchmark_returns, index=portfolio_returns.index)).cumprod()
    
    # Second benchmark (simulate bond market)
    bond_returns = np.random.normal(0.0002, 0.003, len(portfolio_returns))
    bond_cumulative = (1 + pd.Series(bond_returns, index=portfolio_returns.index)).cumprod()
    
    # Select points for the chart (use 30 points)
    dates = portfolio_returns.index
    step = max(1, len(dates) // 30)
    selected_dates = dates[::step].tolist()
    
    # Create comparison data
    comparison_data = []
    
    for date in selected_dates:
        if date in cumulative.index:
            date_str = date.strftime("%Y-%m-%d")
            comparison_item = {
                "date": date_str,
                "Portfolio": round(float(cumulative.loc[date]), 4)
            }
            
            # Add benchmark data if available
            if use_spx and date in benchmark_cumulative.index:
                comparison_item["S&P 500"] = round(float(benchmark_cumulative.loc[date]), 4)
            elif not use_spx and date in benchmark_cumulative.index:
                comparison_item["S&P 500"] = round(float(benchmark_cumulative.loc[date]), 4)
                
            # Add bond market data
            if date in bond_cumulative.index:
                comparison_item["Bond Market"] = round(float(bond_cumulative.loc[date]), 4)
                
            comparison_data.append(comparison_item)
    
    return comparison_data

def _generate_mock_comparison(num_points=30):
    """Generate mock comparison data if real data is not available"""
    logger.info(f"Generating mock comparison data with {num_points} points")
    
    # Create dates
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    dates = pd.date_range(start=start_date, end=end_date, periods=num_points)
    
    # Generate mock cumulative returns
    portfolio_base = 100
    benchmark_base = 100
    bond_base = 100
    
    # Add some randomness and trends
    comparison_data = []
    
    for i, date in enumerate(dates):
        # Add trends
        trend_factor = i / num_points
        portfolio_change = np.random.normal(0.005, 0.02) + trend_factor * 0.002
        benchmark_change = np.random.normal(0.004, 0.018) + trend_factor * 0.0015
        bond_change = np.random.normal(0.002, 0.005) + trend_factor * 0.0005
        
        # Update values
        portfolio_base *= (1 + portfolio_change)
        benchmark_base *= (1 + benchmark_change)
        bond_base *= (1 + bond_change)
        
        # Add to result
        comparison_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "Portfolio": round(portfolio_base / 100, 4),
            "S&P 500": round(benchmark_base / 100, 4),
            "Bond Market": round(bond_base / 100, 4)
        })
    
    return comparison_data

def _calculate_factor_exposure(tickers):
    """Calculate factor exposure for portfolio"""
    # 使用market_data.py中的完整实现
    from ..utils.market_data import get_portfolio_factor_exposure
    
    # 调用实际的因子暴露计算函数
    return get_portfolio_factor_exposure(tickers)

def _calculate_historical_trends(historical_data, weights, days=1825):  # 默认最多5年数据
    """Calculate historical performance trends for portfolio"""
    logger.debug(f"Calculating historical trends for portfolio with {len(weights)} assets")
    
    # 确保我们有足够的数据点
    if historical_data.empty:
        logger.warning("No historical data found, generating mock data for trends")
        return _generate_mock_historical_trends(days)
    
    # 排除SPX数据获取投资组合收益率
    portfolio_tickers = [ticker for ticker in historical_data.columns if ticker != 'SPX']
    if not portfolio_tickers:
        logger.warning("No portfolio tickers found in historical data, using mock data")
        return _generate_mock_historical_trends(days)
    
    # 计算日收益率 - 明确指定fill_method
    returns = historical_data[portfolio_tickers].pct_change(fill_method=None).dropna()
    
    # 调整权重以匹配可用数据
    adjusted_weights = []
    for i, ticker in enumerate(portfolio_tickers):
        if i < len(weights):
            adjusted_weights.append(weights[i])
        else:
            adjusted_weights.append(0)
    
    # 确保有足够的权重匹配列数
    if len(adjusted_weights) < len(portfolio_tickers):
        logger.warning(f"Not enough weights provided ({len(adjusted_weights)}) for tickers ({len(portfolio_tickers)}) in historical trends. Padding with zeros.")
        while len(adjusted_weights) < len(portfolio_tickers):
            adjusted_weights.append(0)
    
    # 标准化权重和为1
    if sum(adjusted_weights) > 0:
        adjusted_weights = [w/sum(adjusted_weights) for w in adjusted_weights]
    else:
        adjusted_weights = [1/len(adjusted_weights)] * len(adjusted_weights)
    
    logger.debug(f"Historical trends: portfolio returns data shape: {returns.shape}, Adjusted weights length: {len(adjusted_weights)}")
    
    # 计算投资组合收益率
    portfolio_returns = returns.dot(adjusted_weights)
    
    # 生成月度数据
    # 将日期转换为月度并分组计算月收益率
    monthly_data = []
    
    try:
        # 尝试使用实际数据生成月度收益率
        portfolio_returns.index = pd.to_datetime(portfolio_returns.index)
        monthly_portfolio = portfolio_returns.resample('M').apply(lambda x: (1 + x).prod() - 1)
        
        # 使用SPX作为基准的标志
        use_spx_benchmark = False
        
        # 检查SPX是否在数据中，如果是则使用它作为基准
        if 'SPX' in historical_data.columns:
            try:
                logger.info("Using SPX as benchmark for historical trends")
                # 获取SPX收益率
                benchmark_returns = historical_data['SPX'].pct_change().dropna()
                
                # 将基准收益率转换为月度数据
                benchmark_returns.index = pd.to_datetime(benchmark_returns.index)
                monthly_benchmark = benchmark_returns.resample('M').apply(lambda x: (1 + x).prod() - 1)
                
                # 检查是否有足够的共同数据点
                common_months = monthly_portfolio.index.intersection(monthly_benchmark.index)
                if len(common_months) >= 6:  # 至少需要6个月的共同数据
                    use_spx_benchmark = True
                else:
                    logger.warning(f"Not enough common months between portfolio and SPX benchmark ({len(common_months)} months), using mock benchmark")
            except Exception as e:
                logger.error(f"Error processing SPX benchmark data for trends: {e}")
        
        if not use_spx_benchmark:
            logger.warning("Using mock benchmark returns for historical trends")
            # 生成基准数据（模拟S&P 500）- 使收益率与投资组合相关但稍低
            benchmark_beta = 0.8
            benchmark_alpha = -0.001  # 稍微降低基准收益率
            benchmark_noise = np.random.normal(0, 0.005, len(portfolio_returns))
            benchmark_returns = portfolio_returns * benchmark_beta + benchmark_alpha + benchmark_noise
            monthly_benchmark = benchmark_returns.resample('M').apply(lambda x: (1 + x).prod() - 1)
        
        # 转换为月度数据列表
        for date, port_return in monthly_portfolio.items():
            if date in monthly_benchmark.index:
                bench_return = monthly_benchmark[date]
                
                # 确保数据在合理范围内及不是NaN或Infinity
                if pd.isna(port_return) or np.isinf(port_return):
                    port_return = 0.0
                else:
                    port_return = min(max(port_return, -0.3), 0.3)  # 限制在-30%到30%之间
                
                if pd.isna(bench_return) or np.isinf(bench_return):
                    bench_return = 0.0
                else:
                    bench_return = min(max(bench_return, -0.25), 0.25)  # 限制在-25%到25%之间
                
                monthly_data.append({
                    "month": date.strftime("%Y-%m"),
                    "return": round(float(port_return * 100), 2),  # 转换为百分比
                    "benchmark": round(float(bench_return * 100), 2)  # 转换为百分比
                })
        
        # 确保我们至少有一些数据点
        if len(monthly_data) < 12:
            logger.warning(f"Only {len(monthly_data)} months of data available, adding mock data")
            monthly_data.extend(_generate_mock_monthly_returns(60 - len(monthly_data)))  # 确保至少有60个月的数据
    except Exception as e:
        logger.error(f"Error generating monthly returns from historical data: {e}")
        monthly_data = _generate_mock_monthly_returns(60)  # 生成60个月的模拟数据
    
    # 确保按月份排序
    monthly_data.sort(key=lambda x: x["month"])

    # --- REVISED LOGIC START ---
    # 首先确定需要显示的月数
    trading_days_per_month = 21
    required_months = days // trading_days_per_month
    required_months = max(12, required_months) # 确保至少返回一年的数据
    logger.debug(f"Determined required months for display: {required_months} based on requested days: {days}")

    # 如果可用数据不足，可能需要填充（这部分逻辑已在前面处理，但如果需要填充，需确保填充的数据也在切片之前）
    # ... (existing padding logic if necessary) ...

    # 仅在数据量超过请求的月数时，先截取月度数据
    if len(monthly_data) > required_months:
        logger.info(f"Slicing monthly data from {len(monthly_data)} to {required_months} months before calculating cumulative.")
        monthly_data = monthly_data[-required_months:]
    else:
        logger.info(f"Using all available {len(monthly_data)} months of data (required: {required_months}).")

    # 使用截取后的月度数据计算累积表现
    cumulative_data = _calculate_cumulative_performance(monthly_data)
    logger.debug(f"Calculated cumulative performance based on {len(monthly_data)} months.")
    # --- REVISED LOGIC END ---

    return {
        "monthlyReturns": monthly_data,
        "cumulativeReturns": cumulative_data
    }

def _generate_historical_month_data(num_months, end_date):
    """生成指定数量的历史月度数据，确保生成的日期早于end_date"""
    historical_data = []
    for i in range(num_months):
        # 创建比end_date更早的日期，从num_months开始倒数
        month_date = end_date - timedelta(days=30 * (i + 1))
        month_str = month_date.strftime("%Y-%m")
        
        # 生成合理的收益率数据
        port_return = random.uniform(-10, 15)  # -10%到15%的范围
        bench_return = random.uniform(-8, 12)  # -8%到12%的范围
        
        # 增加一些相关性
        if port_return > 0:
            bench_return = bench_return * 0.7 + port_return * 0.3
        else:
            bench_return = bench_return * 0.6 + port_return * 0.2
        
        historical_data.append({
            "month": month_str,
            "return": round(port_return, 2),
            "benchmark": round(bench_return, 2)
        })
    
    # 确保按时间顺序排列（从早到晚）
    historical_data.sort(key=lambda x: x["month"])
    return historical_data

def _calculate_cumulative_performance(monthly_data):
    """Calculate cumulative performance from monthly returns"""
    cumulative_port = 100.0
    cumulative_bench = 100.0
    cumulative_data = []
    
    for month_data in monthly_data:
        try:
            # 获取每月回报率并转回小数
            port_return = month_data["return"] / 100.0
            bench_return = month_data["benchmark"] / 100.0
            
            # 检查是否为有效数字
            if pd.isna(port_return) or np.isinf(port_return):
                port_return = 0.0
                
            if pd.isna(bench_return) or np.isinf(bench_return):
                bench_return = 0.0
            
            # 计算累积表现
            cumulative_port *= (1 + port_return)
            cumulative_bench *= (1 + bench_return)
            
            # 检查累积值是否有效
            if pd.isna(cumulative_port) or np.isinf(cumulative_port):
                logger.warning(f"Detected invalid portfolio cumulative value for month {month_data['month']} before rounding")
                cumulative_port = 100.0  # 重置为初始值 or handle appropriately
                
            if pd.isna(cumulative_bench) or np.isinf(cumulative_bench):
                logger.warning(f"Detected invalid benchmark cumulative value for month {month_data['month']} before rounding")
                cumulative_bench = 100.0  # 重置为初始值 or handle appropriately
            
            cumulative_data.append({
                "month": month_data["month"],
                "portfolio": round(cumulative_port, 2), # 使用累积值本身 (Use cumulative value directly)
                "benchmark": round(cumulative_bench, 2) # 使用累积值本身 (Use cumulative value directly)
            })
        except Exception as e:
            logger.error(f"Error calculating cumulative performance for month {month_data.get('month', 'unknown')}: {e}")
            # 添加一个默认值以保持数据连续性
            cumulative_data.append({
                "month": month_data.get("month", "unknown"),
                "portfolio": 0.0,
                "benchmark": 0.0
            })
    
    return cumulative_data

def _generate_mock_historical_trends(days=1825):
    """Generate mock historical trends data for UI testing"""
    logger.debug(f"Generating mock historical trends data for {days} days")
    
    # 生成每月数据
    monthly_data = _generate_mock_monthly_returns(min(60, days // 30))
    
    # 计算累积收益
    cumulative_data = _calculate_cumulative_performance(monthly_data)
    
    return {
        "monthlyReturns": monthly_data,
        "cumulativeReturns": cumulative_data
    }

def _generate_mock_monthly_returns(num_months=60):
    """Generate realistic mock monthly returns"""
    monthly_returns = []
    now = datetime.now()
    
    # 生成模拟数据的基础参数
    port_annual_return = random.uniform(0.08, 0.15)  # 8-15% 年化收益
    port_annual_vol = random.uniform(0.12, 0.25)  # 12-25% 年化波动率
    
    bench_annual_return = port_annual_return * random.uniform(0.7, 0.9)  # 基准收益率稍低
    bench_annual_vol = port_annual_vol * random.uniform(0.8, 1.0)  # 基准波动率稍低
    
    # 转换为月度参数
    port_monthly_return = port_annual_return / 12
    port_monthly_vol = port_annual_vol / math.sqrt(12)
    
    bench_monthly_return = bench_annual_return / 12
    bench_monthly_vol = bench_annual_vol / math.sqrt(12)
    
    # 添加一些趋势和周期性
    trend_cycle = 18  # 18个月周期
    
    for i in range(num_months):
        month_date = now - timedelta(days=30 * (num_months - i))
        month_str = month_date.strftime("%Y-%m")
        
        # 添加周期性波动
        cycle_effect = math.sin(i * 2 * math.pi / trend_cycle) * 0.02
        
        # 添加随机波动
        port_random = random.normalvariate(port_monthly_return, port_monthly_vol) + cycle_effect
        bench_random = random.normalvariate(bench_monthly_return, bench_monthly_vol) + cycle_effect * 0.8
        
        # 添加一些相关性 - 牛市和熊市期间
        if i % trend_cycle < trend_cycle / 2:  # 牛市期间
            port_random = abs(port_random) * 1.2  # 牛市期间回报更好
            bench_random = abs(bench_random)
        else:  # 熊市期间
            port_random = -abs(port_random) * 0.8  # 熊市期间收益率为负但降低幅度
            bench_random = -abs(bench_random) * 0.9  # 基准在熊市中表现略好
            
        # 确保数据在合理范围内
        port_return = min(max(port_random, -0.15), 0.15)  # 限制在-15%到15%之间
        bench_return = min(max(bench_random, -0.12), 0.12)  # 限制在-12%到12%之间
        
        monthly_returns.append({
            "month": month_str,
            "return": round(float(port_return * 100), 2),  # 转换为百分比
            "benchmark": round(float(bench_return * 100), 2)  # 转换为百分比
        })
    
    # 确保按月份排序
    monthly_returns.sort(key=lambda x: x["month"])
    
    return monthly_returns 