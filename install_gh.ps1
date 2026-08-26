[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$downloadUrl = "https://github.com/cli/cli/releases/download/v2.67.0/gh_2.67.0_windows_amd64.zip"
$zipPath = "$env:TEMP\gh_cli_v2.zip"
$outDir = "$env:TEMP\gh_out_v2"

Write-Host "Downloading GitHub CLI..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

Write-Host "Extracting GitHub CLI..."
if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
Expand-Archive -Path $zipPath -DestinationPath $outDir -Force

$exePath = "$outDir\gh_2.67.0_windows_amd64\bin\gh.exe"
if (Test-Path $exePath) {
    Copy-Item -Path $exePath -Destination "c:\bluegaurd\gh.exe" -Force
    Write-Host "SUCCESS: GitHub CLI installed to c:\bluegaurd\gh.exe"
} else {
    Write-Host "gh.exe not found"
}
