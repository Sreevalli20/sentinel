@echo off

REM ---- START BACKEND (FORCE CMD + CONDA) ----
start cmd /k "cd /d D:\TK211576 - Sentil project\face && call conda activate project && python app.py"

REM ---- START FRONTEND ----
start cmd /k "cd /d D:\TK211576 - Sentil project\sentinel-app && npm run dev"

pause