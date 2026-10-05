param(
  [string]$BackendPath = (Join-Path $PSScriptRoot '..\..\matrimony-app\backend')
)
$ErrorActionPreference = 'Stop'
$adminEmail = Read-Host 'Admin email'
$adminSecret = Read-Host 'New password (at least 12 characters)' -AsSecureString
$confirmSecret = Read-Host 'Confirm password' -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecret)
$confirmPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmSecret)
try {
  $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
  $confirmPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmPointer)
  if ($adminPassword -cne $confirmPassword) { throw 'Passwords do not match. No account was created.' }
  $payload = @{ email = $adminEmail; password = $adminPassword } | ConvertTo-Json -Compress
  $payload | & node (Join-Path $PSScriptRoot 'create-admin.cjs') $BackendPath
  if ($LASTEXITCODE -ne 0) { throw 'Admin setup did not complete.' }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmPointer)
  $adminPassword = $null
  $confirmPassword = $null
  $payload = $null
  $adminSecret.Dispose()
  $confirmSecret.Dispose()
}
