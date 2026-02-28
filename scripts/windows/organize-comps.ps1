#!/usr/bin/env pwsh

<#
Port of scripts/raycast/organize-comps.sh for Windows.
Creates a folder per comp address and moves each PDF into that folder.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ExplorerCurrentDirectory {
    try {
        $shell = New-Object -ComObject Shell.Application
        $windows = $shell.Windows()

        for ($i = $windows.Count - 1; $i -ge 0; $i--) {
            $window = $windows.Item($i)
            if ($null -eq $window) {
                continue
            }

            # Keep only File Explorer windows with a filesystem-backed folder.
            if ($window.Name -ne 'File Explorer') {
                continue
            }

            $folder = $window.Document.Folder
            if ($null -eq $folder) {
                continue
            }

            $path = $folder.Self.Path
            if (-not [string]::IsNullOrWhiteSpace($path)) {
                return $path
            }
        }
    } catch {
        # Fall through to caller fallback behavior.
    }

    return $null
}

$currentDir = Get-ExplorerCurrentDirectory

# Fall back to home directory if no Explorer window is detected.
if ([string]::IsNullOrWhiteSpace($currentDir)) {
    Write-Output "No Explorer window detected. Defaulting to home directory."
    $currentDir = $HOME
}

# Ensure the current directory points to the comps folder.
$trimmedCurrentDir = $currentDir.TrimEnd('\', '/')
if (-not $trimmedCurrentDir.EndsWith('\comps', [System.StringComparison]::OrdinalIgnoreCase)) {
    $currentDir = Join-Path -Path $trimmedCurrentDir -ChildPath 'comps'
} else {
    $currentDir = $trimmedCurrentDir
}

# Check if the comps directory exists.
if (-not (Test-Path -LiteralPath $currentDir -PathType Container)) {
    Write-Output "Comps folder not found in: $currentDir"
    exit 1
}

# Iterate over each PDF in comps (excluding subfolders).
$pdfFiles = Get-ChildItem -LiteralPath $currentDir -File -Filter '*.pdf'

foreach ($file in $pdfFiles) {
    # Extract filename without extension.
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)

    # Remove "Rental " from filename if it exists.
    $cleanName = $baseName -replace '^Rental ', ''

    # Remove everything after the "$" character and trim.
    $folderName = ($cleanName -split '\$', 2)[0].Trim()

    # Append " - mls" to the cleaned file name.
    $finalName = "$folderName - mls.pdf"

    # Prefix rental folders with "(R) ".
    if ($file.Name.StartsWith('Rental', [System.StringComparison]::Ordinal)) {
        $folderName = "(R) $folderName"
    }

    $folderPath = Join-Path -Path $currentDir -ChildPath $folderName

    # Create target folder if it does not exist.
    if (-not (Test-Path -LiteralPath $folderPath -PathType Container)) {
        New-Item -ItemType Directory -Path $folderPath | Out-Null
        Write-Output "Created folder: $folderName"
    }

    # Move and rename file into target folder.
    $destinationPath = Join-Path -Path $folderPath -ChildPath $finalName
    Move-Item -LiteralPath $file.FullName -Destination $destinationPath
    Write-Output "Moved file: $($file.Name) -> $folderName/$finalName"
}

Write-Output "Comps organized successfully."
