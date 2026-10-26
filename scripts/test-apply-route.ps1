$bin = "c:\myProjects\MultiAudio\bin\SoundVolumeView.exe"
$devCmdId = "Realtek(R) Audio\Device\Headphone\Render"
$app = "chrome.exe"
$proc = Start-Process -FilePath $bin -ArgumentList "/SetAppDefault", "`"$devCmdId`"", "all", "`"$app`"" -Wait -PassThru -NoNewWindow
Write-Host "SetAppDefault back to Headphone exit code: $($proc.ExitCode)"

$jsonOut = "c:\myProjects\MultiAudio\bin\dump_route_res.json"
Start-Process -FilePath $bin -ArgumentList "/sjson", "`"$jsonOut`"" -Wait -NoNewWindow
Start-Sleep -Milliseconds 400
$items = Get-Content $jsonOut -Encoding Unicode | ConvertFrom-Json
$chrome = $items | Where-Object { $_.Type -eq "Application" -and ($_.Name -like "*Chrome*" -or $_.'Process Name' -like "*chrome*") } | Select-Object -First 1
Write-Host "Chrome device: '$($chrome.'Device Name')' | ItemID: '$($chrome.'Item ID')'"
