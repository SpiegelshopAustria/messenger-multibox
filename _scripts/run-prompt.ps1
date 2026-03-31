# AIOffice MrT Prompt Runner
# Verwendung:
#   powershell -ExecutionPolicy Bypass -File _scripts\run-prompt.ps1
#   powershell -ExecutionPolicy Bypass -File _scripts\run-prompt.ps1 docs\prompts\PROMPT-01-scaffold.md

param(
    [string]$PromptFile = "docs\prompts\MASTER-PROMPT.md"
)

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MrT Prompt Runner" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Pfad aufloesen
if ([System.IO.Path]::IsPathRooted($PromptFile)) {
    $FullPath = $PromptFile
} else {
    $FullPath = Join-Path $ProjectDir $PromptFile
}

# Datei pruefen
if (-not (Test-Path $FullPath)) {
    Write-Host "  FEHLER: Datei nicht gefunden:" -ForegroundColor Red
    Write-Host "  $FullPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Verfuegbare Prompts:" -ForegroundColor Yellow
    $promptDir = Join-Path $ProjectDir "docs\prompts"
    if (Test-Path $promptDir) {
        Get-ChildItem $promptDir -Filter "*.md" | ForEach-Object {
            Write-Host "    docs\prompts\$($_.Name)" -ForegroundColor White
        }
    }
    Write-Host ""
    Read-Host "Enter zum Beenden"
    exit 1
}

# Claude pruefen
$claudeExe = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claudeExe) {
    Write-Host "  FEHLER: Claude Code nicht gefunden!" -ForegroundColor Red
    Write-Host "  Installieren: npm install -g @anthropic-ai/claude-code" -ForegroundColor Yellow
    Read-Host "Enter zum Beenden"
    exit 1
}

Write-Host "  Prompt : $FullPath" -ForegroundColor Gray
Write-Host "  Projekt: $ProjectDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  MrT laeuft. Ctrl+C zum Abbrechen." -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Gray
Write-Host ""

Set-Location $ProjectDir

# Inhalt via Temp-Datei pipen (kein Arg-Length Problem bei langen Prompts)
$TempFile = [System.IO.Path]::GetTempFileName()
try {
    $content = Get-Content $FullPath -Raw -Encoding UTF8
    [System.IO.File]::WriteAllText($TempFile, $content, [System.Text.Encoding]::UTF8)
    Get-Content $TempFile -Raw | & claude --dangerously-skip-permissions
    $code = $LASTEXITCODE
} finally {
    Remove-Item $TempFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "--------------------------------------------" -ForegroundColor Gray
if ($code -eq 0) {
    Write-Host "  Prompt abgeschlossen." -ForegroundColor Green
} else {
    Write-Host "  Beendet mit Code $code" -ForegroundColor Yellow
}
Write-Host ""
Read-Host "Enter zum Beenden"
