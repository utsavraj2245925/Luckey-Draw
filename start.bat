@echo off
title PG Grand Diwali Lucky Draw 2026 - Launcher
color 0A

echo ========================================================
echo   Starting PG Grand Diwali Lucky Draw 2026
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB service is running.
) else (
    echo [!] Starting MongoDB service...
    net start MongoDB
)

echo.
echo [2/3] Starting Backend Server (Port 5000)...
start "PG Lucky Draw - Backend (Port 5000)" cmd /k "cd /d "%~dp0server" && node server.js"

timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting Frontend Vite Server (Port 5173)...
start "PG Lucky Draw - Frontend (Port 5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   Application Started!
echo.
echo   Admin Panel : http://localhost:5173/admin
echo   Live Screen : http://localhost:5173/live
echo.
echo   Credentials:
echo     Username: admin
echo     Password: pg@diwali2024 (or admin)
echo ========================================================
echo.

start http://localhost:5173/admin
pause

