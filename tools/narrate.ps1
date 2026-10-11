$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$projectPath = Split-Path -Parent $PSScriptRoot
$mediaPath = Join-Path $projectPath 'evidence\video'
New-Item -ItemType Directory -Force -Path $mediaPath | Out-Null
$segments = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'narration.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$narrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $narrator.SelectVoice('Microsoft Zira Desktop')
  $narrator.Rate = 0
  foreach ($segment in $segments) {
    $wav = Join-Path $mediaPath ([IO.Path]::GetFileNameWithoutExtension($segment.image) + '.wav')
    $narrator.SetOutputToWaveFile($wav)
    $narrator.Speak($segment.text)
    $narrator.SetOutputToNull()
  }
} finally { $narrator.Dispose() }
Write-Output 'English narration rendered.'
