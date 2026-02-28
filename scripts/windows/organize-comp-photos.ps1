param(
    [Parameter(Position = 0)]
    [string]$BaseDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Name {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $normalized = $Value.ToLowerInvariant()
    $normalized = [System.Text.RegularExpressions.Regex]::Replace($normalized, "[^a-z0-9]+", " ")
    return $normalized.Trim()
}

function Get-LevenshteinDistance {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Left,
        [Parameter(Mandatory = $true)]
        [string]$Right
    )

    $leftLength = $Left.Length
    $rightLength = $Right.Length

    $matrix = New-Object "int[,]" ($leftLength + 1), ($rightLength + 1)

    for ($i = 0; $i -le $leftLength; $i++) {
        $matrix[$i, 0] = $i
    }

    for ($j = 0; $j -le $rightLength; $j++) {
        $matrix[0, $j] = $j
    }

    for ($i = 1; $i -le $leftLength; $i++) {
        for ($j = 1; $j -le $rightLength; $j++) {
            $cost = if ($Left[$i - 1] -eq $Right[$j - 1]) { 0 } else { 1 }
            $deletion = $matrix[$i - 1, $j] + 1
            $insertion = $matrix[$i, $j - 1] + 1
            $substitution = $matrix[$i - 1, $j - 1] + $cost
            $matrix[$i, $j] = [Math]::Min([Math]::Min($deletion, $insertion), $substitution)
        }
    }

    return $matrix[$leftLength, $rightLength]
}

$currentDir = if ([string]::IsNullOrWhiteSpace($BaseDirectory)) {
    (Get-Location).Path
} else {
    (Resolve-Path -LiteralPath $BaseDirectory).Path
}

$leafName = Split-Path -Path $currentDir -Leaf
if ($leafName -ne "comps") {
    $currentDir = Join-Path $currentDir "comps"
}

$photosDir = Join-Path $currentDir "photos"

if (-not (Test-Path -LiteralPath $photosDir -PathType Container)) {
    Write-Output "Photos folder not found: $photosDir"
    exit 1
}

$folderList = Get-ChildItem -LiteralPath $currentDir -Directory |
    Where-Object { $_.Name -ne "photos" }

$photoFiles = Get-ChildItem -LiteralPath $photosDir -File

foreach ($photo in $photoFiles) {
    $photoBase = $photo.BaseName

    if ([string]::IsNullOrWhiteSpace($photoBase)) {
        Write-Output "Skipping empty filename: $($photo.FullName)"
        continue
    }

    $normalizedPhoto = Normalize-Name -Value $photoBase

    $bestMatch = $null
    $bestDistance = [int]::MaxValue

    foreach ($folder in $folderList) {
        $normalizedFolder = Normalize-Name -Value $folder.Name
        $distance = Get-LevenshteinDistance -Left $normalizedPhoto -Right $normalizedFolder

        if ($distance -lt $bestDistance) {
            $bestDistance = $distance
            $bestMatch = $folder
        }
    }

    if ($bestDistance -le 5 -and $null -ne $bestMatch -and (Test-Path -LiteralPath $bestMatch.FullName -PathType Container)) {
        Move-Item -LiteralPath $photo.FullName -Destination $bestMatch.FullName -Force
        Write-Output "Moved: $($photo.FullName) -> $($bestMatch.FullName)\"
    } else {
        Write-Output "Unmatched photo: $($photo.FullName)"
    }
}

Write-Output "Photo organization complete."
