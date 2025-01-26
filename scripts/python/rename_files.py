import os

# Path to the main directory containing the property folders
base_dir = "/Users/dougiefresh/Dropbox/Appraisals/jami-langford/2024/commercial/1-20 LAND MIDLAND TX/comps/property-details"

# Iterate through each folder in the base directory
for folder_name in os.listdir(base_dir):
    folder_path = os.path.join(base_dir, folder_name)

    # Check if it's a folder
    if os.path.isdir(folder_path):
        for file_name in os.listdir(folder_path):
            file_path = os.path.join(folder_path, file_name)

            # Skip if it's not a file
            if not os.path.isfile(file_path):
                continue

            # Determine the new name based on 'cad' or 'mls'
            if "cad" in file_name.lower():
                suffix = "cad"
            elif "mls" in file_name.lower():
                suffix = "mls"
            else:
                # Skip files that don't match the criteria
                continue

            # Construct the new file name
            new_file_name = f"{folder_name}-{suffix}.pdf"
            new_file_path = os.path.join(folder_path, new_file_name)

            # Rename the file
            os.rename(file_path, new_file_path)
            print(f"Renamed: {file_path} -> {new_file_path}")
