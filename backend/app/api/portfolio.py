from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import datetime
import uuid
from ..utils.market_data import (
    get_portfolio_returns, 
    get_portfolio_factor_exposure, 
    compare_with_benchmark,
    get_asset_allocation
)

router = APIRouter()

class Ticker(BaseModel):
    symbol: str
    weight: float

class Portfolio(BaseModel):
    name: str
    tickers: List[Ticker]

@router.post("/portfolio")
async def create_portfolio(portfolio: Portfolio):
    """创建新的投资组合并返回分析结果"""
    
    # 验证权重总和是否为1
    total_weight = sum(ticker.weight for ticker in portfolio.tickers)
    if abs(total_weight - 1.0) > 0.001:  # 允许一点误差
        # 自动归一化权重
        for ticker in portfolio.tickers:
            ticker.weight = ticker.weight / total_weight
    
    # 生成唯一ID和时间戳
    portfolio_id = f"test-{uuid.uuid4().hex[:12]}"
    timestamp = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")
    
    # 转换为字典格式以适应分析函数
    portfolio_dict = {
        "name": portfolio.name,
        "tickers": [{"symbol": t.symbol, "weight": t.weight} for t in portfolio.tickers]
    }
    
    # 这里可以添加将投资组合保存到数据库的代码
    
    # 返回结果
    return {
        "id": portfolio_id,
        "created_at": timestamp,
        "portfolio": portfolio_dict
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