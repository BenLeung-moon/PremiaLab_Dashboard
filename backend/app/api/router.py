from fastapi import APIRouter, HTTPException
from typing import List
from ..models.portfolio import Portfolio, PortfolioInDB

router = APIRouter()

# 模拟数据库 (在实际应用中应该从数据库中获取)
from datetime import datetime
portfolios = [
    {
        "id": "1",
        "name": "科技股组合",
        "tickers": [
            {"symbol": "AAPL", "weight": 0.25},
            {"symbol": "MSFT", "weight": 0.25},
            {"symbol": "GOOGL", "weight": 0.2},
            {"symbol": "AMZN", "weight": 0.15},
            {"symbol": "META", "weight": 0.15}
        ],
        "created_at": datetime.now(),
        "user_id": "user1"
    },
    {
        "id": "2",
        "name": "稳健型投资",
        "tickers": [
            {"symbol": "VTI", "weight": 0.4},
            {"symbol": "BND", "weight": 0.3},
            {"symbol": "VXUS", "weight": 0.2},
            {"symbol": "GLD", "weight": 0.1}
        ],
        "created_at": datetime.now(),
        "user_id": "user1"
    }
]

@router.get("/portfolios", response_model=List[PortfolioInDB])
async def get_portfolios():
    """获取所有投资组合"""
    return portfolios

@router.get("/portfolios/{portfolio_id}", response_model=PortfolioInDB)
async def get_portfolio(portfolio_id: str):
    """获取特定ID的投资组合"""
    for portfolio in portfolios:
        if portfolio["id"] == portfolio_id:
            return portfolio
    raise HTTPException(status_code=404, detail="投资组合不存在")

@router.post("/portfolios", response_model=PortfolioInDB)
async def create_portfolio(portfolio: Portfolio):
    """创建新的投资组合"""
    # 验证权重总和
    total_weight = sum(ticker.weight for ticker in portfolio.tickers)
    if abs(total_weight - 1.0) > 0.01:
        raise HTTPException(status_code=400, detail=f"权重总和必须为1，当前是{total_weight}")
    
    # 创建新投资组合
    new_portfolio = {
        "id": str(len(portfolios) + 1),
        "name": portfolio.name,
        "tickers": [{"symbol": t.symbol, "weight": t.weight} for t in portfolio.tickers],
        "created_at": datetime.now(),
        "user_id": "user1"  # 假设用户ID
    }
    
    portfolios.append(new_portfolio)
    return new_portfolio 