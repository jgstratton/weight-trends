param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CommandArgs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Show-Help {
    Write-Output 'Usage: cli run dev'
    Write-Output ''
    Write-Output 'Commands:'
    Write-Output '  run dev    Build app and start docker compose services'
}

if (-not $CommandArgs -or $CommandArgs.Count -lt 2) {
    Show-Help
    exit 1
}

$group = $CommandArgs[0]
$command = $CommandArgs[1]

if ($group -eq 'run' -and $command -eq 'dev') {
    Push-Location $PSScriptRoot

    try {
        Push-Location (Join-Path $PSScriptRoot 'app')
        npm install 
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
        npm run build
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
    finally {
        Pop-Location
    }

    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Pop-Location
    exit 0
}

Show-Help
exit 1
