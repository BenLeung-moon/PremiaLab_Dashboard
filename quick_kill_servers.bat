@echo off
setlocal enabledelayedexpansion
title 一键终止所有开发服务器

echo ===================================================
echo       正在终止所有开发服务器进程...
echo ===================================================
echo.

REM 开发服务器常用端口列表
set ports=3000 3001 3002 3003 3030 3333 4000 4200 4433 5000 5001 5173 5174 8000 8001 8080 8800 8888 9000

set killed_count=0

for %%p in (%ports%) do (
  echo 检查端口 %%p...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:"[^0-9]%%p[^0-9].*LISTENING"') do (
    if not %%a==0 (
      set /a killed_count+=1
      echo  [!killed_count!] 发现进程 PID: %%a，运行于端口 %%p
      echo  正在终止进程 %%a...
      taskkill /F /PID %%a 2>nul
      if errorlevel 1 (
        echo  [警告] 终止进程 %%a 失败，可能需要管理员权限
      ) else (
        echo  [成功] 进程 %%a 已被终止
      )
      echo.
    )
  )
)

if !killed_count!==0 (
  echo 未发现正在运行的开发服务器。
) else (
  echo 总共终止了 !killed_count! 个开发服务器进程。
)

echo.
echo ===================================================
echo       操作完成! 按任意键退出...
echo ===================================================
pause >nul
endlocal 