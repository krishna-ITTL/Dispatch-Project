@echo off
title Dispatch Application Server

echo =====================================
echo Starting Dispatch Application...
echo =====================================

cd /d "D:\ITTL_PROJECTS\Dispatch-ITTL"

npm run dev -- --host 0.0.0.0

pause