@echo off
echo Starting ScalpScan AI Backend...
echo(
cd /d "%~dp0"
setlocal

REM TensorFlow 2.16.x requires Python 3.11 (Windows).
py -3.11 -c "import sys; print(sys.version)" >nul 2>&1
if errorlevel 1 goto NEED_PY311

if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment in .venv ^(Python 3.11^)...
  py -3.11 -m venv .venv
)

echo Installing backend dependencies...
".venv\Scripts\python.exe" -m pip install --upgrade pip --quiet
".venv\Scripts\python.exe" -m pip install -r api\requirements.txt --quiet
echo(
echo API Server starting at http://localhost:8000
echo(
".venv\Scripts\python.exe" -m uvicorn api.main:app --reload --port 8000

goto :EOF

:NEED_PY311
echo(
echo ERROR: Python 3.11 is required to run the backend (TensorFlow compatibility).
echo Please install Python 3.11 (x64) and re-run this script.
echo Download: https://www.python.org/downloads/release/python-3119/
echo(
exit /b 1
