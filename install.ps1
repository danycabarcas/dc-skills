# DC Skills · instalador para Windows (PowerShell)
#   irm https://raw.githubusercontent.com/danycabarcas/dc-skills/main/install.ps1 | iex
$ErrorActionPreference = 'Stop'
$Repo = 'https://github.com/danycabarcas/dc-skills.git'
$Home_ = if ($env:DC_SKILLS_HOME) { $env:DC_SKILLS_HOME } else { Join-Path $HOME '.dc-skills' }
$Dir = Join-Path $Home_ 'repo'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Necesitas Node.js 22.13 o superior: https://nodejs.org' }
$v = (node -p "process.versions.node").Split('.')
if ([int]$v[0] -lt 22 -or ([int]$v[0] -eq 22 -and [int]$v[1] -lt 13)) { throw "Node $($v -join '.') es muy viejo; instala 22.13+ (recomendado 24 LTS)." }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Necesitas git: https://git-scm.com' }

New-Item -ItemType Directory -Force $Home_ | Out-Null
if (Test-Path (Join-Path $Dir '.git')) {
  Write-Host 'Actualizando dc-skills...'
  git -C $Dir pull --ff-only
} else {
  Write-Host "Clonando dc-skills en $Dir ..."
  git clone --depth 1 $Repo $Dir
}

# Instalación global enlazada a la carpeta: `dc-skills self-update` hace git pull y listo.
npm install -g $Dir
if ($LASTEXITCODE -ne 0) { throw 'npm install -g falló.' }

dc-skills doctor
Write-Host "`nListo. En la carpeta de tu proyecto ejecuta:  dc-skills" -ForegroundColor Green
