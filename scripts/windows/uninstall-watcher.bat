@echo off
echo Removing AppraisalBot update watcher...
schtasks /delete /tn "AppraisalBot Update Watcher" /f
echo.
echo Done! You can re-install by running install-watcher.bat
pause
