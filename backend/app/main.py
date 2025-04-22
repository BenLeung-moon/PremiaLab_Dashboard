from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
import logging.config
from .api.router import api_router
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志系统
DEBUG_MODE = os.environ.get("DEBUG_MODE", "False").lower() == "true"

# 配置日志
logging_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(levelname)s:%(name)s:%(message)s"
        },
        "detailed": {
            "format": "%(asctime)s [%(levelname)s] %(name)s:%(message)s"
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "standard",
            "stream": "ext://sys.stdout"
        },
    },
    "loggers": {
        "app": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG_MODE else "INFO",
            "propagate": False
        },
        "app.utils.market_data": {
            "level": "ERROR" if not DEBUG_MODE else "INFO",
            "handlers": ["console"],
            "propagate": False
        },
    },
    "root": {
        "level": "WARNING",
        "handlers": ["console"],
    }
}

# 应用日志配置
logging.config.dictConfig(logging_config)
logger = logging.getLogger("app")

# 显示应用程序启动信息
logger.info(f"Starting application in {'DEBUG' if DEBUG_MODE else 'NORMAL'} mode")

app = FastAPI(
    title="PremiaLab Dashboard API",
    description="投资组合分析仪表板API",
    version="0.1.0"
)

# 配置CORS
origins = [
    "http://localhost:3000",  # 前端开发服务器
    "http://localhost:5000",
    "http://localhost:5173",  # Vite 默认端口
    "http://localhost:5174",  # Vite 备用端口
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(api_router, prefix="/api")

# 健康检查端点
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Server is running"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True) 