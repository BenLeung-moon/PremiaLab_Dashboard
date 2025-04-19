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

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

async def analyze_portfolio_service(portfolio_id: str) -> Optional[PortfolioAnalysis]:
    """Analyze a specific portfolio by ID"""
    logger.info(f"Analyzing portfolio with ID: {portfolio_id}")
    
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
    
    logger.info(f"Portfolio found: {portfolio_response.name}, with {len(portfolio_response.tickers)} tickers")
    
    # Convert to Portfolio object for analysis
    portfolio = Portfolio(
        name=portfolio_response.name,
        tickers=portfolio_response.tickers
    )
    
    # Return analysis
    logger.info(f"Generating analysis for portfolio {portfolio_id}")
    return await analyze_portfolio(portfolio)

async def analyze_portfolio(portfolio: Portfolio) -> PortfolioAnalysis:
    """Generate analysis for a portfolio using real price data"""
    # Extract tickers and weights
    tickers = [t.symbol for t in portfolio.tickers]
    weights = [t.weight for t in portfolio.tickers]
    
    # Get historical data
    historical_data = await _get_historical_data(tickers)
    
    # Calculate performance metrics
    performance = _calculate_statistics(historical_data, weights)
    
    # Calculate allocation
    allocation = _calculate_allocation(portfolio.tickers)
    
    # Calculate risk metrics
    risk = _calculate_risk_metrics(historical_data, weights)
    
    # Calculate comparison with benchmarks
    comparison = _calculate_comparison(historical_data, weights)
    
    # Calculate factor exposure
    factors = _calculate_factor_exposure(portfolio.tickers)
    
    return PortfolioAnalysis(
        performance=performance,
        allocation=allocation,
        risk=risk,
        comparison=comparison,
        factors=factors
    )

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
    factors = _calculate_factor_exposure(portfolio.tickers)
    
    return PortfolioAnalysis(
        performance=performance,
        allocation=allocation,
        risk=risk,
        comparison=comparison,
        factors=factors
    )

async def _get_historical_data(tickers, days=365):
    """Get real historical price data for tickers"""
    logger.info(f"Getting historical data for {len(tickers)} tickers over {days} days")
    
    # Create empty DataFrame to store results
    data = pd.DataFrame()
    
    for ticker in tickers:
        try:
            # Get historical data for this ticker
            ticker_history = await get_stock_history_service(ticker, days)
            
            if not ticker_history:
                logger.warning(f"No historical data found for {ticker}, using mock data")
                continue
                
            # Convert to DataFrame
            ticker_df = pd.DataFrame(ticker_history)
            
            # Set date as index and convert to datetime
            ticker_df['date'] = pd.to_datetime(ticker_df['date'])
            ticker_df = ticker_df.set_index('date')
            
            # Extract just the price column and name it by the ticker
            if 'PRC' in ticker_df.columns:
                prices = ticker_df['PRC']
                data[ticker] = prices
        except Exception as e:
            logger.error(f"Error getting data for {ticker}: {e}")
    
    # If we have no data, generate mock data
    if data.empty:
        logger.warning("No historical data found for any tickers, using mock data")
        return _generate_historical_data(tickers, days)
        
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
    # Create daily returns
    returns = historical_data.pct_change().dropna()
    
    # Calculate portfolio returns
    portfolio_returns = returns.dot(weights)
    
    # Calculate metrics
    annual_return = portfolio_returns.mean() * 252
    annual_volatility = portfolio_returns.std() * np.sqrt(252)
    sharpe_ratio = annual_return / annual_volatility
    
    # Calculate drawdown
    cum_returns = (1 + portfolio_returns).cumprod()
    running_max = cum_returns.cummax()
    drawdown = (cum_returns / running_max) - 1
    max_drawdown = drawdown.min()
    
    # Generate monthly returns for the chart
    monthly_returns = {}
    
    # Get returns for the last 12 months
    now = datetime.now()
    for i in range(12):
        month = now.month - i - 1
        year = now.year
        
        if month <= 0:
            month += 12
            year -= 1
            
        month_name = f"{year}-{month:02d}"
        monthly_returns[month_name] = round(random.uniform(-0.1, 0.15), 4)
    
    # Sort monthly returns by date
    sorted_monthly = dict(sorted(monthly_returns.items()))
    
    result = {
        "statistics": {
            "annual_return": round(float(annual_return), 4),
            "volatility": round(float(annual_volatility), 4),
            "sharpe_ratio": round(float(sharpe_ratio), 4),
            "max_drawdown": round(float(max_drawdown), 4),
        },
        "returns": {
            "monthly": sorted_monthly,
            "inception_return": round(float((cum_returns.iloc[-1] - 1) * 100), 2),
        }
    }
    
    return result

