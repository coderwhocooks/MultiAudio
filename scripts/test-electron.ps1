$exe = "c:\myProjects\MultiAudio\node_modules\electron\dist\electron.exe"
$main = "c:\myProjects\MultiAudio\electron\main.cjs"
$logOut = "c:\myProjects\MultiAudio\electron_stdout.log"
$logErr = "c:\myProjects\MultiAudio\electron_stderr.log"

$p = Start-Process -FilePath $exe -ArgumentList "`"$main`"", "--disable-gpu-shader-disk-cache" -RedirectStandardOutput $logOut -RedirectStandardError $logErr -PassThru

Start-Sleep -Seconds 3

Write-Host "Process ID: $($p.Id) | HasExited: $($p.HasExited)"

if (Test-Path $logOut) {
    Write-Host "STDOUT:"
    Get-Content $logOut
}
if (Test-Path $logErr) {
    Write-Host "STDERR:"
    Get-Content $logErr
}
