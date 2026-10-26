$bin = "c:\myProjects\MultiAudio\bin\SoundVolumeView.exe"

$p = Start-Process -FilePath $bin -ArgumentList "/GetPercent", "Spotify" -Wait -PassThru -NoNewWindow
Write-Host "Spotify volume percent exit code: $($p.ExitCode)"

$p2 = Start-Process -FilePath $bin -ArgumentList "/SetVolume", "Spotify", "55" -Wait -PassThru -NoNewWindow
Write-Host "SetVolume exit code: $($p2.ExitCode)"

$p3 = Start-Process -FilePath $bin -ArgumentList "/GetPercent", "Spotify" -Wait -PassThru -NoNewWindow
Write-Host "Spotify volume percent exit code after setting 55: $($p3.ExitCode)"
