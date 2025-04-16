from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ...services.stocks_service import (
    get_available_stocks_service,
    get_stocks_data_service
)

router = APIRouter()

@router.get("/available", response_model=List[Dict[str, Any]])
async def get_available_stocks():
    """Get list of available stocks for portfolio creation"""
    return await get_available_stocks_service()

@router.get("/data", response_model=Dict[str, Dict[str, Any]])
async def get_stocks_data():
    """Get data for all stocks in the database"""
    return await get_stocks_data_service() 