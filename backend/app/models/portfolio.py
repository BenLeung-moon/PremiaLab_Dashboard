from pydantic import BaseModel, validator, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class Ticker(BaseModel):
    symbol: str = Field(..., description="Stock symbol")
    weight: float = Field(..., description="Weight", ge=0, le=1)
    name: Optional[str] = Field(None, description="Stock name")
    sector: Optional[str] = Field(None, description="Stock sector")
    price: Optional[float] = Field(None, description="Current price")
    change: Optional[float] = Field(None, description="Price change")

    @validator('symbol')
    def validate_symbol(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError("Stock symbol cannot be empty")
        return v.upper()
    
    @validator('weight')
    def validate_weight(cls, v):
        if v < 0 or v > 1:
            raise ValueError("Weight must be between 0 and 1")
        return v

class Portfolio(BaseModel):
    name: str = Field(..., description="Portfolio name")
    tickers: List[Ticker] = Field(..., description="List of stocks")

    @validator('tickers')
    def validate_tickers(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Stock list cannot be empty")
        return v

class PortfolioInDB(Portfolio):
    id: str = Field(..., description="Unique identifier")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation time")
    user_id: Optional[str] = Field(None, description="User ID")

class PortfolioResponse(BaseModel):
    id: str = Field(..., description="Unique identifier")
    name: str = Field(..., description="Portfolio name")
    created_at: str = Field(..., description="Creation time ISO format")
    tickers: List[Ticker] = Field(..., description="List of stocks")

class PerformanceMetrics(BaseModel):
    portfolio_id: str
    annual_return: float
    sharpe_ratio: float
    max_drawdown: float
    information_ratio: float
    alpha: float
    beta: float

class RiskMetrics(BaseModel):
    portfolio_id: str
    volatility: float
    downside_risk: float
    var_95: float
    beta: float
    tracking_error: float

class PortfolioAnalysis(BaseModel):
    performance: Dict[str, Any]
    allocation: Dict[str, Any]
    risk: List[Dict[str, Any]]
    comparison: List[Dict[str, Any]]
    factors: Dict[str, Any] 