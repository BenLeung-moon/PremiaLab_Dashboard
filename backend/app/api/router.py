from fastapi import APIRouter
from .routes.portfolio import router as portfolio_router
from .routes.stocks import router as stocks_router
from .routes.analysis import router as analysis_router

# Create the main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(portfolio_router, prefix="/portfolios", tags=["portfolios"])
api_router.include_router(stocks_router, prefix="/stocks", tags=["stocks"])
api_router.include_router(analysis_router, prefix="/analysis", tags=["analysis"])
