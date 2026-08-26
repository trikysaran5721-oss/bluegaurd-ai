[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$topic = "blueguard_maritime_emergency"

$emails = @(
  'trikysaran5721@gmail.com',
  'cliffrichards1404@gmail.com',
  'yogeshramu67@gmail.com'
)

$body = @"
🚨 MARITIME EMERGENCY DISTRESS ALERT!
Ship ID: 123456789012
Captain/Handler: Captain Saran Kumar
GPS Position: 13.0827° N, 80.2707° E
Destination: Colombo
Distress Message: Immediate assistance required on High Seas.
Time: $(Get-Date -Format 'HH:mm:ss')
Google Maps: https://www.google.com/maps?q=13.0827,80.2707
System Notice: Direct Emergency Dispatch from BlueGuard Marine Assistant.
"@

foreach ($email in $emails) {
  $url = "https://ntfy.sh/$topic?email=$email"
  Write-Host "Sending NTFY push & direct email dispatch to: $email"

  $headers = @{
    "Title" = "EMERGENCY DISTRESS ALERT - Ship 123456789012"
    "Priority" = "max"
    "Tags" = "warning,rotating_light,sos,ship"
  }

  try {
    $res = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "SUCCESS for $email :" ($res | ConvertTo-Json -Compress)
  } catch {
    Write-Host "ERROR for $email :" $_.Exception.Message
  }
}
