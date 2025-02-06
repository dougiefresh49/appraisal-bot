#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Organize Comps by Address
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🗂️

# Documentation:
# @raycast.description Creates a folder for each file in the comps directory using only the address (up to the $) and moves the file into the respective folder, works for both rentals and standard comps.
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

# Ensure the current directory is correct and points to the comps folder
if [[ "$current_dir" != */comps ]]; then
    current_dir="${current_dir%/}/comps"
fi

# Check if the comps directory exists
if [ -d "$current_dir" ]; then
    cd "$current_dir" || exit
else
    echo "Comps folder not found in: $current_dir"
    exit 1
fi

# Iterate over each PDF file in the comps directory (excluding subfolders)
for file in *.pdf; do
    # Skip if no PDFs are found
    if [ ! -f "$file" ]; then
        continue
    fi

    # Extract the filename without the extension
    base_name="${file%.*}"

    # Remove "Rental " from filename if it exists
    clean_name=$(echo "$base_name" | sed 's/^Rental //')

    # Remove everything after the `$` character to get just the address
    folder_name=$(echo "$clean_name" | awk -F'\\$' '{print $1}' | xargs)

    # Append " - mls" to the cleaned file name
    final_name="${folder_name} - mls.pdf"

    # Prefix rental folders with "(R) "
    if [[ "$file" == Rental* ]]; then
        folder_name="(R) $folder_name"
    fi

    # Create a folder with the cleaned name (if it doesn't already exist)
    if [ ! -d "$folder_name" ]; then
        mkdir "$folder_name"
        echo "Created folder: $folder_name"
    fi

    # Move the file into the corresponding folder
    mv "$file" "$folder_name/$final_name"
    echo "Moved file: $file -> $folder_name/$final_name"

done

echo "Comps organized successfully."