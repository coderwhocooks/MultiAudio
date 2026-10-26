$env:ELECTRON_ENABLE_LOGGING = "1"
$env:ELECTRON_ENABLE_STACK_DUMPING = "1"

$exe = "c:\myProjects\MultiAudio\node_modules\electron\dist\electron.exe"
$main = "c:\myProjects\MultiAudio\electron\main.cjs"
$out = "c:\myProjects\MultiAudio\debug_out.txt"

# Run via cmd /c with redirection
cmd /c "`"$exe`" `"$main`" > `"$out`" 2>&1"

Get-Content $out
