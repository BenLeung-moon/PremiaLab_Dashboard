from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional
from ...models.portfolio import Portfolio, PortfolioAnalysis
from ...services.analysis_service import (
    analyze_portfolio_service,
    mock_analyze_portfolio_service
)
from datetime import datetime
import logging

router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.get("/{portfolio_id}", response_model=PortfolioAnalysis)
async def get_portfolio_analysis(portfolio_id: str):
    """
    获取投资组合分析数据，包括风险指标、资产配置、基准比较、因子暴露和历史趋势
    """
    analysis = await analyze_portfolio_service(portfolio_id)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Portfolio with ID {portfolio_id} not found")
    return analysis

@router.get("/{portfolio_id}/risk", response_model=List[Dict[str, Any]])
async def get_portfolio_risk_metrics(portfolio_id: str):
    """
    获取投资组合的风险指标数据
    """
    logger = logging.getLogger(__name__)
    logger.info(f"风险指标请求 - 组合ID: {portfolio_id}")
    
    analysis = await analyze_portfolio_service(portfolio_id)
    
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Portfolio with ID {portfolio_id} not found")
    
    if not analysis.risk:
        logger.error(f"组合 {portfolio_id} 没有可用的风险指标数据")
        raise HTTPException(status_code=404, detail="Risk metrics data not available")
    
    logger.info(f"成功获取组合 {portfolio_id} 的风险指标，指标数量: {len(analysis.risk)}")
    return analysis.risk

@router.get("/{portfolio_id}/trends")
async def get_portfolio_historical_trends(portfolio_id: str, 
                                      period: Optional[str] = Query("5year", 
                                                                 description="Time period (ytd, 1year, 3year, 5year)")):
    """
    获取投资组合的历史趋势数据，用于图表展示
    """
    logger = logging.getLogger(__name__)
    logger.info(f"历史趋势请求 - 组合ID: {portfolio_id}, 时间段: {period}")
    
    analysis = await analyze_portfolio_service(portfolio_id, period)
    
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Portfolio with ID {portfolio_id} not found")
    
    if not analysis.historical_trends:
        logger.error(f"组合 {portfolio_id} 没有可用的历史趋势数据")
        raise HTTPException(status_code=404, detail="Historical trends data not available")
    
    # 获取月度收益和累计收益数据
    monthly_returns = analysis.historical_trends.get("monthlyReturns", [])
    cumulative_returns = analysis.historical_trends.get("cumulativeReturns", [])
    
    logger.info(f"原始月度收益数据点: {len(monthly_returns)}个, 累计收益数据点: {len(cumulative_returns)}个")
    
    # 根据请求的时间段筛选数据
    # 考虑交易日：后端已根据交易日计算好合适的月份数量
    # 我们只需根据不同时间段筛选相应的月份数
    filtered_monthly = monthly_returns
    filtered_cumulative = cumulative_returns
    
    if period == "ytd":
        # 年初至今
        current_year = str(datetime.now().year)
        filtered_monthly = [m for m in monthly_returns if m["month"].startswith(current_year)]
        filtered_cumulative = [c for c in cumulative_returns if c["month"].startswith(current_year)]
    elif period == "1year":
        # 最近12个月（每年约252个交易日 ≈ 12个月）
        filtered_monthly = monthly_returns[-12:] if len(monthly_returns) > 12 else monthly_returns
        filtered_cumulative = cumulative_returns[-12:] if len(cumulative_returns) > 12 else cumulative_returns
    elif period == "3year":
        # 最近36个月（约756个交易日 ≈ 36个月）
        filtered_monthly = monthly_returns[-36:] if len(monthly_returns) > 36 else monthly_returns
        filtered_cumulative = cumulative_returns[-36:] if len(cumulative_returns) > 36 else cumulative_returns
    elif period == "5year":
        # 最近60个月或全部可用数据(如果小于60个月)
        # 约1260个交易日 ≈ 60个月
        if len(monthly_returns) > 60:
            filtered_monthly = monthly_returns[-60:]
            filtered_cumulative = cumulative_returns[-60:]
        else:
            # 如果不足60个月，使用所有可用数据
            filtered_monthly = monthly_returns
            filtered_cumulative = cumulative_returns
    
    logger.info(f"筛选后月度收益数据点: {len(filtered_monthly)}个, 累计收益数据点: {len(filtered_cumulative)}个")
    
    return {
        "monthlyReturns": filtered_monthly,
        "cumulativeReturns": filtered_cumulative
    }

@router.post("/mock", response_model=PortfolioAnalysis)
async def mock_analyze_portfolio(portfolio: Portfolio):
    """Analyze a portfolio without saving it"""
    # Validate that total weight is approximately 1
    total_weight = sum(ticker.weight for ticker in portfolio.tickers)
    if abs(total_weight - 1.0) > 0.01:
        raise HTTPException(
            status_code=400, 
            detail=f"Total weight must equal 1, current total is {total_weight}"
        )
    
    return await mock_analyze_portfolio_service(portfolio) 