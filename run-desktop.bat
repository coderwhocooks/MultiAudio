@echo off
setlocal
cd /d "%~dp0"

REM 1. If production build does not exist, build it
if not exist "dist\index.html" (
    call npm run build
)

REM 2. Launch Electron detached and immediately close CMD window
set "ELECTRON_EXE=%~dp0node_modules\electron\dist\electron.exe"
if exist "%ELECTRON_EXE%" (
    start "" "%ELECTRON_EXE%" . --disable-gpu-shader-disk-cache
) else (
    start "" /b node_modules\.bin\electron.cmd . --disable-gpu-shader-disk-cache
)

exit
