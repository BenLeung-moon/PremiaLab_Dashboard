"""
Stocks Service - Handles business logic for stock-related operations
"""
import json
import random
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
COMPANIES_FILE = DATA_DIR / "companies.json"
PRICE_HISTORY_FILE = DATA_DIR / "Constituent_Price_History.csv"
STOCK_MAPPING_FILE = DATA_DIR / "stock_mappings.json"

# Stock data cache
_stocks_cache = {}
_price_history_cache = {}
_stock_name_mapping_cache = {}

def _load_stock_name_mapping() -> Dict[str, Dict[str, str]]:
    """Load stock name mapping (English/Chinese) from file"""
    global _stock_name_mapping_cache
    
    if _stock_name_mapping_cache:
        return _stock_name_mapping_cache
    
    # 尝试从映射文件加载
    if STOCK_MAPPING_FILE.exists():
        try:
            with open(STOCK_MAPPING_FILE, "r", encoding="utf-8") as f:
                mappings = json.load(f)
                
                # 确保所有必要的映射字段存在
                if "names" not in mappings:
                    mappings["names"] = {}
                if "chinese_names" not in mappings:
                    mappings["chinese_names"] = {}  
                if "display_names" not in mappings:
                    mappings["display_names"] = {}
                
                _stock_name_mapping_cache = mappings
                logger.info(f"Loaded {len(mappings.get('display_names', {}))} stock name mappings")
                return mappings
        except Exception as e:
            logger.error(f"Error loading stock mappings: {e}")
            _stock_name_mapping_cache = {"names": {}, "chinese_names": {}, "display_names": {}}
    else:
        logger.warning(f"Stock mapping file not found: {STOCK_MAPPING_FILE}")
        _stock_name_mapping_cache = {"names": {}, "chinese_names": {}, "display_names": {}}
    
    return _stock_name_mapping_cache

def _get_stock_names(ticker: str) -> Dict[str, str]:
    """Get all name variants for a stock ticker"""
    mappings = _load_stock_name_mapping()
    
    # 默认值
    english_name = ""
    chinese_name = ""
    display_name = ""
    
    # 获取不同类型的名称
    if "names" in mappings and ticker in mappings["names"]:
        english_name = mappings["names"][ticker]
    
    if "chinese_names" in mappings and ticker in mappings["chinese_names"]:
        chinese_name = mappings["chinese_names"][ticker]
    
    if "display_names" in mappings and ticker in mappings["display_names"]:
        display_name = mappings["display_names"][ticker]
    
    # 如果没有显示名称但有其他名称，尝试创建
    if not display_name:
        if english_name and chinese_name:
            display_name = f"{english_name} / {chinese_name}"
        elif english_name:
            display_name = english_name
        elif chinese_name:
            display_name = chinese_name
    
    # 最后的回退
    if not display_name:
        display_name = ticker
    
    return {
        "english_name": english_name,
        "chinese_name": chinese_name,
        "display_name": display_name
    }

def _load_companies() -> Dict[str, Dict[str, Any]]:
    """Load company information from companies.json file"""
    global _stocks_cache
    
    if _stocks_cache:
        return _stocks_cache
    
    if COMPANIES_FILE.exists():
        try:
            with open(COMPANIES_FILE, "r") as f:
                data = json.load(f)
                # Extract companies from the JSON structure
                _stocks_cache = data.get("companies", {})
        except Exception as e:
            logger.error(f"Error loading companies: {e}")
            _stocks_cache = {}
    else:
        logger.warning(f"Companies file not found: {COMPANIES_FILE}")
        _stocks_cache = {}
    
    return _stocks_cache

