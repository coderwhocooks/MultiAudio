Set-Location "c:\myProjects\MultiAudio"
$exe = "c:\myProjects\MultiAudio\node_modules\electron\dist\electron.exe"

$p = Start-Process -FilePath $exe -ArgumentList "." -PassThru

Start-Sleep -Seconds 3

Write-Host "Process ID: $($p.Id) | HasExited: $($p.HasExited)"
Get-Process -Id $p.Id -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, MainWindowTitle, Responding
