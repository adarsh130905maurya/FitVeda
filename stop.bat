@echo off
title Stopping FitVeda Services
color 0C
echo ===============================================================================
echo                      STOPPING FITVEDA SERVICES
echo ===============================================================================
echo.

echo [*] Stopping backend server on port 8080...
powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo [*] Stopping frontend dev server on port 5173...
powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo [*] Closing dedicated server terminal windows...
taskkill /F /FI "WINDOWTITLE eq FitVeda Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq FitVeda Frontend*" >nul 2>&1

echo.
echo [OK] All FitVeda processes and terminal windows stopped.
echo.
timeout /t 2 /nobreak >nul
