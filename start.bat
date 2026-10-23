@echo off
setlocal EnableDelayedExpansion
title FitVeda Application Launcher
color 0B

echo ===============================================================================
echo                FITVEDA - FULL-STACK FITNESS MANAGEMENT PLATFORM
echo                     Train Smart - Eat Right - Live Better
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%fitveda-backend"
set "FRONTEND_DIR=%SCRIPT_DIR%fitveda-frontend"

:: -----------------------------------------------------------------------------
:: STEP 1: Verify Prerequisites
:: -----------------------------------------------------------------------------
echo [*] Checking Prerequisites...
echo.

:: 1. Check Java (JDK 17+)
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Java Development Kit (JDK 17+) was not found on your system PATH!
    echo.
    echo FitVeda requires Java 17 or higher to run the Spring Boot backend server.
    echo Recommended: Eclipse Temurin JDK 17 (LTS) or JDK 21 (LTS)
    echo Download URL: https://adoptium.net/
    echo.
    echo Press any key to open the Java download page in your default browser...
    pause >nul
    start https://adoptium.net/
    exit /b 1
)
echo [OK] Java detected.

:: 2. Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js was not found on your system PATH!
    echo.
    echo FitVeda requires Node.js (v18.x or v20.x LTS) to run the React frontend.
    echo Download URL: https://nodejs.org/
    echo.
    echo Press any key to open the Node.js download page in your default browser...
    pause >nul
    start https://nodejs.org/
    exit /b 1
)

:: 3. Check npm
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] npm was not found on your system PATH!
    echo Please reinstall Node.js with the default npm package manager included.
    pause
    exit /b 1
)
echo [OK] Node.js and npm detected.

:: 4. Check PostgreSQL Database (Port 5432)
echo.
echo [*] Checking PostgreSQL Database on port 5432...
powershell -Command "$t = New-Object Net.Sockets.TcpClient; try { $t.Connect('127.0.0.1', 5432); Write-Output 'OPEN'; $t.Close() } catch { Write-Output 'CLOSED' }" 2>nul | findstr /i "OPEN" >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] PostgreSQL is active and listening on port 5432.
) else (
    echo [!] PostgreSQL is not currently listening on port 5432.
    where docker >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [*] Docker Desktop detected! Checking for 'fitveda-postgres' container...
        docker ps -a --format "{{.Names}}" | findstr /i "^fitveda-postgres$" >nul
        if !ERRORLEVEL! equ 0 (
            echo [*] Starting existing 'fitveda-postgres' Docker container...
            docker start fitveda-postgres
        ) else (
            echo [*] Provisioning new 'fitveda-postgres' container (PostgreSQL 16 on 5432)...
            docker run -d --name fitveda-postgres -e POSTGRES_DB=fitveda_db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:latest
        )
        echo [*] Waiting 5 seconds for PostgreSQL container initialization...
        timeout /t 5 /nobreak >nul
    ) else (
        echo.
        echo [WARNING] Port 5432 is not open and Docker Desktop was not detected in PATH.
        echo If you are using native PostgreSQL, ensure the PostgreSQL service is running
        echo and database 'fitveda_db' exists (default user: postgres, password: postgres).
        echo.
        choice /C YN /M "Do you want to continue starting the backend anyway?"
        if !ERRORLEVEL! equ 2 (
            echo Startup aborted by user.
            pause
            exit /b 1
        )
    )
)

:: -----------------------------------------------------------------------------
:: STEP 2: Prepare Frontend Dependencies
:: -----------------------------------------------------------------------------
if not exist "%FRONTEND_DIR%\node_modules" (
    echo.
    echo [*] Frontend dependencies not found. Installing node_modules (npm install)...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if !ERRORLEVEL! neq 0 (
        color 0C
        echo [ERROR] Failed to install frontend dependencies!
        pause
        exit /b 1
    )
    cd /d "%SCRIPT_DIR%"
)

