@echo off
REM Build script for Lambda deployment package (Windows)

echo Building Lambda deployment package...

SET PROJECT_ROOT=%~dp0..
SET BUILD_DIR=%PROJECT_ROOT%\build
SET PACKAGE_DIR=%BUILD_DIR%\package

REM Clean previous build
echo Cleaning previous build...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%PACKAGE_DIR%"

REM Copy source code
echo Copying source code...
xcopy /E /I /Y "%PROJECT_ROOT%\src\*" "%PACKAGE_DIR%\"

REM Install dependencies
echo Installing dependencies...
pip install -r "%PROJECT_ROOT%\requirements.txt" -t "%PACKAGE_DIR%" --upgrade

REM Remove unnecessary files
echo Removing unnecessary files...
for /d /r "%PACKAGE_DIR%" %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
for /d /r "%PACKAGE_DIR%" %%d in (tests) do @if exist "%%d" rd /s /q "%%d"
for /d /r "%PACKAGE_DIR%" %%d in (*.dist-info) do @if exist "%%d" rd /s /q "%%d"
del /s /q "%PACKAGE_DIR%\*.pyc" 2>nul
del /s /q "%PACKAGE_DIR%\*.pyo" 2>nul

REM Create ZIP file
echo Creating deployment package...
cd "%PACKAGE_DIR%"
powershell -command "Compress-Archive -Path * -DestinationPath '%PROJECT_ROOT%\deployment.zip' -Force"

echo Deployment package created: deployment.zip

REM Cleanup
echo Cleaning up build directory...
rmdir /s /q "%BUILD_DIR%"

echo Build complete!
