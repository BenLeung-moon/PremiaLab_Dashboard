@echo off
echo =====================================
echo PremiaLab Simple Startup Script
echo =====================================

:: Set URL variables
set FRONTEND_URL=http://localhost:5173
set BACKEND_URL=http://localhost:3001

:: Start frontend
echo [INFO] Starting frontend service...
cd frontend

:: Start frontend development server
start "PremiaLab Frontend" cmd /c "npm run dev"
echo [INFO] Frontend service started
cd ..

:: Start backend
echo [INFO] Starting backend service...
cd backend

:: Activate virtual environment and start backend service
start "PremiaLab Backend" cmd /c "call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 3001"
echo [INFO] Backend service started
cd ..

:: Display service information
echo.
echo =====================================
echo [INFO] Services successfully started!
echo =====================================
echo.
echo [URL] Frontend app: %FRONTEND_URL%
echo [URL] Backend API:  %BACKEND_URL%
echo.
echo [WARN] Do not close the command windows, closing windows will stop the corresponding services
echo.

@REM :: Provide browser open option
@REM set /p OPEN_BROWSER="Open the frontend app in browser? (Y/N): "
@REM if /i "%OPEN_BROWSER%" == "Y" (
@REM     start "" "%FRONTEND_URL%"
@REM )

echo Press any key to close this window...
pause > nul 