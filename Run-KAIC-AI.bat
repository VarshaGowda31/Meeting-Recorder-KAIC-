@echo off
title KAIC AI - Meeting Recorder
echo ========================================================
echo   🚀 KAIC AI Meeting Recorder (Zero Dependencies)
echo ========================================================
echo.
echo [1/2] Starting server...
start "" /b node server.js

timeout /t 2 /nobreak >nul

echo [2/2] Opening application in browser...
start http://localhost:5000

echo.
echo ✅ KAIC AI is now live at http://localhost:5000
echo 💡 Keep this window open while using the app.
echo.
echo Press any key to stop the server...
pause >nul
taskkill /f /im node.exe >nul 2>&1
