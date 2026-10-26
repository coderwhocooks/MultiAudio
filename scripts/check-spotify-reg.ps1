$path = "HKCU:\Software\Microsoft\Internet Explorer\LowRegistry\Audio\PolicyConfig\PropertyStore"
Get-ChildItem $path -ErrorAction SilentlyContinue | ForEach-Object {
    $sub = $_
    $item = Get-ItemProperty $sub.PSPath
    foreach ($p in $sub.Property) {
        $val = $item.$p
        if ($val -like "*Spotify*") {
            Write-Host "Key: $($sub.PSChildName) | Prop: $p | Val: $val"
        }
    }
}
