@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0cli.ps1" %*
exit /b %ERRORLEVEL%
