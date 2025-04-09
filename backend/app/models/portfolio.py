from pydantic import BaseModel, validator, Field
from typing import List, Optional
from datetime import datetime

class Ticker(BaseModel):
    symbol: str = Field(..., description="股票代码")
    weight: float = Field(..., description="权重", ge=0, le=1)

    @validator('symbol')
    def validate_symbol(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError("股票代码不能为空")
        return v.upper()
    
    @validator('weight')
    def validate_weight(cls, v):
        if v < 0 or v > 1:
            raise ValueError("权重必须在0到1之间")
        return v

class Portfolio(BaseModel):
    name: str = Field(..., description="投资组合名称")
    tickers: List[Ticker] = Field(..., description="股票列表")

    @validator('tickers')
    def validate_tickers(cls, v):
        if not v or len(v) == 0:
            raise ValueError("股票列表不能为空")
        return v

class PortfolioInDB(Portfolio):
    id: str = Field(..., description="唯一标识符")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    user_id: Optional[str] = Field(None, description="用户ID")

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