$renderPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\MMDevices\Audio\Render"
$capturePath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\MMDevices\Audio\Capture"

Write-Host "=== OUTPUT (PLAYBACK) DEVICES ==="
Get-ChildItem $renderPath | ForEach-Object {
    $dev = $_
    $st = (Get-ItemProperty $dev.PSPath).DeviceState
    if ($st -eq 1) {
        $p = Get-ItemProperty "$($dev.PSPath)\Properties" -ErrorAction SilentlyContinue
        $name = $p.'{a45c254e-df1c-4efd-8020-67d146a850e0},2'
        $driver = $p.'{b3f8fa53-0004-438e-9003-51a46e139bfc},6'
        Write-Host "OUT: $name ($driver) -> ID: $($dev.PSChildName)"
    }
}

Write-Host ""
Write-Host "=== INPUT (RECORDING) DEVICES ==="
Get-ChildItem $capturePath | ForEach-Object {
    $dev = $_
    $st = (Get-ItemProperty $dev.PSPath).DeviceState
    if ($st -eq 1) {
        $p = Get-ItemProperty "$($dev.PSPath)\Properties" -ErrorAction SilentlyContinue
        $name = $p.'{a45c254e-df1c-4efd-8020-67d146a850e0},2'
        $driver = $p.'{b3f8fa53-0004-438e-9003-51a46e139bfc},6'
        Write-Host "IN: $name ($driver) -> ID: $($dev.PSChildName)"
    }
}
