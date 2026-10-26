$keyPath = "HKCU:\Software\Microsoft\Internet Explorer\LowRegistry\Audio\PolicyConfig\PropertyStore\101407f2_0"
$key = Get-Item $keyPath
foreach ($name in $key.GetValueNames()) {
    [PSCustomObject]@{
        Name = $name
        Type = $key.GetValueKind($name)
        Value = $key.GetValue($name)
    }
}
