Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Drop 7 Reborn Android APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path "C:\Users\saidu\.jdks\jdk-21.0.12.1+1") {
    $env:JAVA_HOME = "C:\Users\saidu\.jdks\jdk-21.0.12.1+1"
    $env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
}
if (Test-Path "C:\Users\saidu\AppData\Local\Android\Sdk") {
    $env:ANDROID_HOME = "C:\Users\saidu\AppData\Local\Android\Sdk"
}

Write-Host "`n[1/3] Building Web Assets (Vite)..." -ForegroundColor Yellow
cmd /c npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[2/3] Syncing with Android project (Capacitor)..." -ForegroundColor Yellow
cmd /c npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[3/3] Compiling Android APK (Gradle)..." -ForegroundColor Yellow
Push-Location android
cmd /c gradlew.bat assembleDebug
$gradleCode = $LASTEXITCODE
Pop-Location
if ($gradleCode -ne 0) { exit $gradleCode }

Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" -Destination "Drop7Reborn.apk" -Force
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "  APK location: $PSScriptRoot\Drop7Reborn.apk" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
