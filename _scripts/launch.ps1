# AIOffice MrT Launcher
param(
    [string]$PromptFile = "",
    [switch]$NoVSCode   = $false,
    [switch]$NoTerminal = $false
)

$ProjectDir  = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$ProjectName = Split-Path -Leaf $ProjectDir

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  AIOffice MrT Launcher" -ForegroundColor Cyan
Write-Host "  Projekt: $ProjectName" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Pfad: $ProjectDir" -ForegroundColor Gray
Write-Host ""

# Sanity Checks
$checkFiles = @("CLAUDE.md", "docs\CLAUDE.md", "docs\PROGRESS.md")
foreach ($f in $checkFiles) {
    $full = Join-Path $ProjectDir $f
    if (Test-Path $full) {
        Write-Host "  OK  $f" -ForegroundColor Green
    } else {
        Write-Host "  ??  $f nicht gefunden" -ForegroundColor Yellow
    }
}
Write-Host ""

# VS Code oeffnen
if (-not $NoVSCode) {
    $codeExe = Get-Command code -ErrorAction SilentlyContinue
    if ($codeExe) {
        Write-Host "  [1/2] Oeffne VS Code..." -ForegroundColor Gray
        Start-Process "code" -ArgumentList "`"$ProjectDir`""
        Write-Host "  OK  VS Code gestartet" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  !!  VS Code nicht im PATH" -ForegroundColor Yellow
    }
}

# MrT Terminal starten
if (-not $NoTerminal) {
    $claudeExe = Get-Command claude -ErrorAction SilentlyContinue

    if ($claudeExe) {
        Write-Host "  [2/2] Starte MrT..." -ForegroundColor Gray

        $runScript = Join-Path $ProjectDir "_scripts\run-prompt.ps1"

        if ($PromptFile -ne "" -and (Test-Path (Join-Path $ProjectDir $PromptFile))) {
            $args = "-NoExit -ExecutionPolicy Bypass -File `"$runScript`" `"$PromptFile`""
            Start-Process "powershell" -ArgumentList $args
        } else {
            $initCmd  = "Set-Location '$ProjectDir'"
            $initCmd += "; Write-Host ''"
            $initCmd += "; Write-Host '  MrT bereit. Projekt: $ProjectName' -ForegroundColor Cyan"
            $initCmd += "; Write-Host ''"
            $initCmd += "; Write-Host '  Prompt starten:' -ForegroundColor Yellow"
            $initCmd += "; Write-Host '  powershell -ExecutionPolicy Bypass -File _scripts\run-prompt.ps1' -ForegroundColor White"
            $initCmd += "; Write-Host ''"
            $initCmd += "; claude --dangerously-skip-permissions"
            Start-Process "powershell" -ArgumentList "-NoExit", "-Command", $initCmd
        }

        Write-Host "  OK  MrT Terminal gestartet" -ForegroundColor Green
    } else {
        Write-Host "  !!  Claude Code nicht gefunden!" -ForegroundColor Red
        Write-Host "      npm install -g @anthropic-ai/claude-code" -ForegroundColor Yellow
        Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectDir'; Write-Host 'Claude Code fehlt. Installieren: npm install -g @anthropic-ai/claude-code' -ForegroundColor Red"
    }
}

Write-Host ""
Write-Host "--------------------------------------------" -ForegroundColor Gray
Write-Host "  Im MrT-Terminal Prompt starten:" -ForegroundColor Cyan
Write-Host "  powershell -ExecutionPolicy Bypass -File _scripts\run-prompt.ps1" -ForegroundColor White
Write-Host "--------------------------------------------" -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 3
