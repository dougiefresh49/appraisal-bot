#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Organize Comp Photos
# @raycast.mode inline

# Optional parameters:
# @raycast.icon 📸

# Documentation:
# @raycast.description Organizes photos in `comps/photos` by matching them to the most relevant address in `comps/`, including rental comps which have an `(R) ` prefix.
# @raycast.packageName Appraisal Bot
# @raycast.needsConfirmation false
# @raycast.author dougiefresh49
# @raycast.authorURL https://github.com/dougiefresh49

# Function to normalize names (lowercase, remove special characters)
normalize_name() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/ /g' | xargs
}

# Function to calculate Levenshtein distance (fuzzy matching)
levenshtein_distance() {
    awk -v s1="$1" -v s2="$2" '
    function min(a, b, c) { return (a < b ? (a < c ? a : c) : (b < c ? b : c)) }
    BEGIN {
        n = length(s1);
        m = length(s2);
        for (i = 0; i <= n; i++) d[i, 0] = i;
        for (j = 0; j <= m; j++) d[0, j] = j;
        for (i = 1; i <= n; i++) {
            for (j = 1; j <= m; j++) {
                cost = (substr(s1, i, 1) == substr(s2, j, 1)) ? 0 : 1;
                d[i, j] = min(d[i-1, j] + 1, d[i, j-1] + 1, d[i-1, j-1] + cost);
            }
        }
        print d[n, m];
    }'
}

# Get the current Finder directory
current_dir=$(osascript -e 'tell application "Finder" to get POSIX path of (target of front window as alias)')

# Fall back to home directory if Finder is not open
if [ -z "$current_dir" ]; then
    echo "No Finder window detected. Defaulting to home directory."
    current_dir="$HOME"
fi

# Ensure the current directory is correct and points to the comps folder
if [[ "$current_dir" != */comps ]]; then
    current_dir="${current_dir%/}/comps"
fi

photos_dir="$current_dir/photos"

# Check if the photos directory exists
if [ ! -d "$photos_dir" ]; then
    echo "Photos folder not found: $photos_dir"
    exit 1
fi

# Get all comp and rental folders, normalize their names
folder_list=()
while IFS= read -r folder; do
    folder_list+=("$folder")
done < <(find "$current_dir" -mindepth 1 -maxdepth 1 -type d -not -name "photos")

# Iterate over each photo in the photos directory
for photo in "$photos_dir"/*; do
    # Skip if not a file
    if [ ! -f "$photo" ]; then
        continue
    fi

    photo_name=$(basename "$photo")
    photo_base="${photo_name%.*}"  # Remove extension

    if [ -z "$photo_base" ]; then
        echo "Skipping empty filename: $photo"
        continue
    fi

    # Normalize photo name
    normalized_photo=$(normalize_name "$photo_base")

    best_match=""
    best_distance=999

    # Find the best matching folder name
    for folder in "${folder_list[@]}"; do
        folder_name=$(basename "$folder")
        normalized_folder=$(normalize_name "$folder_name")

        distance=$(levenshtein_distance "$normalized_photo" "$normalized_folder")

        if [ "$distance" -lt "$best_distance" ]; then
            best_distance="$distance"
            best_match="$folder"
        fi
    done

    # Move the photo if a reasonable match is found
    if [ "$best_distance" -le 5 ] && [ -n "$best_match" ] && [ -d "$best_match" ]; then
        mv "$photo" "$best_match/"
        echo "Moved: $photo -> $best_match/"
    else
        echo "Unmatched photo: $photo"
    fi
done

echo "Photo organization complete."