$bin = "c:\myProjects\MultiAudio\bin\SoundVolumeView.exe"
$jsonOut = "c:\myProjects\MultiAudio\bin\dump.json"
& $bin /sjson $jsonOut
$items = Get-Content $jsonOut -Encoding Unicode | ConvertFrom-Json

Write-Host "DEVICES:"
$items | Where-Object { $_.Type -eq "Device" } | ForEach-Object {
    Write-Host "Name: '$($_.Name)' | DevName: '$($_.'Device Name')' | ItemID: '$($_.'Item ID')' | CmdID: '$($_.'Command-Line Friendly ID')'"
}

Write-Host "`nAPPS:"
$items | Where-Object { $_.Type -eq "Application" -and $_.Name -ne "" } | ForEach-Object {
    Write-Host "App: '$($_.Name)' | Process: '$($_.'Process Name')' | PID: '$($_.'Process ID')' | Dev: '$($_.'Device Name')' | ItemID: '$($_.'Item ID')'"
}
