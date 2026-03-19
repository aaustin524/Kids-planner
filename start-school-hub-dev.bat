@echo off
cd /d "C:\Users\aaust\OneDrive\Documents\GitHub\Kids Planner"
set PATH=C:\Program Files\nodejs;%PATH%
start http://localhost:5173
npm run dev -- --host localhost
