param(
    [string]$ManifestPath = (Join-Path $PSScriptRoot "..\appraisal-bot\manifest.json"),
    [string]$StateFile = (Join-Path $env:LOCALAPPDATA "AppraisalBot\installed_version.txt"),
    [string]$ExtensionId = "",
    [switch]$OpenExtensionsPage
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-AppraisalBotUpdateNotification {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string]$Body
    )

    # Try native Windows toast first.
    try {
        Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

        $escapedTitle = [System.Security.SecurityElement]::Escape($Title)
        $escapedBody = [System.Security.SecurityElement]::Escape($Body)
        $toastXml = @"
<toast activationType="protocol">
  <visual>
    <binding template="ToastGeneric">
      <text>$escapedTitle</text>
      <text>$escapedBody</text>
    </binding>
  </visual>
</toast>
"@

        $xmlDoc = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xmlDoc.LoadXml($toastXml)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xmlDoc)
        $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Microsoft.Windows.PowerShell")
        $notifier.Show($toast)
        return
    } catch {
        # Fall through to balloon notification if toast APIs are unavailable.
    }

    # Fallback for older/locked-down environments.
    Add-Type -AssemblyName System.Windows.Forms | Out-Null
    Add-Type -AssemblyName System.Drawing | Out-Null

    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.BalloonTipTitle = $Title
    $notify.BalloonTipText = $Body
    $notify.Visible = $true
    $notify.ShowBalloonTip(10000)
    Start-Sleep -Seconds 12
    $notify.Dispose()
}

if (-not (Test-Path -LiteralPath $ManifestPath)) {
    throw "Manifest not found: $ManifestPath"
}

$manifestRaw = Get-Content -LiteralPath $ManifestPath -Raw
$manifest = $manifestRaw | ConvertFrom-Json
$remoteVersion = [string]$manifest.version

if ([string]::IsNullOrWhiteSpace($remoteVersion)) {
    throw "No version field found in manifest: $ManifestPath"
}

$stateDir = Split-Path -Parent $StateFile
if (-not (Test-Path -LiteralPath $stateDir)) {
    New-Item -Path $stateDir -ItemType Directory -Force | Out-Null
}

$localVersion = ""
if (Test-Path -LiteralPath $StateFile) {
    $localVersion = (Get-Content -LiteralPath $StateFile -Raw).Trim()
}

if ($remoteVersion -ne $localVersion) {
    Set-Content -LiteralPath $StateFile -Value $remoteVersion -NoNewline

    Show-AppraisalBotUpdateNotification `
        -Title "AppraisalBot updated to v$remoteVersion" `
        -Body "Open Chrome Extensions and click Reload."

    if ($OpenExtensionsPage -and -not [string]::IsNullOrWhiteSpace($ExtensionId)) {
        Start-Process "chrome://extensions/?id=$ExtensionId"
    }

    Write-Output "Update detected: $localVersion -> $remoteVersion"
    exit 0
}

Write-Output "No update. Current version: $remoteVersion"
exit 0
