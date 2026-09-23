@echo off
title Expert Builders Local Dev Server
cd /d "G:\Expert builders"

:start
cls
echo ==========================================
echo  Expert Builders & Developers CRM local
echo ==========================================
echo.
echo [1] Start Frontend (Vite dev server)
echo [2] Start Backend (PHP built-in server)
echo [3] Both
echo [q] Quit
echo.
set /p choice="Choose option (1/2/3/q): "

if "%choice%"=="1" (
    echo Starting Frontend on http://localhost:5173...
    start "" npm run dev
    goto start
)

if "%choice%"=="2" (
    echo Starting PHP built-in server on http://localhost:8080...
    php -S localhost:8080 -t .
    goto start
)

if "%choice%"=="3" (
    echo Starting Frontend (Vite) on http://localhost:5173...
    start "" npm run dev
    echo Starting PHP built-in server on http://localhost:8080...
    start "php" php -S localhost:8080 -t .
    echo.
    echo Both servers are starting. Frontend: http://localhost:5173
    echo Backend API: http://localhost:8080
    goto start
)

if "%choice%"=="q" or "%choice%"=="Q" (
    echo Exiting...
    exit /b 0
)

echo Invalid option. Try again.
timeout /t 1 >nul
goto start