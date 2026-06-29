@echo off
echo Starting ScalpScan AI Frontend...
echo.
cd /d "%~dp0frontend"
echo Frontend starting at http://localhost:5173
echo.
npm run dev
