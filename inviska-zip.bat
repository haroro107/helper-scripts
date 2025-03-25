@echo off
setlocal enabledelayedexpansion

REM Loop untuk setiap subfolder di folder utama
for /d %%F in (*) do (
    if exist "%%F" (
        echo Memproses folder: %%F
        pushd "%%F"
        
        REM Panggil subrutin untuk menentukan nama ZIP yang tepat
        call :GetZipName "%%F" zipname
        
        echo Menggunakan nama ZIP: !zipname!
        REM Buat file ZIP dengan nama yang sudah ditentukan, 
        REM sertakan file dengan ekstensi .xml, .ass dan folder yang mengandung _Attachments
        7z a "!zipname!" "*.xml" "*.ass" "*_Attachments"
        
        REM Jika ZIP sudah dibuat, hapus file-file dan folder yang sudah di-zip
        if exist "!zipname!" (
            echo Menghapus file *.xml, *.ass dan folder *_Attachments...
            del /q "*.xml" "*.ass"
            for /d %%A in ("*_Attachments") do rd /s /q "%%A"
        )
        popd
    )
)
echo Selesai.
pause
exit /b

:GetZipName
REM Parameter %1 adalah nama folder (tanpa ekstensi) dan %2 adalah nama variabel output
set "basename=%~1"
set "zipname=%basename%.zip"

if exist "!zipname!" (
    set version=2
    :LoopVersion
    set "zipname=%basename% v!version!.zip"
    if exist "!zipname!" (
        set /a version+=1
        goto LoopVersion
    )
)
REM Menyimpan hasil ke variabel yang ditentukan oleh parameter kedua
set "%2=!zipname!"
exit /b
