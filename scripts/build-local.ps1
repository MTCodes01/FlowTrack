# ============================================================
#  FlowTrack - Local Desktop Build Script (Windows / PowerShell)
# ============================================================
#  Usage:
#    .\scripts\build-local.ps1
#    .\scripts\build-local.ps1 -Version "v1.2.3"
#    .\scripts\build-local.ps1 -Debug
# ============================================================

param(
    [string]$Version  = "local",
    [switch]$Debug
)

$ErrorActionPreference = "Stop"
$Root      = Split-Path $PSScriptRoot -Parent
$Target    = "x86_64-pc-windows-msvc"
$BundleDir = "$Root\desktop\src-tauri\target\$Target\release\bundle"
$DistDir   = "$Root\dist"

function Write-Step([string]$msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Require-Command([string]$cmd, [string]$install) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] '$cmd' not found. $install" -ForegroundColor Red
        exit 1
    }
}

# ---- Pre-flight checks -------------------------------------------------------
Write-Step "Checking prerequisites..."
Require-Command "node"  "Install Node.js from https://nodejs.org"
Require-Command "npm"   "Install Node.js from https://nodejs.org"
Require-Command "cargo" "Install Rust from https://rustup.rs"

Write-Step "Ensuring Rust target $Target..."
rustup target add $Target

# ---- Install dependencies ----------------------------------------------------
Write-Step "Installing web dependencies..."
Push-Location "$Root\web"; npm ci; Pop-Location

Write-Step "Installing desktop dependencies..."
Push-Location "$Root\desktop"; npm ci; Pop-Location

# ---- Build -------------------------------------------------------------------
Write-Step "Building Tauri app (this may take a few minutes)..."
Push-Location "$Root\desktop"

$BuildArgs = @("run", "tauri", "build", "--", "--target", $Target)
if ($Debug) { $BuildArgs += "--debug" }

npm @BuildArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FAILED] Tauri build exited with code $LASTEXITCODE" -ForegroundColor Red
    Pop-Location; exit $LASTEXITCODE
}
Pop-Location

# ---- Collect artifacts -------------------------------------------------------
Write-Step "Collecting artifacts..."
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

$Artifacts = Get-ChildItem $BundleDir -Recurse -Include "*.exe","*.msi"

if ($Artifacts.Count -eq 0) {
    Write-Host "[WARN] No .exe or .msi files found under $BundleDir" -ForegroundColor Yellow
} else {
    foreach ($file in $Artifacts) {
        $newName = "FlowTrack-$Version-win-x64$($file.Extension)"
        $dest    = Join-Path $DistDir $newName
        Copy-Item $file.FullName -Destination $dest -Force
        Write-Host "  Copied: $newName" -ForegroundColor Green
    }
}

# ---- Summary -----------------------------------------------------------------
Write-Host "`n=============================" -ForegroundColor Cyan
Write-Host " Build complete!" -ForegroundColor Green
Write-Host " Artifacts in: $DistDir" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Get-ChildItem $DistDir | Format-Table Name, Length -AutoSize
