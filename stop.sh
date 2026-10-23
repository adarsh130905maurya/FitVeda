#!/usr/bin/env bash
# ==============================================================================
# FitVeda Stop Script (macOS / Linux)
# ==============================================================================

echo "Stopping FitVeda backend and frontend services..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "FitVeda services stopped successfully."
