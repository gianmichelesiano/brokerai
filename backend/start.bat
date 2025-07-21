
@echo off
cd /d "C:\Users\gianm\Desktop\dev-gm\brokerai\backend"
call venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
