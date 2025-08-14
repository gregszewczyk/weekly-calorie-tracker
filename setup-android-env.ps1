# Android Environment Setup Script
# Run this after Android Studio has installed the SDK

Write-Host "Setting up Android environment variables..." -ForegroundColor Green

# Check if Android SDK exists
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $androidSdkPath) {
    Write-Host "Android SDK found at: $androidSdkPath" -ForegroundColor Green
    
    # Set ANDROID_HOME environment variable
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, [System.EnvironmentVariableTarget]::User)
    
    # Add platform-tools to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", [System.EnvironmentVariableTarget]::User)
    $platformTools = "$androidSdkPath\platform-tools"
    $emulatorPath = "$androidSdkPath\emulator"
    
    if ($currentPath -notlike "*$platformTools*") {
        $newPath = "$currentPath;$platformTools;$emulatorPath"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, [System.EnvironmentVariableTarget]::User)
        Write-Host "Added Android tools to PATH" -ForegroundColor Green
    }
    
    Write-Host "Environment variables set successfully!" -ForegroundColor Green
    Write-Host "Please restart your terminal/VS Code for changes to take effect." -ForegroundColor Yellow
    
    # Test emulator command
    Write-Host "`nTesting emulator command..." -ForegroundColor Cyan
    if (Test-Path "$androidSdkPath\emulator\emulator.exe") {
        Write-Host "Emulator found! You can now run: emulator -list-avds" -ForegroundColor Green
    } else {
        Write-Host "Emulator not found. Make sure Android SDK is fully installed." -ForegroundColor Red
    }
} else {
    Write-Host "Android SDK not found at $androidSdkPath" -ForegroundColor Red
    Write-Host "Please complete Android Studio setup first." -ForegroundColor Yellow
}
