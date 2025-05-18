@echo off
echo Building Vite frontend...
cd vite-frontend
call npm run build
cd ..

echo Starting Flask application...
set PYTHONIOENCODING=utf-8
python app.py 