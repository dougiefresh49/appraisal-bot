param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$BaseDir
)

if ([string]::IsNullOrWhiteSpace($BaseDir)) {
    $targetDir = (Get-Location).Path
} else {
    $targetDir = $BaseDir
}

if (-not (Test-Path -LiteralPath $targetDir -PathType Container)) {
    Write-Error "Target directory does not exist: $targetDir"
    exit 1
}

Set-Location -LiteralPath $targetDir

$folders = @(
    "comps",
    "reports",
    "subject",
    "neighborhood",
    "engagement-docs"
)

$subfolders = @(
    "comps\_data",
    "neighborhood\_data"
)

foreach ($folder in $folders) {
    if (-not (Test-Path -LiteralPath $folder -PathType Container)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Output "Created folder: $folder"
    } else {
        Write-Output "Folder already exists: $folder"
    }
}

foreach ($subfolder in $subfolders) {
    if (-not (Test-Path -LiteralPath $subfolder -PathType Container)) {
        New-Item -ItemType Directory -Path $subfolder -Force | Out-Null
        Write-Output "Created subfolder: $subfolder"
    } else {
        Write-Output "Subfolder already exists: $subfolder"
    }
}
