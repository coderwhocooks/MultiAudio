Add-Type -AssemblyName System.Drawing
$imgPath = "c:\myProjects\MultiAudio\public\icon.png"
$outPath = "c:\myProjects\MultiAudio\public\tray-icon.ico"

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$thumb = New-Object System.Drawing.Bitmap($bmp, 16, 16)
$hIcon = $thumb.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream($outPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$bmp.Dispose()
$thumb.Dispose()
Write-Output "SUCCESS: Created $outPath"
