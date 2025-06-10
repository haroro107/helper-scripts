@echo off
setlocal enabledelayedexpansion

echo Generating file and folder list (with sizes)...

:: Get current folder/drive name
for %%a in ("%CD%") do (
    set "parent=%%~dpa"
    set "name=%%~nxa"
)
if "!name!"=="" (
    set "drive=!parent:~0,1!"
    set "prefix=!drive!_Drive"
) else (
    set "prefix=!name!"
)

:: Replace spaces with underscores in prefix
set "prefix=!prefix: =_!"

:: Generate timestamp
for /f %%i in ('powershell -command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set "timestamp=%%i"

:: Create filename
set "outputFile=!prefix!_filelist_!timestamp!.txt"

:: Generate directory listing
powershell -Command "Get-ChildItem -Path . -Recurse | %% { if ($_.PSIsContainer) { \"$($_.FullName) [DIR]\" } else { $size = $_.Length; $formattedSize = if ($size -ge 1GB) { [math]::Round($size/1GB, 2).ToString() + 'GB' } elseif ($size -ge 1MB) { [math]::Round($size/1MB, 2).ToString() + 'MB' } elseif ($size -ge 1KB) { [math]::Round($size/1KB, 2).ToString() + 'KB' } else { $size.ToString() + 'B' }; \"$($_.FullName) [$formattedSize]\" } }" > "!outputFile!"

echo File and folder list saved to "!outputFile!"
endlocal