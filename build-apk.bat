@echo off
setlocal
echo ========================================
echo   Building Drop 7 Reborn Android APK
echo ========================================

rem Ensure Java and Android SDK paths
if exist "C:\Users\saidu\.jdks\jdk-21.0.12.1+1" (
    set "JAVA_HOME=C:\Users\saidu\.jdks\jdk-21.0.12.1+1"
    set "PATH=%JAVA_HOME%\bin;%PATH%"
)
if exist "C:\Users\saidu\AppData\Local\Android\Sdk" (
    set "ANDROID_HOME=C:\Users\saidu\AppData\Local\Android\Sdk"
)

echo [1/3] Building Web Assets (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed.
    exit /b %errorlevel%
)

echo [2/3] Syncing with Android project (Capacitor)...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed.
    exit /b %errorlevel%
)

echo [3/3] Compiling Android APK (Gradle)...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [ERROR] Gradle build failed.
    cd ..
    exit /b %errorlevel%
)
cd ..

copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "Drop7Reborn.apk" >nul
echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo   APK ready at: %~dp0Drop7Reborn.apk
echo ========================================
