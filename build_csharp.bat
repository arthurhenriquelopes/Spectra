@echo off
setlocal

echo ====================================================
echo           SPECTRA C# NATIVE BUILD & PUBLISH
echo ====================================================
echo.

echo Checking .NET SDK...
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo [.NET SDK Note] To compile the C# native project into a standalone single-file .exe:
    echo 1. Download and install the .NET 8 SDK from: https://dotnet.microsoft.com/download/dotnet/8.0
    echo 2. Run this script again or open Spectra.sln in Visual Studio.
    echo.
    pause
    exit /b 1
)

echo [1/2] Restoring NuGet dependencies...
dotnet restore src-csharp\Spectra.csproj

echo [2/2] Publishing Single-File Executable (win-x64)...
dotnet publish src-csharp\Spectra.csproj -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -o bin\Release\net8.0-windows\publish

if exist "bin\Release\net8.0-windows\publish\Spectra.exe" (
    copy /y "bin\Release\net8.0-windows\publish\Spectra.exe" "Spectra.exe" >nul
    echo.
    echo ====================================================
    echo SUCCESS! Standalone native Spectra.exe created!
    echo ====================================================
) else (
    echo Build completed. Check output in bin\Release.
)

pause
