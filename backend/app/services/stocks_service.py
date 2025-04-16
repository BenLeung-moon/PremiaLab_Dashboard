"""
Stocks Service - Handles business logic for stock-related operations
"""
import json
import random
from pathlib import Path
from typing import List, Dict, Any

# Data path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
STOCKS_FILE = DATA_DIR / "stocks.json"

# Stock data
_stocks_cache = {}

# Default stocks to use if no data is available
DEFAULT_STOCKS = {
    "AAPL": {"name": "Apple Inc.", "sector": "Technology", "price": 173.57, "change": 0.0123},
    "MSFT": {"name": "Microsoft Corp.", "sector": "Technology", "price": 402.28, "change": -0.0056},
    "GOOGL": {"name": "Alphabet Inc.", "sector": "Communication Services", "price": 147.68, "change": 0.0034},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Consumer Discretionary", "price": 178.08, "change": 0.0212},
    "TSLA": {"name": "Tesla, Inc.", "sector": "Consumer Discretionary", "price": 197.42, "change": -0.0145},
    "META": {"name": "Meta Platforms, Inc.", "sector": "Communication Services", "price": 481.73, "change": 0.0078},
    "NVDA": {"name": "NVIDIA Corporation", "sector": "Technology", "price": 922.28, "change": 0.0345},
    "JPM": {"name": "JPMorgan Chase & Co.", "sector": "Financial Services", "price": 196.46, "change": -0.0067},
    "V": {"name": "Visa Inc.", "sector": "Financial Services", "price": 275.96, "change": 0.0021},
    "JNJ": {"name": "Johnson & Johnson", "sector": "Healthcare", "price": 151.14, "change": 0.0015},
}

def _load_stocks() -> Dict[str, Dict[str, Any]]:
    """Load stocks data from file or generate if not available"""
    global _stocks_cache
    
    if _stocks_cache:
        return _stocks_cache
    
    if STOCKS_FILE.exists():
        try:
            with open(STOCKS_FILE, "r") as f:
                _stocks_cache = json.load(f)
        except Exception as e:
            print(f"Error loading stocks: {e}")
            _stocks_cache = _generate_stocks_data()
    else:
        _stocks_cache = _generate_stocks_data()
        _save_stocks()
    
    return _stocks_cache

def _save_stocks() -> bool:
    """Save stocks data to file"""
    try:
        with open(STOCKS_FILE, "w") as f:
            json.dump(_stocks_cache, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving stocks: {e}")
        return False

def _generate_stocks_data() -> Dict[str, Dict[str, Any]]:
    """Generate mock stocks data"""
    stocks = DEFAULT_STOCKS.copy()
    
    # Add more mock stocks
    for i in range(50):
        symbol = f"STOCK{i+1}"
        sector_choice = random.choice([
            "Technology", "Healthcare", "Financial Services", 
            "Consumer Discretionary", "Communication Services", 
            "Industrials", "Energy", "Materials", "Utilities"
        ])
        price = round(random.uniform(10, 500), 2)
        change = round(random.uniform(-0.05, 0.05), 4)
        
        stocks[symbol] = {
            "name": f"Mock Stock {i+1}",
            "sector": sector_choice,
            "price": price,
            "change": change
        }
    
    return stocks

async def get_available_stocks_service() -> List[Dict[str, Any]]:
    """Get list of available stocks formatted for frontend"""
    stocks = _load_stocks()
    
    result = []
    for symbol, data in stocks.items():
        result.append({
            "symbol": symbol,
            "name": data.get("name", f"Unknown ({symbol})"),
            "sector": data.get("sector", "Other"),
            "price": data.get("price", 0.0),
            "change": data.get("change", 0.0)
        })
    
    # Sort by symbol
    result.sort(key=lambda x: x["symbol"])
    
    return result

async def get_stocks_data_service() -> Dict[str, Dict[str, Any]]:
    """Get all stock data"""
    return _load_stocks() 