:: -----------------------------------------------------------------------------
:: STEP 3: Check and Free Busy Ports (8080 and 5173)
:: -----------------------------------------------------------------------------
powershell -Command "$t = New-Object Net.Sockets.TcpClient; try { $t.Connect('127.0.0.1', 8080); Write-Output 'BUSY'; $t.Close() } catch { Write-Output 'FREE' }" 2>nul | findstr /i "BUSY" >nul
if %ERRORLEVEL% equ 0 (
    echo [!] Port 8080 is currently occupied. Terminating existing process...
    powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

powershell -Command "$t = New-Object Net.Sockets.TcpClient; try { $t.Connect('127.0.0.1', 5173); Write-Output 'BUSY'; $t.Close() } catch { Write-Output 'FREE' }" 2>nul | findstr /i "BUSY" >nul
if %ERRORLEVEL% equ 0 (
    echo [!] Port 5173 is currently occupied. Terminating existing process...
    powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: -----------------------------------------------------------------------------
:: STEP 4: Launch Spring Boot Backend and React Frontend
:: -----------------------------------------------------------------------------
echo.
echo ===============================================================================
echo [*] Launching FitVeda Backend (Spring Boot 3.3.2 on port 8080)...
echo ===============================================================================
if exist "%BACKEND_DIR%\mvnw.cmd" (
    start "FitVeda Backend [Port 8080]" cmd /k "title FitVeda Backend [Port 8080] && cd /d "%BACKEND_DIR%" && mvnw.cmd spring-boot:run"
) else (
    start "FitVeda Backend [Port 8080]" cmd /k "title FitVeda Backend [Port 8080] && cd /d "%BACKEND_DIR%" && mvn spring-boot:run"
)

echo.
echo ===============================================================================
echo [*] Launching FitVeda Frontend (React 19 + Vite 8 on port 5173)...
echo ===============================================================================
start "FitVeda Frontend [Port 5173]" cmd /k "title FitVeda Frontend [Port 5173] && cd /d "%FRONTEND_DIR%" && npm run dev -- --host 0.0.0.0"

:: -----------------------------------------------------------------------------
:: STEP 5: Wait for servers to become ready and automatically open browser
:: -----------------------------------------------------------------------------
echo.
echo [*] Waiting for services to initialize...
set "FRONTEND_READY=0"
for /L %%i in (1,1,30) do (
    if !FRONTEND_READY! equ 0 (
        powershell -Command "$t = New-Object Net.Sockets.TcpClient; try { $t.Connect('127.0.0.1', 5173); Write-Output 'READY'; $t.Close() } catch { Write-Output 'WAIT' }" 2>nul | findstr /i "READY" >nul
        if !ERRORLEVEL! equ 0 (
            set "FRONTEND_READY=1"
        ) else (
            timeout /t 2 /nobreak >nul
        )
    )
)

echo.
echo ===============================================================================
echo                FITVEDA APPLICATION IS NOW LIVE!
echo ===============================================================================
echo   - Frontend UI Portal : http://localhost:5173
echo   - Backend REST API   : http://localhost:8080
echo   - Testing Guide      : See HOW_TO_RUN.txt (Section 3: Evaluation Walkthrough)
echo ===============================================================================
echo.

:: Launch the browser
start http://localhost:5173

:: -----------------------------------------------------------------------------
:: STEP 6: Interactive Launcher Control Menu
:: -----------------------------------------------------------------------------
:MENU
echo Control Panel:
echo   [1] Reopen FitVeda in Browser (http://localhost:5173)
echo   [2] Stop all FitVeda Services and Close
echo   [3] Exit Launcher Window (keep servers running in background)
echo.
choice /C 123 /N /M "Choose an option (1, 2, or 3): "
if %ERRORLEVEL% equ 1 (
    start http://localhost:5173
    goto MENU
)
if %ERRORLEVEL% equ 2 (
    echo.
    echo [*] Shutting down FitVeda services...
    if exist "%SCRIPT_DIR%stop.bat" (
        call "%SCRIPT_DIR%stop.bat"
    ) else (
        powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
        powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
        taskkill /F /FI "WINDOWTITLE eq FitVeda Backend*" >nul 2>&1
        taskkill /F /FI "WINDOWTITLE eq FitVeda Frontend*" >nul 2>&1
    )
    echo [OK] All FitVeda services have been stopped.
    timeout /t 3 /nobreak >nul
    exit /b 0
)
if %ERRORLEVEL% equ 3 (
    exit /b 0
)
