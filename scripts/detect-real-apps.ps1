$apps = @()

# 1. Check known audio processes currently in memory
$procs = Get-Process | Group-Object ProcessName | Select-Object -ExpandProperty Name
$knownAudio = @(
    @{ name = "Spotify"; title = "Spotify Music"; icon = "music"; color = "#1db954"; category = "music" },
    @{ name = "chrome"; title = "Google Chrome"; icon = "globe"; color = "#ea4335"; category = "browser" },
    @{ name = "msedge"; title = "Microsoft Edge"; icon = "globe"; color = "#0078d4"; category = "browser" },
    @{ name = "Discord"; title = "Discord Voice"; icon = "message-square"; color = "#5865f2"; category = "voice" },
    @{ name = "wallpaper64"; title = "Wallpaper Engine Audio"; icon = "sliders"; color = "#00d2be"; category = "creator" },
    @{ name = "vlc"; title = "VLC Media Player"; icon = "sliders"; color = "#ff8800"; category = "music" },
    @{ name = "RiotClientServices"; title = "Riot Games Client"; icon = "gamepad-2"; color = "#eb0029"; category = "game" },
    @{ name = "audiodg"; title = "Windows System Sounds"; icon = "sliders"; color = "#94a3b8"; category = "creator" }
)

foreach ($item in $knownAudio) {
    $match = $procs | Where-Object { $_ -like "*$($item.name)*" }
    if ($match) {
        $p = Get-Process -Name $match -ErrorAction SilentlyContinue | Select-Object -First 1
        $apps += @{
            id = "app-$($item.name.ToLower())"
            name = $item.title
            processName = "$($item.name).exe"
            pid = if ($p) { $p.Id } else { 0 }
            category = $item.category
            icon = $item.icon
            color = $item.color
            format = "48.0 kHz • Active Audio Stream"
            volume = 80
            muted = $false
            solo = $false
            currentTrack = "Live Audio Session"
            activeLevel = 0.70
            frequencyData = @(45, 60, 75, 85, 70, 50, 35, 25)
        }
    }
}

$apps | ConvertTo-Json -Depth 3
