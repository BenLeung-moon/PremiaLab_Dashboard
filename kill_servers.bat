@echo off
echo ===================================================
echo  本地开发服务器端口清理工具
echo  适用于 Vite, React, Node.js, Python 等服务器
echo ===================================================
echo.

REM 开发服务器常用端口列表
set ports=3000 3001 3002 3003 3030 3333 4000 4200 4433 5000 5001 5173 5174 8000 8001 8080 8800 8888 9000

echo 正在扫描常用开发服务器端口...
echo.

REM 为每个端口查找并结束进程
for %%p in (%ports%) do (
  echo 检查端口 %%p...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:"[^0-9]%%p[^0-9].*LISTENING"') do (
    if not %%a==0 (
      echo 找到进程 PID: %%a，正在运行于端口 %%p
      echo 正在终止进程 %%a...
      taskkill /F /PID %%a
      if errorlevel 1 (
        echo 终止进程 %%a 失败，可能需要管理员权限
      ) else (
        echo 进程 %%a 已成功终止
      )
      echo.
    )
  )
)

echo.
echo === 正在扫描所有用户指定的端口 ===
echo.

:user_input
set /p custom_port="输入要终止的其他端口 (输入'q'退出): "
if "%custom_port%"=="q" goto end
if "%custom_port%"=="" goto user_input

echo 检查端口 %custom_port%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:"[^0-9]%custom_port%[^0-9].*LISTENING"') do (
  if not %%a==0 (
    echo 找到进程 PID: %%a，正在运行于端口 %custom_port%
    echo 正在终止进程 %%a...
    taskkill /F /PID %%a
    if errorlevel 1 (
      echo 终止进程 %%a 失败，可能需要管理员权限
    ) else (
      echo 进程 %%a 已成功终止
    )
  )
)
echo.
goto user_input

:end
echo.
echo ===================================================
echo  清理完成! 所有指定端口的进程已被终止
echo ===================================================
pause 