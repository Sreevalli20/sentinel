@echo off
title Sentinel Project Launcher

echo ==========================================
echo        SENTINEL PROJECT SETUP
echo ==========================================

REM -------- CHECK PYTHON --------
where python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found!
    echo Please install Python from:
    echo https://www.python.org/downloads/
    pause
    exit
)

REM -------- CHECK NODE --------
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from:
    echo https://nodejs.org/
    pause
    exit
)

REM -------- CHECK MYSQL --------
echo.
echo Make sure MySQL is installed and running.
echo Default:
echo   Username: root
echo   Password: root
pause

REM -------- BACKEND --------
echo.
echo [1/2] Starting Backend...

cd /d "%~dp0face"

IF NOT EXIST venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate

echo Installing backend dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo Running backend server...
start cmd /k "cd /d %cd% && venv\Scripts\activate && python app.py"

cd /d "%~dp0"

REM -------- FRONTEND --------
echo.
echo [2/2] Starting Frontend...

cd /d "%~dp0sentinel-app"

echo Installing frontend dependencies...
npm install

echo Running frontend server...
start cmd /k "cd /d %cd% && npm run dev"

cd /d "%~dp0"

echo.
echo ==========================================
echo     PROJECT STARTED SUCCESSFULLY
echo ==========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause