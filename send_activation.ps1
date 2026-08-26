[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$emails = @(
  'trikysaran5721@gmail.com',
  'cliffrichards1404@gmail.com',
  'yogeshramu67@gmail.com'
)

foreach ($email in $emails) {
  Write-Host "Sending FormSubmit activation email to: $email"
  
  $headers = @{
    "Referer" = "http://localhost:3000/admin-demo"
    "Origin" = "http://localhost:3000"
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }

  $body = @{
    "_subject" = "BlueGuard Marine Assistant - FormSubmit Email Activation"
    "Ship_ID" = "123456789012"
    "Handler_Name" = "Captain Saran Kumar"
    "Distress_Reason" = "FormSubmit Activation Test Dispatch"
    "Notice" = "Please click the ACTIVATE FORM link in this email to receive future high-seas emergency alerts."
  }

  try {
    $res = Invoke-WebRequest -Uri "https://formsubmit.co/$email" -Method Post -Headers $headers -Body $body -UseBasicParsing
    Write-Host "STATUS CODE for $email :" $res.StatusCode
    Write-Host "SUCCESS: Activation request sent to $email"
  } catch {
    Write-Host "RESPONSE for $email :" $_.Exception.Message
  }
}
