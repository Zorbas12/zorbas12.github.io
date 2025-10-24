@echo off
echo ========================================
echo    ZORBAS GITHUB AUTO-UPDATER
echo ========================================
echo.

cd /d C:\Users\rapha\Downloads\Zorbas12

echo [1/4] Checking for changes...
git status

echo.
echo [2/4] Adding all changes...
git add .

echo.
echo [3/4] Committing changes...
git commit -m "Auto-update: %date% %time%"

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo    UPDATE COMPLETE!
echo    Wait 1-2 minutes for live site
echo    https://zorbas12.github.io/
echo ========================================
echo.
pause