@echo off
cd /d "%~dp0"

where npm >nul 2>nul || (
    echo Node.js 22 or newer is required: https://nodejs.org
    pause
    exit /b 1
)

fc /b package-lock.json node_modules\.run-lock >nul 2>nul || (
    call npm ci || (
        pause
        exit /b 1
    )
    copy /y package-lock.json node_modules\.run-lock >nul
)

call npm run dev
pause