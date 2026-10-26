$bin = "c:\myProjects\MultiAudio\bin\SoundVolumeView.exe"
$jsonOut = "c:\myProjects\MultiAudio\bin\dump.json"

& $bin /sjson $jsonOut
Start-Sleep -Milliseconds 500

if (Test-Path $jsonOut) {
    $items = Get-Content $jsonOut -Raw | ConvertFrom-Json
    Write-Host "Total audio items found: $($items.Count)"
    
    Write-Host "`n=== APPS ==="
    $items | Where-Object { $_.Type -eq "Application" } | Select-Object -Property Name, "Process Name", "Process ID", "Device Name", "Default", "Volume Percent", Muted | Format-Table -AutoSize
    
    Write-Host "`n=== DEVICES ==="
    $items | Where-Object { $_.Type -eq "Device" } | Select-Object -Property Name, Direction, "Device Name", "Default", "Device State" | Format-Table -AutoSize
} else {
    Write-Error "dump.json was not created!"
}