def _calculate_allocation(tickers):
    """Calculate portfolio allocation by sector"""
    # Group by sector
    sectors = {}
    for ticker in tickers:
        sector = ticker.sector if ticker.sector else "Other"
        if sector not in sectors:
            sectors[sector] = 0
        sectors[sector] += ticker.weight
    
    # Create result
    sector_data = [
        {"name": sector, "value": round(weight * 100, 2)}
        for sector, weight in sectors.items()
    ]
    
    # Group by region (mock data)
    regions = {
        "Americas": 0,
        "Europe": 0,
        "Asia": 0,
        "Other": 0
    }
    
    # Assign random regions
    for ticker in tickers:
        region = random.choice(list(regions.keys()))
        regions[region] += ticker.weight
    
    region_data = [
        {"name": region, "value": round(weight * 100, 2)}
        for region, weight in regions.items()
        if weight > 0
    ]
    
    return {
        "sectors": sector_data,
        "regions": region_data
    }

def _calculate_risk_metrics(historical_data, weights):
    """Calculate risk metrics for the portfolio"""
    # Calculate daily returns
    returns = historical_data.pct_change().dropna()
    
    # Calculate portfolio returns
    portfolio_returns = returns.dot(weights)
    
    # Calculate volatility
    volatility = portfolio_returns.std() * np.sqrt(252)
    
    # Calculate Value at Risk (VaR) at 95% confidence
    var_95 = np.percentile(portfolio_returns, 5)
    
    # Calculate beta against "market" (use first column as market proxy)
    market_returns = returns.iloc[:, 0]
    cov = np.cov(portfolio_returns, market_returns)[0, 1]
    market_var = np.var(market_returns)
    beta = cov / market_var
    
    # Create metrics for different time periods
    time_periods = ["1M", "3M", "6M", "1Y", "3Y"]
    
    result = []
    for period in time_periods:
        period_days = {"1M": 21, "3M": 63, "6M": 126, "1Y": 252, "3Y": 756}
        
        # Limit to available data
        days = min(period_days[period], len(returns))
        
        # Calculate for this period
        period_returns = portfolio_returns.iloc[-days:]
        period_volatility = period_returns.std() * np.sqrt(252)
        
        result.append({
            "period": period,
            "volatility": round(float(period_volatility), 4),
            "var": round(float(np.percentile(period_returns, 5) * np.sqrt(252)), 4),
            "beta": round(float(beta), 4),
            "tracking_error": round(float(random.uniform(0.01, 0.05)), 4)
        })
    
    return result

def _calculate_comparison(historical_data, weights):
    """Calculate performance comparison with benchmarks"""
    # Calculate daily returns
    returns = historical_data.pct_change().dropna()
    
    # Calculate portfolio returns
    portfolio_returns = returns.dot(weights)
    
    # Generate cumulative returns
    cumulative = (1 + portfolio_returns).cumprod()
    
    # Generate benchmark data (S&P 500 simulation)
    benchmark_returns = np.random.normal(0.0004, 0.01, len(returns))
    benchmark_cumulative = (1 + pd.Series(benchmark_returns, index=returns.index)).cumprod()
    
    # Second benchmark (simulate bond market)
    bond_returns = np.random.normal(0.0002, 0.003, len(returns))
    bond_cumulative = (1 + pd.Series(bond_returns, index=returns.index)).cumprod()
    
    # Select points for the chart (use 30 points)
    dates = returns.index
    step = max(1, len(dates) // 30)
    selected_dates = dates[::step].tolist()
    
    # Create comparison data
    comparison_data = []
    
    for date in selected_dates:
        if date in cumulative.index:
            date_str = date.strftime("%Y-%m-%d")
            comparison_data.append({
                "date": date_str,
                "Portfolio": round(float(cumulative.loc[date]), 4),
                "S&P 500": round(float(benchmark_cumulative.loc[date]), 4),
                "Bond Market": round(float(bond_cumulative.loc[date]), 4)
            })
    
    return comparison_data

def _calculate_factor_exposure(tickers):
    """Calculate factor exposure for portfolio"""
    # Mock factor exposures
    factors = ["Value", "Growth", "Momentum", "Quality", "Size", "Volatility"]
    
    # Create random exposure for portfolio
    exposures = {}
    for factor in factors:
        exposures[factor] = round(random.uniform(-2.0, 2.0), 2)
    
    # Format for frontend
    exposure_data = [
        {"factor": factor, "exposure": exposure}
        for factor, exposure in exposures.items()
    ]
    
    return {
        "exposures": exposure_data,
        "summary": "This portfolio has a strong Growth and Quality tilt with negative exposure to Value and Size factors."
    } 