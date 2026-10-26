$WshShell = New-Object -ComObject WScript.Shell
$TargetPath = "$PSScriptRoot\..\run-desktop.bat"
$ShortcutPath = "$PSScriptRoot\..\MultiAudio.lnk"
$IconPath = "$PSScriptRoot\..\public\icon.ico"
$WorkingDir = "$PSScriptRoot\.."

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = (Resolve-Path $TargetPath).Path
$Shortcut.WorkingDirectory = (Resolve-Path $WorkingDir).Path
$Shortcut.IconLocation = "$((Resolve-Path $IconPath).Path), 0"
$Shortcut.Description = "MultiAudio - Minimalist Desktop Audio Router and Mixer"
$Shortcut.Save()

Write-Host "MultiAudio.lnk created with custom icon.ico!"
