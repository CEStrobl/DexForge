@echo off
cd /d "%~dp0"

start "DexForge Backend" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8010"
start "DexForge Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
