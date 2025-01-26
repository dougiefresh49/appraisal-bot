#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Scaffold Residential Appraisal Workfile
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📁

# Documentation:
# @raycast.description Creates a flat folder structure for organizing residential appraisal work files.
# @raycast.packageName Appraisal Bot
# @raycast.needsConfirmation false
# @raycast.author dougiefresh49
# @raycast.authorURL https://github.com/dougiefresh49

# Get the current Finder directory
current_dir=$(osascript -e 'tell application "Finder" to get POSIX path of (target of front window as alias)')

# Fall back to home directory if the Finder window is not open
if [ -z "$current_dir" ]; then
    echo "No Finder window detected. Defaulting to home directory."
    current_dir="$HOME"
fi

# Navigate to the current Finder directory
cd "$current_dir" || exit

# Array of top-level folders
folders=("comps" "reports" "subject" "neighborhood" "engagement-docs")

# Array of subfolders with their respective parent folders
subfolders=(
    "comps/data",
    "reports/analysis",
    "reports/analysis/propmts",
    "reports/analysis/results",
)

# Create top-level folders
for folder in "${folders[@]}"; do
    if [ ! -d "$folder" ]; then
        mkdir -p "$folder"
        echo "Created folder: $folder"
    else
        echo "Folder already exists: $folder"
    fi
done

# Create subfolders
for subfolder in "${subfolders[@]}"; do
    if [ ! -d "$subfolder" ]; then
        mkdir -p "$subfolder"
        echo "Created subfolder: $subfolder"
    else
        echo "Subfolder already exists: $subfolder"
    fi
done