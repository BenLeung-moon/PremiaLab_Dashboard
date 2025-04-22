from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from ...models.portfolio import Portfolio, PortfolioInDB, PortfolioResponse, PortfolioAnalysis
from ...services.portfolio_service import (
    create_portfolio_service,
    get_portfolios_service,
    get_portfolio_service,
    update_portfolio_service,
    delete_portfolio_service
)
from ...services.analysis_service import analyze_portfolio_service

# 设置日志
logger = logging.getLogger("app.api.routes.portfolio")

router = APIRouter()

@router.get("/", response_model=List[PortfolioResponse])
async def get_portfolios():
    """Get all portfolios"""
    return await get_portfolios_service()

@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(portfolio_id: str):
    """Get a specific portfolio by ID"""
    portfolio = await get_portfolio_service(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio

@router.post("/", response_model=PortfolioResponse)
async def create_portfolio(portfolio: Portfolio):
    """Create a new portfolio"""
    # Validate that total weight is approximately 1
    total_weight = sum(ticker.weight for ticker in portfolio.tickers)
    if abs(total_weight - 1.0) > 0.01:
        raise HTTPException(
            status_code=400, 
            detail=f"Total weight must equal 1, current total is {total_weight}"
        )
    
    return await create_portfolio_service(portfolio)

@router.put("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(portfolio_id: str, portfolio: Portfolio):
    """Update an existing portfolio"""
    # Validate that total weight is approximately 1
    total_weight = sum(ticker.weight for ticker in portfolio.tickers)
    if abs(total_weight - 1.0) > 0.01:
        raise HTTPException(
            status_code=400, 
            detail=f"Total weight must equal 1, current total is {total_weight}"
        )
    
    updated_portfolio = await update_portfolio_service(portfolio_id, portfolio)
    if not updated_portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return updated_portfolio

@router.delete("/{portfolio_id}")
async def delete_portfolio(portfolio_id: str):
    """Delete a portfolio"""
    success = await delete_portfolio_service(portfolio_id)
    if not success:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return {"status": "success", "message": f"Portfolio {portfolio_id} deleted"}

# 添加向后兼容的分析端点
@router.get("/{portfolio_id}/analyze", response_model=PortfolioAnalysis)
async def analyze_portfolio_compatibility(
    portfolio_id: str, 
    period: Optional[str] = Query("5year", description="Time period (ytd, 1year, 3year, 5year)")
):
    """Analyze a portfolio (backward compatibility endpoint)"""
    logger.info(f"Portfolio analysis requested for {portfolio_id} with period: {period}")
    analysis = await analyze_portfolio_service(portfolio_id, period)
    if not analysis:
        raise HTTPException(status_code=404, detail="Portfolio not found or analysis failed")
    return analysis 