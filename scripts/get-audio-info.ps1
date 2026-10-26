$ErrorActionPreference = "SilentlyContinue"
$bin = "c:\myProjects\MultiAudio\bin\SoundVolumeView.exe"
$dumpPath = "c:\myProjects\MultiAudio\bin\sys_audio.json"

# Run SoundVolumeView to dump live system audio status
if (Test-Path $bin) {
    Start-Process -FilePath $bin -ArgumentList "/sjson", "`"$dumpPath`"" -Wait -NoNewWindow
}

$rawItems = @()
if (Test-Path $dumpPath) {
    $rawItems = Get-Content $dumpPath -Encoding Unicode | ConvertFrom-Json
}

$output = @{
    devices = @()
    captureDevices = @()
    apps = @()
    initialConnections = @()
}

# 1. Parse Playback (Render) Devices
$renderItems = $rawItems | Where-Object { $_.Type -eq "Device" -and $_.Direction -eq "Render" -and $_.'Device State' -eq "Active" }

# Query physical PnP connection status to detect unplugged jacks / phantom devices
$pnpDevs = Get-PnpDevice -Class "AudioEndpoint" -ErrorAction SilentlyContinue
$pnpMap = @{}
foreach ($pd in $pnpDevs) {
    $isPlugged = ($pd.Problem -ne "CM_PROB_PHANTOM" -and $pd.Status -eq "OK")
    $pnpMap[$pd.FriendlyName] = $isPlugged
}

$devIdx = 0
$devMap = @{}

foreach ($dev in $renderItems) {
    $cleanName = if ($dev.Name) { $dev.Name } else { "Audio Output" }
    $driver = if ($dev.'Device Name') { $dev.'Device Name' } else { "" }
    $fullName = if ($driver -and $cleanName -notlike "*$driver*") { "$cleanName ($driver)" } else { $cleanName }
    $isDefault = ($dev.Default -eq "Render" -or $dev.Default -like "*Render*")
    
    $isPluggedIn = $true
    if ($pnpMap.ContainsKey($fullName)) {
        $isPluggedIn = $pnpMap[$fullName]
    } elseif ($pnpMap.ContainsKey($cleanName)) {
        $isPluggedIn = $pnpMap[$cleanName]
    }

    $devType = if ($cleanName -match "Headphone|Headset") { "wired" }
               elseif ($cleanName -match "Speaker") { "builtin" }
               elseif ($driver -match "Bluetooth" -or $cleanName -match "Airdopes|Buds|Dubstep|AirPods|Wireless") { "bluetooth" }
               elseif ($cleanName -match "Dummy|Virtual|Voicemod|Cable") { "virtual" }
               else { "usb" }

    $icon = if ($devType -eq "wired" -or $devType -eq "bluetooth") { "headphones" }
            elseif ($devType -eq "virtual") { "radio" }
            else { "speaker" }

    $vol = 80
    if ($dev.'Volume Percent') {
        $cleanVol = [regex]::Match($dev.'Volume Percent', '\d+').Value
        if ($cleanVol) { $vol = [int]$cleanVol }
    }
    $isMuted = ($dev.Muted -eq "Yes" -or $dev.Muted -eq $true)

    $stableDevId = if ($cleanName -match "Headphone") { "dev-realtek-headphone" }
                   elseif ($cleanName -match "Speaker" -and $driver -match "Realtek") { "dev-realtek-speaker" }
                   elseif ($driver -match "OMEN" -or $cleanName -match "OMEN") { "dev-omen" }
                   elseif ($cleanName -match "Voicemod|Dummy") { "dev-voicemod" }
                   else { "dev-sys-$devIdx" }

    $devObj = @{
        id = $stableDevId
        hwId = $dev.'Item ID'
        cmdId = $dev.'Command-Line Friendly ID'
        name = $fullName
        cleanName = $cleanName
        driver = $driver
        type = $devType
        icon = $icon
        codec = if ($driver) { $driver } else { "Windows MMDevice CoreAudio" }
        codecRate = "48.0 kHz / 24-bit PCM"
        isPluggedIn = $isPluggedIn
        codecQuality = if (-not $isPluggedIn) { "3.5mm Jack Unplugged (Folds to Speakers)" } elseif ($isDefault) { "Primary Windows Output" } else { "Auxiliary Audio Bus" }
        battery = if ($devType -eq "bluetooth") { 85 } else { $null }
        rssi = if ($devType -eq "bluetooth") { -48 } else { $null }
        signalQuality = if (-not $isPluggedIn) { "Unplugged (Hardware redirect)" } elseif ($devType -eq "bluetooth") { "Strong (aptX HD)" } else { "Direct Hardware Bus" }
        bandwidthUsageKbps = 0
        volume = $vol
        muted = $isMuted
        delayMs = if ($devType -eq "wired") { 8 } elseif ($devType -eq "bluetooth") { 42 } else { 12 }
        eqPreset = "Flat Reference"
        isDefault = $isDefault
    }

    $output.devices += $devObj
    $devMap[$dev.'Item ID'] = $stableDevId
    if ($dev.'Command-Line Friendly ID') {
        $devMap[$dev.'Command-Line Friendly ID'] = $stableDevId
    }
    $devIdx++
}

# 2. Parse Capture (Recording) Devices
$captureItems = $rawItems | Where-Object { $_.Type -eq "Device" -and $_.Direction -eq "Capture" -and $_.'Device State' -eq "Active" }
$capIdx = 0
foreach ($cap in $captureItems) {
    $output.captureDevices += @{
        id = "cap-sys-$capIdx"
        hwId = $cap.'Item ID'
        cmdId = $cap.'Command-Line Friendly ID'
        name = "$($cap.Name) ($($cap.'Device Name'))"
        isDefault = ($cap.Default -eq "Capture" -or $cap.Default -like "*Capture*")
        muted = ($cap.Muted -eq "Yes")
    }
    $capIdx++
}

# 3. Parse Real Applications with Active Audio Sessions
$appItems = $rawItems | Where-Object { $_.Type -eq "Application" -and $_.Name -ne "" -and $_.Name -ne "System Sounds" -and $_.Name -ne "Electron" }

# Deduplicate applications by Process Name or Name
$seenApps = @{}
$appIdx = 0

# App metadata enhancement dictionary
$appMeta = @{
    "spotify" = @{ name = "Spotify Music"; category = "music"; icon = "music"; color = "#1db954"; track = "Spotify Live Stream" }
    "chrome" = @{ name = "Google Chrome"; category = "browser"; icon = "globe"; color = "#ea4335"; track = "Web & YouTube Audio" }
    "msedge" = @{ name = "Microsoft Edge"; category = "browser"; icon = "globe"; color = "#0078d4"; track = "Browser Media Session" }
    "discord" = @{ name = "Discord Voice"; category = "voice"; icon = "message-square"; color = "#5865f2"; track = "Opus Voice Engine" }
    "wallpaper64" = @{ name = "Wallpaper Engine"; category = "creator"; icon = "sliders"; color = "#00d2be"; track = "Desktop Audio Reactive" }
    "vlc" = @{ name = "VLC Media Player"; category = "music"; icon = "sliders"; color = "#ff8800"; track = "Direct Media Stream" }
    "riot client" = @{ name = "Riot Client"; category = "game"; icon = "gamepad-2"; color = "#eb0029"; track = "Game Engine Audio" }
    "valorant" = @{ name = "VALORANT"; category = "game"; icon = "gamepad-2"; color = "#fa4454"; track = "3D Positional Game Audio" }
    "antigravity ide" = @{ name = "Antigravity IDE"; category = "creator"; icon = "terminal"; color = "#8b5cf6"; track = "Developer Environment" }
    "hp.omen" = @{ name = "HP OMEN Audio"; category = "creator"; icon = "sliders"; color = "#ff2a5f"; track = "OMEN Sound Pipeline" }
}

foreach ($item in $appItems) {
    $appName = $item.Name
    $rawProc = $item.'Process Name'
    $key = $appName.ToLower()
    if ($seenApps.ContainsKey($key)) { continue }
    $seenApps[$key] = $true

    $pid = 0
    if ($item.'Process ID') {
        $cleanPid = [regex]::Match($item.'Process ID', '\d+').Value
        if ($cleanPid) { $pid = [int]$cleanPid }
    }

    $vol = 85
    if ($item.'Volume Percent') {
        $cleanVol = [regex]::Match($item.'Volume Percent', '\d+').Value
        if ($cleanVol) { $vol = [int]$cleanVol }
    }

    $isMuted = ($item.Muted -eq "Yes" -or $item.Muted -eq $true)

    # Match metadata
    $meta = $null
    foreach ($k in $appMeta.Keys) {
        if ($key -like "*$k*") {
            $meta = $appMeta[$k]
            break
        }
    }

    $dispName = if ($meta) { $meta.name } else { $appName }
    $category = if ($meta) { $meta.category } else { "music" }
    $icon = if ($meta) { $meta.icon } else { "music" }
    $color = if ($meta) { $meta.color } else { "#38bdf8" }
    $track = if ($meta) { $meta.track } else { "$appName Audio Stream" }

    # Extract target device from Item ID or Device Name
    $itemId = $item.'Item ID'
    $assignedDevId = $null
    
    # In Item ID, the device endpoint prefix is {0.0.0.00000000}.{GUID}
    if ($itemId -match '(\{0\.0\.[01]\.00000000\}\.\{[a-f0-9\-]+\})') {
        $epId = $matches[1]
        if ($devMap.ContainsKey($epId)) {
            $assignedDevId = $devMap[$epId]
        }
    }

    if (-not $assignedDevId -and $output.devices.Count -gt 0) {
        # Fallback to default device
        $defDev = $output.devices | Where-Object { $_.isDefault -eq $true } | Select-Object -First 1
        if ($defDev) {
            $assignedDevId = $defDev.id
        } else {
            $assignedDevId = $output.devices[0].id
        }
    }

    $stableAppId = if ($key -like "*spotify*") { "app-spotify" }
                   elseif ($key -like "*chrome*") { "app-chrome" }
                   elseif ($key -like "*antigravity*") { "app-antigravity" }
                   elseif ($key -like "*omen*") { "app-omen" }
                   elseif ($key -like "*edge*") { "app-edge" }
                   elseif ($key -like "*discord*") { "app-discord" }
                   else { "app-live-$appIdx" }

    $realProc = $rawProc
    if (-not $realProc -and $item.'Process Path') {
        $realProc = Split-Path -Leaf $item.'Process Path'
    }
    if (-not $realProc -and $pid -gt 0) {
        $p = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($p) { $realProc = "$($p.ProcessName).exe" }
    }
    if (-not $realProc) {
        if ($key -like "*chrome*") { $realProc = "chrome.exe" }
        elseif ($key -like "*spotify*") { $realProc = "Spotify.exe" }
        elseif ($key -like "*edge*") { $realProc = "msedge.exe" }
        elseif ($key -like "*discord*") { $realProc = "Discord.exe" }
        elseif ($key -like "*omen*") { $realProc = "HP.OMEN.VadRedirectHelper.exe" }
        elseif ($key -like "*antigravity*") { $realProc = "Antigravity IDE.exe" }
        else { $realProc = "$appName.exe" }
    }

    $appObj = @{
        id = $stableAppId
        name = $dispName
        processName = $realProc
        pid = $pid
        category = $category
        icon = $icon
        color = $color
        format = "48.0 kHz • Live WASAPI Stream"
        volume = $vol
        muted = $isMuted
        solo = $false
        currentTrack = $track
        activeLevel = 0.75
        frequencyData = @(40, 58, 76, 85, 72, 54, 38, 26)
        currentDeviceId = $assignedDevId
        soundItemId = $item.'Item ID'
    }

    $output.apps += $appObj

    # Create live connection
    if ($assignedDevId) {
        $output.initialConnections += @{
            id = "conn-init-$appIdx"
            sourceId = $stableAppId
            targetId = $assignedDevId
            active = $true
            color = $color
        }
    }

    $appIdx++
}

# If no active app audio streams found (e.g. apps just opened), include Spotify & Chrome by default
if ($output.apps.Count -eq 0) {
    $fallbackProcs = @("Spotify", "chrome", "msedge")
    $fbIdx = 0
    foreach ($fp in $fallbackProcs) {
        $p = Get-Process -Name $fp -ErrorAction SilentlyContinue | Select-Object -First 1
        $meta = $appMeta[$fp.ToLower()]
        $stableAppId = if ($fp.ToLower() -like "*spotify*") { "app-spotify" }
                       elseif ($fp.ToLower() -like "*chrome*") { "app-chrome" }
                       else { "app-edge" }
        $defDevId = if ($output.devices.Count -gt 0) { $output.devices[0].id } else { "dev-realtek-headphone" }

        $output.apps += @{
            id = $stableAppId
            name = if ($meta) { $meta.name } else { $fp }
            processName = "$fp.exe"
            pid = if ($p) { $p.Id } else { 0 }
            category = if ($meta) { $meta.category } else { "music" }
            icon = if ($meta) { $meta.icon } else { "music" }
            color = if ($meta) { $meta.color } else { "#38bdf8" }
            format = "48.0 kHz • Ready Stream"
            volume = 80
            muted = $false
            solo = $false
            currentTrack = if ($meta) { $meta.track } else { "$fp Audio" }
            activeLevel = 0.70
            frequencyData = @(35, 50, 70, 80, 65, 48, 32, 22)
            currentDeviceId = $defDevId
        }

        $output.initialConnections += @{
            id = "conn-init-$fbIdx"
            sourceId = $stableAppId
            targetId = $defDevId
            active = $true
            color = if ($meta) { $meta.color } else { "#38bdf8" }
        }
        $fbIdx++
    }
}

$output | ConvertTo-Json -Depth 5
