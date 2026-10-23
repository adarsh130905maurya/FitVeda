#!/usr/bin/env bash
# ==============================================================================
# FitVeda Application Launcher (macOS / Linux)
# ==============================================================================

set -e

# Load tools from ~/.fitveda-tools if present
if [ -d "$HOME/.fitveda-tools/bin" ]; then
    export PATH="$HOME/.fitveda-tools/bin:$PATH"
    if [ -d "$HOME/.fitveda-tools/jdk17/Contents/Home" ]; then
        export JAVA_HOME="$HOME/.fitveda-tools/jdk17/Contents/Home"
    fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/fitveda-backend"
FRONTEND_DIR="$SCRIPT_DIR/fitveda-frontend"

echo "==============================================================================="
echo "               FITVEDA - FULL-STACK FITNESS MANAGEMENT PLATFORM"
echo "                    Train Smart • Eat Right • Live Better"
echo "==============================================================================="
echo ""

# 1. Verify Prerequisites
echo "[*] Checking Prerequisites..."
if ! command -v java >/dev/null 2>&1; then
    echo "[ERROR] Java (JDK 17+) not found in PATH."
    echo "Install Java 17 LTS: https://adoptium.net/"
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js not found in PATH."
    echo "Install Node.js LTS: https://nodejs.org/"
    exit 1
fi

echo "[OK] Java $(java -version 2>&1 | head -n 1)"
echo "[OK] Node $(node -v) / npm $(npm -v)"

# 2. Check Database on port 5432
echo ""
echo "[*] Checking PostgreSQL on port 5432..."
if nc -z 127.0.0.1 5432 2>/dev/null; then
    echo "[OK] PostgreSQL is running on port 5432."
else
    echo "[!] PostgreSQL not detected on port 5432."
    if [ -d "$HOME/.fitveda-tools/pgdata" ] && command -v pg_ctl >/dev/null 2>&1; then
        echo "[*] Starting local PostgreSQL cluster..."
        pg_ctl -D "$HOME/.fitveda-tools/pgdata" -l "$HOME/.fitveda-tools/pg.log" start || true
        sleep 2
    elif command -v docker >/dev/null 2>&1; then
        if docker ps -a --format '{{.Names}}' | grep -Eq "^fitveda-postgres$"; then
            echo "[*] Starting existing fitveda-postgres container..."
            docker start fitveda-postgres
        else
            echo "[*] Starting new PostgreSQL container..."
            docker run -d --name fitveda-postgres -e POSTGRES_DB=fitveda_db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:latest
        fi
        sleep 3
    else
        echo "[WARNING] Neither PostgreSQL nor Docker found. Backend may fail to connect to DB."
    fi
fi

# 3. Clean up busy ports
echo ""
echo "[*] Checking ports 8080 and 5173..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 4. Start Backend
echo ""
echo "==============================================================================="
echo "[*] Launching FitVeda Backend (Spring Boot 3.3.2 on port 8080)..."
echo "==============================================================================="
cd "$BACKEND_DIR"
if [ -f "./mvnw" ]; then
    nohup ./mvnw spring-boot:run > /tmp/fitveda-backend.log 2>&1 &
else
    nohup mvn spring-boot:run > /tmp/fitveda-backend.log 2>&1 &
fi
BACKEND_PID=$!
disown $BACKEND_PID 2>/dev/null || true
echo "Backend PID: $BACKEND_PID (logs at /tmp/fitveda-backend.log)"

# 5. Start Frontend
echo ""
echo "==============================================================================="
echo "[*] Launching FitVeda Frontend (React 19 + Vite on port 5173)..."
echo "==============================================================================="
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "[*] Installing frontend dependencies (npm install)..."
    npm install
fi
nohup npm run dev -- --host 0.0.0.0 > /tmp/fitveda-frontend.log 2>&1 &
FRONTEND_PID=$!
disown $FRONTEND_PID 2>/dev/null || true
echo "Frontend PID: $FRONTEND_PID (logs at /tmp/fitveda-frontend.log)"

# 6. Wait for frontend
echo ""
echo "[*] Waiting for services to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1 || nc -z 127.0.0.1 5173 2>/dev/null; then
        break
    fi
    sleep 1
done

echo ""
echo "==============================================================================="
echo "               FITVEDA APPLICATION IS NOW LIVE!"
echo "==============================================================================="
echo "  - Frontend UI Portal : http://localhost:5173"
echo "  - Backend REST API   : http://localhost:8080"
echo "  - Evaluation Guide   : See HOW_TO_RUN.txt"
echo "==============================================================================="
echo ""

# Open default browser
if command -v open >/dev/null 2>&1; then
    open "http://localhost:5173"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5173"
fi

echo "To stop all services, run: ./stop.sh"
