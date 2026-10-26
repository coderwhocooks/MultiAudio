param (
    [string]$Action,
    [string]$Target,
    [string]$Device,
    [string]$SecondaryDevice,
    [string]$Value,
    [int]$PidNum = 0,
    [string]$IsCapture = "0"
)

$ErrorActionPreference = "SilentlyContinue"
$bin = "c:\myProjects\MultiAudio\bin\SoundVolumeView.exe"

if (-not (Test-Path $bin)) {
    Write-Output '{"success": false, "error": "SoundVolumeView binary missing"}'
    exit 1
}

function Get-DeviceCandidates([string]$devInput) {
    $list = [System.Collections.Generic.List[string]]::new()
    if (-not $devInput) { return $list }
    
    $clean = $devInput.Trim('"', "'")
    $list.Add($clean)
    
    # If Command-Line Friendly ID like "Realtek(R) Audio\Device\Speaker\Render"
    if ($clean -match '\\Device\\([^\\]+)\\Render') {
        $cleanName = $matches[1]
        if (-not $list.Contains($cleanName)) { $list.Add($cleanName) }
    }
    
    # If "Speaker (Realtek(R) Audio)" -> extract "Speaker"
    if ($clean -match '^([^(]+)\s*\(') {
        $baseName = $matches[1].Trim()
        if (-not $list.Contains($baseName)) { $list.Add($baseName) }
    }
    
    return $list
}

function Get-TargetCandidates([string]$tgtInput, [int]$pidVal) {
    $list = [System.Collections.Generic.List[string]]::new()
    if ($tgtInput) {
        $clean = $tgtInput.Trim('"', "'")
        $list.Add($clean)
        
        # Add .exe if not present
        if (-not $clean.EndsWith(".exe", [System.StringComparison]::OrdinalIgnoreCase)) {
            $list.Add("$clean.exe")
        }
        
        # Normalize common process aliases
        $lower = $clean.ToLower()
        if ($lower -like "*chrome*") {
            if (-not $list.Contains("chrome.exe")) { $list.Add("chrome.exe") }
        }
        if ($lower -like "*spotify*") {
            if (-not $list.Contains("Spotify.exe")) { $list.Add("Spotify.exe") }
        }
        if ($lower -like "*edge*") {
            if (-not $list.Contains("msedge.exe")) { $list.Add("msedge.exe") }
        }
        if ($lower -like "*discord*") {
            if (-not $list.Contains("Discord.exe")) { $list.Add("Discord.exe") }
        }
        if ($lower -like "*omen*") {
            if (-not $list.Contains("HP.OMEN.VadRedirectHelper.exe")) { $list.Add("HP.OMEN.VadRedirectHelper.exe") }
        }
    }
    
    if ($pidVal -gt 0) {
        $p = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
        if ($p) {
            $procExe = "$($p.ProcessName).exe"
            if (-not $list.Contains($procExe)) { $list.Add($procExe) }
        }
    }
    
    return $list
}

$success = $false
$msg = ""

