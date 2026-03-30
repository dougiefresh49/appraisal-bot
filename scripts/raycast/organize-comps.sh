#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Organize Comps by Address
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🗂️
# @raycast.argument1 { "type": "text", "placeholder": "Subfolder (land, sales, rentals)", "optional": true }

# Documentation:
# @raycast.description Creates a folder for each file in the comps directory (or a subfolder like land/sales/rentals) using only the address (up to the $) and moves the file into the respective folder, works for both rentals and standard comps. Open Finder on the job folder, on comps, or on comps/land (etc.). Optional argument overrides the subfolder when you are not already inside it.
# @raycast.packageName Appraisal Bot
# @raycast.needsConfirmation false
# @raycast.author dougiefresh49
# @raycast.authorURL https://github.com/dougiefresh49

# Optional subfolder (Raycast passes empty string when omitted)
subfolder_arg="${1:-}"
subfolder_arg="${subfolder_arg//[[:space:]]/}"

# Allowed subfolder names when passing an explicit argument (avoids typos vs project folders)
valid_subfolders_re='^(land|sales|rentals)$'

# Get the current Finder directory
current_dir=$(osascript -e 'tell application "Finder" to get POSIX path of (target of front window as alias)')

# Fall back to home directory if the Finder window is not open
if [ -z "$current_dir" ]; then
    echo "No Finder window detected. Defaulting to home directory."
    current_dir="$HOME"
fi

current_dir="${current_dir%/}"

comps_root=""
finder_rel="" # path under comps, e.g. "" or "land" or "land/nested"

if [[ "$current_dir" == *"/comps"* ]]; then
    comps_root="${current_dir%%/comps*}/comps"
    suffix="${current_dir#*\/comps}"
    suffix="${suffix#/}"
    finder_rel="$suffix"
else
    comps_root="${current_dir}/comps"
fi

if [ -n "$subfolder_arg" ]; then
    if [[ ! "$subfolder_arg" =~ $valid_subfolders_re ]]; then
        echo "Subfolder must be one of: land, sales, rentals (got: ${1:-})"
        exit 1
    fi
    work_dir="${comps_root}/${subfolder_arg}"
elif [ -n "$finder_rel" ]; then
    # Finder is already inside comps (e.g. .../comps/land) — organize that folder
    finder_segment="${finder_rel%%/*}"
    if [[ ! "$finder_segment" =~ $valid_subfolders_re ]]; then
        echo "Under comps, use land, sales, or rentals (Finder is in: $finder_segment)"
        exit 1
    fi
    work_dir="${comps_root}/${finder_rel}"
else
    work_dir="$comps_root"
fi

if [ -d "$work_dir" ]; then
    cd "$work_dir" || exit
else
    echo "Folder not found: $work_dir"
    exit 1
fi

echo "Organizing PDFs in: $work_dir"

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

    # Address is everything before `$` (list / price suffix)
    address_part=$(echo "$clean_name" | awk -F'\\$' '{print $1}' | xargs)

    # Folder name: address only — strip trailing " - MLS" / " - mls" (case-insensitive on mls)
    folder_name=$(echo "$address_part" | sed -E 's/[[:space:]]*-[[:space:]]*[Mm][Ll][Ss]$//' | xargs)

    # Destination filename: keep existing " - …mls" suffix if already present at end of address
    if [[ "$address_part" =~ -[[:space:]]*[Mm][Ll][Ss]$ ]]; then
        final_name="${address_part}.pdf"
    else
        final_name="${folder_name} - mls.pdf"
    fi

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