import os
import shutil

# Define the source folder containing images
source_folder = "/Users/dougiefresh/Dropbox/Appraisals/basin-appraisals-llc/2025/commercial/in-progress/1227 S Murphy/subject/photos"  # Change this to your actual folder path
output_folder = "/Users/dougiefresh/Dropbox/Appraisals/basin-appraisals-llc/2025/commercial/in-progress/1227 S Murphy/subject/grouped_photos"  # Change this to the desired output location

# Define the source folder containing the individual folders with images
source_folder = "/Users/dougiefresh/Dropbox/Appraisals/basin-appraisals-llc/2025/commercial/in-progress/1227 S Murphy/subject/grouped_photos"

# Iterate through all subdirectories in the source folder
for root, dirs, files in os.walk(source_folder):
    # Skip the main source folder itself
    if root == source_folder:
        continue
        
    # Get the current folder name
    folder_name = os.path.basename(root)
    # Remove the extension if it exists
    new_folder_name = os.path.splitext(folder_name)[0]
    
    if folder_name != new_folder_name:
        # Create the new folder path
        new_folder_path = os.path.join(os.path.dirname(root), new_folder_name)
        # Rename the folder
        try:
            os.rename(root, new_folder_path)
            # Update root to the new path for file operations
            root = new_folder_path
        except OSError:
            pass  # Skip if there's an error renaming
    
    # Process files in each subdirectory
    for file in files:
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            # Get the full path of the source file
            source_file = os.path.join(root, file)
            # Get the destination path in the root folder
            destination_file = os.path.join(source_folder, file)
            
            # Move the file to the root folder
            shutil.move(source_file, destination_file)
            
    # Optional: Remove the empty directory after moving its files
    if root != source_folder:
        try:
            os.rmdir(root)
        except OSError:
            pass  # Skip if directory isn't empty or there's another error


