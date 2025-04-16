"""
Portfolio Service - Handles business logic for portfolio operations
"""
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..models.portfolio import Portfolio, PortfolioResponse, Ticker

# Data path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
PORTFOLIOS_FILE = DATA_DIR / "portfolios.json"

# In-memory cache for portfolios
_portfolios_cache = {}

def _load_portfolios() -> Dict[str, Any]:
    """Load portfolios from json file"""
    global _portfolios_cache
    
    if _portfolios_cache:
        return _portfolios_cache
    
    if PORTFOLIOS_FILE.exists():
        try:
            with open(PORTFOLIOS_FILE, "r") as f:
                _portfolios_cache = json.load(f)
        except Exception as e:
            print(f"Error loading portfolios: {e}")
            _portfolios_cache = {}
    else:
        _portfolios_cache = {}
    
    return _portfolios_cache

def _save_portfolios() -> bool:
    """Save portfolios to json file"""
    try:
        # Convert portfolio data to serializable format
        portfolios_to_save = {}
        
        for port_id, port_data in _portfolios_cache.items():
            portfolios_to_save[port_id] = {
                "id": port_data.get("id"),
                "name": port_data.get("name"),
                "created_at": port_data.get("created_at"),
                "user_id": port_data.get("user_id", "default_user"),
                "tickers": [
                    ticker if isinstance(ticker, dict) else ticker.dict() 
                    for ticker in port_data.get("tickers", [])
                ]
            }
        
        with open(PORTFOLIOS_FILE, "w") as f:
            json.dump(portfolios_to_save, f, indent=2, default=str)
        return True
    except Exception as e:
        print(f"Error saving portfolios: {e}")
        return False

def _portfolio_to_response(portfolio_data: Dict[str, Any]) -> PortfolioResponse:
    """Convert portfolio data to PortfolioResponse"""
    # Ensure ticker data is converted to Ticker objects
    tickers = []
    for ticker_data in portfolio_data.get("tickers", []):
        if isinstance(ticker_data, dict):
            tickers.append(Ticker(**ticker_data))
        else:
            tickers.append(ticker_data)
    
    # Format created_at as ISO string if it's a datetime
    created_at = portfolio_data.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    
    return PortfolioResponse(
        id=portfolio_data.get("id"),
        name=portfolio_data.get("name"),
        created_at=created_at,
        tickers=tickers
    )

async def get_portfolios_service() -> List[PortfolioResponse]:
    """Get all portfolios"""
    portfolios = _load_portfolios()
    return [_portfolio_to_response(portfolios[port_id]) for port_id in portfolios]

async def get_portfolio_service(portfolio_id: str) -> Optional[PortfolioResponse]:
    """Get a specific portfolio by ID"""
    portfolios = _load_portfolios()
    
    # 兼容"port-XX"格式的ID
    clean_id = portfolio_id.replace("port-", "")
    
    if clean_id in portfolios:
        return _portfolio_to_response(portfolios[clean_id])
    
    # 尝试原始ID格式
    if portfolio_id in portfolios:
        return _portfolio_to_response(portfolios[portfolio_id])
    
    return None

async def create_portfolio_service(portfolio: Portfolio) -> PortfolioResponse:
    """Create a new portfolio"""
    portfolios = _load_portfolios()
    
    # Generate new ID
    new_id = str(len(portfolios) + 1)
    
    # Create portfolio data
    portfolio_data = {
        "id": new_id,
        "name": portfolio.name,
        "created_at": datetime.now().isoformat(),
        "user_id": "default_user",
        "tickers": [ticker.dict() for ticker in portfolio.tickers]
    }
    
    # Save to cache
    portfolios[new_id] = portfolio_data
    _portfolios_cache = portfolios
    
    # Save to file
    _save_portfolios()
    
    return _portfolio_to_response(portfolio_data)

async def update_portfolio_service(portfolio_id: str, portfolio: Portfolio) -> Optional[PortfolioResponse]:
    """Update an existing portfolio"""
    portfolios = _load_portfolios()
    
    # 兼容"port-XX"格式的ID
    clean_id = portfolio_id.replace("port-", "")
    
    # 检查清理后的ID
    if clean_id in portfolios:
        portfolio_id = clean_id
    
    if portfolio_id not in portfolios:
        return None
    
    # Update portfolio data
    portfolio_data = portfolios[portfolio_id]
    portfolio_data["name"] = portfolio.name
    portfolio_data["tickers"] = [ticker.dict() for ticker in portfolio.tickers]
    
    # Save to cache
    portfolios[portfolio_id] = portfolio_data
    _portfolios_cache = portfolios
    
    # Save to file
    _save_portfolios()
    
    return _portfolio_to_response(portfolio_data)

async def delete_portfolio_service(portfolio_id: str) -> bool:
    """Delete a portfolio"""
    portfolios = _load_portfolios()
    
    # 兼容"port-XX"格式的ID
    clean_id = portfolio_id.replace("port-", "")
    
    # 检查清理后的ID
    if clean_id in portfolios:
        portfolio_id = clean_id
    
    if portfolio_id not in portfolios:
        return False
    
    # Remove from cache
    del portfolios[portfolio_id]
    _portfolios_cache = portfolios
    
    # Save to file
    return _save_portfolios() 