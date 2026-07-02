@echo off
echo ===================================================
echo     TalentArc Hackathon - Phase 3 Submission
echo ===================================================
echo 1. Running Offline Ranking pipeline...
set PYTHONPATH=c:\DEV apps\India Runs\backend;%PYTHONPATH%
python backend\rank.py
if %errorlevel% neq 0 exit /b %errorlevel%
echo 2. Running TRD Validations...
python backend\validate_submission.py
if %errorlevel% neq 0 exit /b %errorlevel%
echo ===================================================
echo    SUBMISSION READY - submission.csv verified
echo ===================================================
