@echo off
echo Generating file and folder list (with sizes)...

powershell -Command "Get-ChildItem -Path . -Recurse | %% { if ($_.PSIsContainer) { \"$($_.FullName) [DIR]\" } else { $size = $_.Length; $formattedSize = if ($size -ge 1GB) { [math]::Round($size/1GB, 2).ToString() + 'GB' } elseif ($size -ge 1MB) { [math]::Round($size/1MB, 2).ToString() + 'MB' } elseif ($size -ge 1KB) { [math]::Round($size/1KB, 2).ToString() + 'KB' } else { $size.ToString() + 'B' }; \"$($_.FullName) [$formattedSize]\" } }" > filelist.txt

echo File and folder list saved to filelist.txt