switch ($Action) {
    "route-app" {
        $devices = Get-DeviceCandidates $Device
        $targets = Get-TargetCandidates $Target $PidNum

        # 1. Route by process name (writes persistent Windows HKCU PolicyConfig registry for current and future streams)
        foreach ($d in $devices) {
            foreach ($t in $targets) {
                & $bin /SetAppDefault $d 0 $t
                & $bin /SetAppDefault $d 1 $t
                & $bin /SetAppDefault $d 2 $t
                & $bin /SetAppDefault $d all $t
            }
        }

        # 2. Route by PID if provided (switches active stream buffer immediately in Windows WASAPI)
        if ($PidNum -gt 0) {
            foreach ($d in $devices) {
                & $bin /SetAppDefault $d 0 $PidNum
                & $bin /SetAppDefault $d 1 $PidNum
                & $bin /SetAppDefault $d 2 $PidNum
                & $bin /SetAppDefault $d all $PidNum
            }
        }

        $success = $true
        $msg = "Routed $Target ($PidNum) to $Device"
    }

    "set-app-volume" {
        $vol = [int]$Value
        $targets = Get-TargetCandidates $Target $PidNum
        if ($PidNum -gt 0) {
            & $bin /SetVolume $PidNum $vol
        }
        foreach ($t in $targets) {
            & $bin /SetVolume $t $vol
        }
        $success = $true
        $msg = "Set volume $Target to $vol"
    }

    "set-app-mute" {
        $cmd = if ($Value -eq "1" -or $Value -eq "true") { "/Mute" } else { "/Unmute" }
        $targets = Get-TargetCandidates $Target $PidNum
        if ($PidNum -gt 0) {
            & $bin $cmd $PidNum
        }
        foreach ($t in $targets) {
            & $bin $cmd $t
        }
        $success = $true
        $msg = "Set mute $Target to $Value"
    }

    "set-device-volume" {
        $vol = [int]$Value
        $devices = Get-DeviceCandidates $Device
        foreach ($d in $devices) {
            & $bin /SetVolume $d $vol
        }
        $success = $true
        $msg = "Set device volume $Device to $vol"
    }

    "set-device-mute" {
        $cmd = if ($Value -eq "1" -or $Value -eq "true") { "/Mute" } else { "/Unmute" }
        $devices = Get-DeviceCandidates $Device
        foreach ($d in $devices) {
            & $bin $cmd $d
        }
        $success = $true
        $msg = "Set device mute $Device to $Value"
    }

    "set-default-device" {
        $devices = Get-DeviceCandidates $Device
        foreach ($d in $devices) {
            & $bin /SetDefault $d all
            & $bin /SetDefault $d 0
            & $bin /SetDefault $d 1
            & $bin /SetDefault $d 2
        }
        $success = $true
        $msg = "Set default device to $Device"
    }

    "transfer-dual-output" {
        $devA_list = Get-DeviceCandidates $Device
        $devB_list = Get-DeviceCandidates $SecondaryDevice
        $isCapBool = ($IsCapture -eq "1" -or $IsCapture -eq "true")

        if ($isCapBool) {
            # Recording / Capture Device (e.g. Microphone, Line-In) transferred to Output A and Output B
            # 1. Enable Windows 'Listen to this device' on Output A
            $targets = Get-TargetCandidates $Target $PidNum
            foreach ($t in $targets) {
                & $bin /SetListenToThisDevice $t 1
                foreach ($da in $devA_list) {
                    & $bin /SetPlaybackThroughDevice $t $da
                }
            }
            $success = $true
            $msg = "Transferred Capture Input $Target to Outputs: $Device and $SecondaryDevice"
        } else {
            # Application audio stream (e.g. Spotify, Chrome, Game) transferred to Output A and Output B
            # 1. Route application to Primary Output (Device A)
            $targets = Get-TargetCandidates $Target $PidNum
            foreach ($da in $devA_list) {
                foreach ($t in $targets) {
                    & $bin /SetAppDefault $da 0 $t
                    & $bin /SetAppDefault $da 1 $t
                    & $bin /SetAppDefault $da 2 $t
                    & $bin /SetAppDefault $da all $t
                }
                if ($PidNum -gt 0) {
                    & $bin /SetAppDefault $da 0 $PidNum
                    & $bin /SetAppDefault $da 1 $PidNum
                    & $bin /SetAppDefault $da 2 $PidNum
                    & $bin /SetAppDefault $da all $PidNum
                }
            }

            # 2. Configure Windows Stereo Mix / Loopback / Secondary Mirror to Device B if available
            $stereoMixNames = @("Stereo Mix", "What U Hear", "Wave Out Mix")
            foreach ($sm in $stereoMixNames) {
                & $bin /SetListenToThisDevice $sm 1
                foreach ($db in $devB_list) {
                    & $bin /SetPlaybackThroughDevice $sm $db
                }
            }
            $success = $true
            $msg = "Transferred App $Target to Dual Outputs: $Device and $SecondaryDevice"
        }
    }

    "set-listen-device" {
        $cleanTarget = $Target.Trim('"', "'")
        $devCandidates = Get-DeviceCandidates $Device
        $stateVal = if ($Value -eq "0" -or $Value -eq "false") { 0 } else { 1 }

        & $bin /SetListenToThisDevice $cleanTarget $stateVal
        if ($stateVal -eq 1 -and $devCandidates.Count -gt 0) {
            foreach ($d in $devCandidates) {
                & $bin /SetPlaybackThroughDevice $cleanTarget $d
            }
        }
        $success = $true
        $msg = "Set listen on $cleanTarget to $stateVal (playback via $Device)"
    }

    default {
        $msg = "Unknown action $Action"
    }
}

@{
    success = $success
    message = $msg
    action = $Action
} | ConvertTo-Json
