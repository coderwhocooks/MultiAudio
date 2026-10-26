$path = "HKCU:\Software\Microsoft\Internet Explorer\LowRegistry\Audio\PolicyConfig\PropertyStore"
Get-ChildItem $path -ErrorAction SilentlyContinue | ForEach-Object {
    $item = Get-ItemProperty $_.PSPath
    # Print the properties of each subkey
    $props = $_.Property
    foreach ($p in $props) {
        $val = $item.$p
        if ($val -like "*{*") {
            Write-Host "Key: $($_.PSChildName) | Prop: $p | Val: $val"
        }
    }
}
