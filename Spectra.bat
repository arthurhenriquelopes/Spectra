@echo off
setlocal enabledelayedexpansion

:: ====================================================
:: Spectra Application Launcher
:: ====================================================

echo.
echo ====================================================
echo           SPECTRA APPLICATION LAUNCHER
echo ====================================================
echo.

echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH!
    exit /b 1
)

echo [2/5] Checking virtual environment...
if not exist "venv\" (
    echo    Virtual environment not found, creating one...
    python -m venv venv
)

echo [3/5] Activating virtual environment...
call venv\Scripts\activate.bat

echo [4/5] Installing/updating dependencies...
python -m pip install -r requirements.txt --quiet --timeout 60

echo [5/5] Starting Spectra application...
python main.py
