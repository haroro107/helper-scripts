@echo off
setlocal enabledelayedexpansion

set /p sizeFilter="Enter minimum file size (e.g., 1kb, 1mb, 1gb, 0 for all): "

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

:: Generate directory listing with size filter
powershell -Command ^
  "$sizeFilter = '%sizeFilter%'.ToLower(); " ^
  "$minBytes = 0; " ^
  "if ($sizeFilter -ne '0') { " ^
  "  if ($sizeFilter -match '^(\d+)(kb|mb|gb)?$') { " ^
  "    $num = [int]$matches[1]; " ^
  "    $unit = if ($matches.Count -gt 2) { $matches[2] } else { 'kb' }; " ^
  "    switch ($unit) { " ^
  "      'kb' { $minBytes = $num * 1KB } " ^
  "      'mb' { $minBytes = $num * 1MB } " ^
  "      'gb' { $minBytes = $num * 1GB } " ^
  "    } " ^
  "  } " ^
  "} " ^
  "Get-ChildItem -Path . -Recurse | " ^
  "Where-Object { ($_.PSIsContainer) -or ($_.Length -ge $minBytes) } | " ^
  "ForEach-Object { if ($_.PSIsContainer) { \"$($_.FullName) [DIR]\" } else { $size = $_.Length; $formattedSize = if ($size -ge 1GB) { [math]::Round($size/1GB, 2).ToString() + 'GB' } elseif ($size -ge 1MB) { [math]::Round($size/1MB, 2).ToString() + 'MB' } elseif ($size -ge 1KB) { [math]::Round($size/1KB, 2).ToString() + 'KB' } else { $size.ToString() + 'B' }; \"$($_.FullName) [$formattedSize]\" } }" > "!outputFile!"

if "!sizeFilter!"=="0" (
  echo File and folder list (all files) saved to "!outputFile!"
) else (
  echo File and folder list (min size: !sizeFilter!) saved to "!outputFile!"
)
endlocal