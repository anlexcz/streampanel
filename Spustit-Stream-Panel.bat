@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (echo Nainstalujte Node.js LTS z https://nodejs.org/ & pause & exit /b 1)
if not exist node_modules (call npm install --no-audit --no-fund)
start "" "http://localhost:4173"
node server.cjs
pause