def _load_price_history(ticker: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """Load price history data from CSV file
    
    Args:
        ticker: Optional ticker to filter data by
        
    Returns:
        Dictionary with tickers as keys and list of price data as values
    """
    global _price_history_cache
    
    if ticker and ticker in _price_history_cache:
        return {ticker: _price_history_cache[ticker]}
    
    if not _price_history_cache and PRICE_HISTORY_FILE.exists():
        try:
            # Read the CSV file
            # Use chunksize for large files
            chunk_size = 10000
            chunks = pd.read_csv(PRICE_HISTORY_FILE, chunksize=chunk_size)
            
            price_data = {}
            for chunk in chunks:
                # Process each chunk
                for code, group in chunk.groupby('code'):
                    if code not in price_data:
                        price_data[code] = []
                    
                    # Sort by date
                    group = group.sort_values('date', ascending=False)
                    
                    # Convert to dictionary
                    records = group.to_dict('records')
                    price_data[code].extend(records)
            
            _price_history_cache = price_data
        except Exception as e:
            logger.error(f"Error loading price history: {e}")
            _price_history_cache = {}
    
    if ticker:
        return {ticker: _price_history_cache.get(ticker, [])}
    
    return _price_history_cache

def _get_latest_price(ticker: str) -> Dict[str, Any]:
    """Get the latest price data for a ticker"""
    prices = _load_price_history(ticker).get(ticker, [])
    
    if prices:
        latest = prices[0]  # Assuming prices are sorted by date
        return {
            "price": float(latest.get("PRC", 0.0)),
            "date": latest.get("date")
        }
    
    return {"price": 0.0, "date": None}

async def get_available_stocks_service() -> List[Dict[str, Any]]:
    """Get list of available stocks formatted for frontend"""
    companies = _load_companies()
    
    result = []
    for symbol, data in companies.items():
        # Get latest price
        price_data = _get_latest_price(symbol)
        
        # Calculate change (mock data for now)
        # In a real implementation, you'd compare with previous day's price
        change = round(random.uniform(-0.05, 0.05), 4)
        
        # Get stock names
        names = _get_stock_names(symbol)
        
        result.append({
            "symbol": symbol,
            "name": names["display_name"],
            "englishName": names["english_name"] or data.get("name", ""),
            "chineseName": names["chinese_name"],
            "sector": data.get("sector", "Other"),
            "industry": data.get("industry", "Other"),
            "region": data.get("region", "Unknown"),
            "marketCap": data.get("marketCap", "Unknown"),
            "description": data.get("description", ""),
            "price": price_data.get("price", 0.0),
            "change": change
        })
    
    # Sort by symbol
    result.sort(key=lambda x: x["symbol"])
    
    return result

async def get_stocks_data_service() -> Dict[str, Dict[str, Any]]:
    """Get all stock data with company info"""
    companies = _load_companies()
    
    # Enhance company data with price information
    enhanced_data = {}
    for symbol, data in companies.items():
        price_data = _get_latest_price(symbol)
        
        # Get stock names
        names = _get_stock_names(symbol)
        
        # Create enhanced data structure
        enhanced_data[symbol] = {
            **data,
            "displayName": names["display_name"],
            "englishName": names["english_name"] or data.get("name", ""),
            "chineseName": names["chinese_name"],
            "price": price_data.get("price", 0.0),
            "last_updated": price_data.get("date"),
            "change": round(random.uniform(-0.05, 0.05), 4)  # Mock data for now
        }
    
    return enhanced_data

async def get_stock_history_service(ticker: str, days: int = 30) -> List[Dict[str, Any]]:
    """Get historical price data for a specific stock
    
    Args:
        ticker: Stock ticker symbol
        days: Number of days of history to return
        
    Returns:
        List of price data points
    """
    logger = logging.getLogger(__name__)
    logger.info(f"获取股票历史数据 - 股票代码: {ticker}, 请求天数: {days}")
    
    price_data = _load_price_history(ticker).get(ticker, [])
    
    if not price_data:
        logger.warning(f"找不到股票 {ticker} 的历史数据")
        return []
    
    logger.info(f"获取到 {ticker} 的历史数据点数: {len(price_data)}个")
    
    # 不需要限制天数 - 返回所有可用数据
    # 客户端会根据需要进行筛选
    
    # 最多返回请求的天数，但不限制数据点的个数
    # 之前的写法会导致只返回最近的days个数据点，而不是天数
    
    # 注意：这里直接返回所有数据，因为我们希望满足5年期请求
    # 即使股票只有10年的数据，也应该全部返回，而不是仅返回days个点
    
    # 确保返回足够的数据量
    return price_data

async def get_stock_name_mapping_service() -> Dict[str, Dict[str, str]]:
    """Get bilingual stock name mapping
    
    Returns:
        Dictionary with mappings for names, chinese_names, and display_names
    """
    return _load_stock_name_mapping()

async def get_stock_info_service(ticker: str) -> Dict[str, Any]:
    """Get detailed information for a specific stock
    
    Args:
        ticker: Stock symbol
        
    Returns:
        Dictionary with company information and price data
    """
    companies = _load_companies()
    
    # Get company data
    company_data = companies.get(ticker, {})
    if not company_data:
        return {"error": f"Stock {ticker} not found"}
    
    # Get latest price
    price_data = _get_latest_price(ticker)
    
    # Get stock names
    names = _get_stock_names(ticker)
    
    # Combine all data
    return {
        "symbol": ticker,
        "name": names["display_name"],
        "englishName": names["english_name"] or company_data.get("name", ""),
        "chineseName": names["chinese_name"],
        "sector": company_data.get("sector", "Other"),
        "industry": company_data.get("industry", "Other"),
        "region": company_data.get("region", "Unknown"),
        "marketCap": company_data.get("marketCap", "Unknown"),
        "description": company_data.get("description", ""),
        "price": price_data.get("price", 0.0),
        "last_updated": price_data.get("date"),
        "change": round(random.uniform(-0.05, 0.05), 4)  # Mock data for now
    } 