from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from .api.router import api_router
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True) 