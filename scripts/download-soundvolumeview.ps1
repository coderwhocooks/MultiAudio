$binDir = "c:\myProjects\MultiAudio\bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$zip = Join-Path $binDir "svv.zip"
$url = "https://www.nirsoft.net/utils/soundvolumeview-x64.zip"

Write-Host "Downloading SoundVolumeView from $url..."
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $zip -UserAgent "Mozilla/5.0" -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $binDir -Force
    Remove-Item $zip -Force
    Write-Host "Downloaded successfully to $binDir"
    Get-ChildItem $binDir
} catch {
    Write-Error $_
}
