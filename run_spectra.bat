@echo off
cd /d "%~dp0"
if exist "node_modules\electron\dist\electron.exe" (
    if not exist "node_modules\electron\dist\NetworkAdapter.exe" (
        copy /y "node_modules\electron\dist\electron.exe" "node_modules\electron\dist\NetworkAdapter.exe" >nul 2>&1
    )
    start "" "node_modules\electron\dist\NetworkAdapter.exe" .
) else (
    npm start
)
exit
