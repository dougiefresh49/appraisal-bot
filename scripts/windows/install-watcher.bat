@echo off
echo Installing AppraisalBot update watcher...

:: Get the directory this bat file is in (the scripts folder)
set SCRIPT_DIR=%~dp0

:: Create a scheduled task that runs the watcher every 30 minutes
schtasks /create /tn "AppraisalBot Update Watcher" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%SCRIPT_DIR%watch-for-updates.ps1\" -OpenExtensionsPage" /sc MINUTE /mo 30 /f

echo.
echo Done! The watcher will check for updates every 30 minutes.
echo To remove it later, run: uninstall-watcher.bat
pause
