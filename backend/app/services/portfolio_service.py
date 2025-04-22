"""
Portfolio Service - Handles business logic for portfolio operations
"""
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging
from ..models.portfolio import Portfolio, PortfolioResponse, Ticker

# Set up logging
logger = logging.getLogger(__name__)

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
    logger.info(f"Creating new portfolio: {portfolio.name}")
    portfolios = _load_portfolios()
    
    # 加载公司信息数据
    companies_data = {}
    companies_file = DATA_DIR / "companies.json"
    if companies_file.exists():
        try:
            with open(companies_file, "r") as f:
                companies_json = json.load(f)
                companies_data = companies_json.get("companies", {})
            logger.info(f"Loaded company data for {len(companies_data)} companies")
        except Exception as e:
            logger.error(f"Error loading companies.json: {e}")
    
    # Generate new ID with port- prefix
    new_id = f"port-{len(portfolios) + 1}"
    logger.info(f"Generated portfolio ID: {new_id}")
    
    # 处理每个股票，添加行业和地区信息
    enriched_tickers = []
    for ticker in portfolio.tickers:
        ticker_dict = ticker.dict()
        
        # 从companies.json获取额外信息
        if ticker.symbol in companies_data:
            company_info = companies_data[ticker.symbol]
            # 添加公司全名
            if "name" in company_info:
                ticker_dict["name"] = company_info["name"]
            # 添加行业信息
            if not ticker_dict.get("sector") and "sector" in company_info:
                ticker_dict["sector"] = company_info["sector"]
            # 添加地区信息
            if not ticker_dict.get("region") and "region" in company_info:
                ticker_dict["region"] = company_info["region"]
            # 添加行业细分信息
            if not ticker_dict.get("industry") and "industry" in company_info:
                ticker_dict["industry"] = company_info["industry"]
            
            logger.info(f"Enriched ticker {ticker.symbol} with sector: {ticker_dict.get('sector')}, region: {ticker_dict.get('region')}")
        else:
            logger.warning(f"No company info found for ticker {ticker.symbol}")
        
        enriched_tickers.append(ticker_dict)
    
    # Create portfolio data
    portfolio_data = {
        "id": new_id,
        "name": portfolio.name,
        "created_at": datetime.now().isoformat(),
        "user_id": "default_user",
        "tickers": enriched_tickers
    }
    
    # Log ticker info
    logger.info(f"Portfolio contains {len(portfolio.tickers)} tickers:")
    for ticker_dict in enriched_tickers:
        symbol = ticker_dict.get("symbol")
        weight = ticker_dict.get("weight")
        sector = ticker_dict.get("sector", "Unknown")
        logger.info(f"  - {symbol}: {weight} (Sector: {sector})")
    
    # Save to cache
    portfolios[new_id] = portfolio_data
    _portfolios_cache = portfolios
    
    # Save to file
    save_result = _save_portfolios()
    if save_result:
        logger.info(f"Portfolio {new_id} saved successfully")
    else:
        logger.error(f"Failed to save portfolio {new_id}")
    
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
    
    # 加载公司信息数据
    companies_data = {}
    companies_file = DATA_DIR / "companies.json"
    if companies_file.exists():
        try:
            with open(companies_file, "r") as f:
                companies_json = json.load(f)
                companies_data = companies_json.get("companies", {})
            logger.info(f"Loaded company data for {len(companies_data)} companies")
        except Exception as e:
            logger.error(f"Error loading companies.json: {e}")
    
    # 处理每个股票，添加行业和地区信息
    enriched_tickers = []
    for ticker in portfolio.tickers:
        ticker_dict = ticker.dict()
        
        # 从companies.json获取额外信息
        if ticker.symbol in companies_data:
            company_info = companies_data[ticker.symbol]
            # 添加公司全名
            if "name" in company_info:
                ticker_dict["name"] = company_info["name"]
            # 添加行业信息
            if not ticker_dict.get("sector") and "sector" in company_info:
                ticker_dict["sector"] = company_info["sector"]
            # 添加地区信息
            if not ticker_dict.get("region") and "region" in company_info:
                ticker_dict["region"] = company_info["region"]
            # 添加行业细分信息
            if not ticker_dict.get("industry") and "industry" in company_info:
                ticker_dict["industry"] = company_info["industry"]
            
            logger.info(f"Enriched ticker {ticker.symbol} with sector: {ticker_dict.get('sector')}, region: {ticker_dict.get('region')}")
        else:
            logger.warning(f"No company info found for ticker {ticker.symbol}")
        
        enriched_tickers.append(ticker_dict)
    
    # Update portfolio data
    portfolio_data = portfolios[portfolio_id]
    portfolio_data["name"] = portfolio.name
    portfolio_data["tickers"] = enriched_tickers
    
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