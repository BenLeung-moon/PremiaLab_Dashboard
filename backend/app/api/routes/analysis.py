from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ...models.portfolio import Portfolio, PortfolioAnalysis
from ...services.analysis_service import (
    analyze_portfolio_service,
    mock_analyze_portfolio_service
)

router = APIRouter()

@router.get("/portfolio/{portfolio_id}", response_model=PortfolioAnalysis)
async def analyze_portfolio(portfolio_id: str):
    """Analyze a specific portfolio by ID"""
    analysis = await analyze_portfolio_service(portfolio_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Portfolio not found or analysis failed")
    return analysis

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