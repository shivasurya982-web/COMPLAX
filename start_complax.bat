@echo off
TITLE COMPLAX - Full Stack Launcher
COLOR 0A

echo ===================================================
echo           COMPLAX LOCAL RUNNER (WINDOWS)
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Flask Backend on http://localhost:5000 ...

REM Try working venv2 Python first, then venv, then system Python
IF EXIST "%~dp0backend\.venv2\Scripts\python.exe" (
    start "COMPLAX Backend (Port 5000)" cmd /k "cd /d %~dp0backend && set PYTHONUTF8=1 && .venv2\Scripts\python.exe app.py"
) ELSE IF EXIST "%~dp0backend\.venv\Scripts\python.exe" (
    start "COMPLAX Backend (Port 5000)" cmd /k "cd /d %~dp0backend && set PYTHONUTF8=1 && .venv\Scripts\python.exe app.py"
) ELSE (
    start "COMPLAX Backend (Port 5000)" cmd /k "cd /d %~dp0backend && set PYTHONUTF8=1 && python app.py"
)

timeout /t 5 /nobreak >nul

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "COMPLAX Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo COMPLAX is now running!
echo.
echo   Frontend : http://localhost:5173/
echo   Backend  : http://localhost:5000/
echo.
echo LOGIN CREDENTIALS (from MongoDB Atlas):
echo.
echo   MAIN ADMIN  (Admin tab)       : admin@complax.com / admin123
echo   ORG ADMIN   (Organization tab): siet@gmail.com / 123456
echo   USER        (User tab)        : surya@gmail.com / 12345
echo.
echo ===================================================
echo.
pause
