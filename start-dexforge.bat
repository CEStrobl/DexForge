@echo off
cd /d "%~dp0"

start "" /b cmd /c "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8010"
start "" /b cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo DexForge backend (http://localhost:8010) and frontend (http://localhost:5173) are starting.
echo Close this window to stop both.
echo.
pause >nul
