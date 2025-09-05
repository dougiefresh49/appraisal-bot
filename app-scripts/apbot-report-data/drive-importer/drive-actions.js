// Function to search for folders by name more broadly
function findFolderByName(folderName) {
  Logger.log('findFolderByName called with: ' + folderName);
  try {
    // First try to find in root
    let folders = DriveApp.getRootFolder().getFoldersByName(folderName);
    if (folders.hasNext()) {
      const folder = folders.next();
      Logger.log(
        'Found folder in root: ' +
          folder.getName() +
          ' with ID: ' +
          folder.getId()
      );
      return { success: true, folder: folder, location: 'root' };
    }

    // If not in root, search in "My Drive" more broadly
    Logger.log('Folder not found in root, searching more broadly...');

    // Get all folders and search recursively (limited depth for performance)
    const allFolders = getAllFoldersRecursive(DriveApp.getRootFolder(), 3);
    Logger.log('Searching through ' + allFolders.length + ' folders...');

    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].getName().toLowerCase() === folderName.toLowerCase()) {
        Logger.log(
          'Found folder: ' +
            allFolders[i].getName() +
            ' with ID: ' +
            allFolders[i].getId()
        );
        return { success: true, folder: allFolders[i], location: 'nested' };
      }
    }

    Logger.log('No folder found with name: ' + folderName);
    return { success: false, error: 'Folder not found: ' + folderName };
  } catch (error) {
    Logger.log('Error in findFolderByName: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// Helper function to get all folders recursively (with depth limit)
function getAllFoldersRecursive(folder, maxDepth, currentDepth = 0) {
  const folders = [];

  if (currentDepth >= maxDepth) {
    return folders;
  }

  try {
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      const subfolder = subfolders.next();
      folders.push(subfolder);

      // Recursively get subfolders (limited depth)
      if (currentDepth < maxDepth - 1) {
        const nestedFolders = getAllFoldersRecursive(
          subfolder,
          maxDepth,
          currentDepth + 1
        );
        folders.push(...nestedFolders);
      }
    }
  } catch (error) {
    Logger.log(
      'Error getting subfolders for ' +
        folder.getName() +
        ': ' +
        error.toString()
    );
  }

  return folders;
}

// Function to get the current spreadsheet's parent folder
function getCurrentSpreadsheetFolder() {
  Logger.log('getCurrentSpreadsheetFolder called');
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const file = DriveApp.getFileById(spreadsheet.getId());
    const parentFolder = file.getParents().next();

    Logger.log(
      'Current spreadsheet is in folder: ' +
        parentFolder.getName() +
        ' (ID: ' +
        parentFolder.getId() +
        ')'
    );

    // Get the parent's parent (should be the project folder)
    const projectFolder = parentFolder.getParents().next();
    Logger.log(
      'Project folder: ' +
        projectFolder.getName() +
        ' (ID: ' +
        projectFolder.getId() +
        ')'
    );

    return {
      success: true,
      spreadsheetFolder: parentFolder,
      projectFolder: projectFolder,
    };
  } catch (error) {
    Logger.log('Error in getCurrentSpreadsheetFolder: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// Function to list available folders in current location
function listAvailableFolders() {
  Logger.log('listAvailableFolders called');
  try {
    const result = getCurrentSpreadsheetFolder();
    if (!result.success) {
      return result;
    }

    const projectFolder = result.projectFolder;
    const folders = projectFolder.getFolders();
    const folderList = [];

    while (folders.hasNext()) {
      const folder = folders.next();
      folderList.push({
        id: folder.getId(),
        name: folder.getName(),
        url: folder.getUrl(),
        lastUpdated: folder.getLastUpdated().toString(),
      });
    }

    Logger.log(
      'Found ' +
        folderList.length +
        ' folders in project: ' +
        projectFolder.getName()
    );
    return {
      success: true,
      folders: folderList,
      projectName: projectFolder.getName(),
      projectId: projectFolder.getId(),
    };
  } catch (error) {
    Logger.log('Error in listAvailableFolders: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// Function to get files and subfolders from a specific folder
function getFolderContents(folderId) {
  Logger.log('getFolderContents called with folder ID: ' + folderId);
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const subfolders = folder.getFolders();

    const fileList = [];
    const folderList = [];

    // Get files
    while (files.hasNext()) {
      const file = files.next();
      fileList.push({
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        mimeType: file.getMimeType(),
        size: file.getSize(),
        lastUpdated: file.getLastUpdated().toString(),
        type: 'file',
      });
    }

    // Get subfolders
    while (subfolders.hasNext()) {
      const subfolder = subfolders.next();
      folderList.push({
        id: subfolder.getId(),
        name: subfolder.getName(),
        url: subfolder.getUrl(),
        lastUpdated: subfolder.getLastUpdated().toString(),
        type: 'folder',
      });
    }

    Logger.log(
      'Found ' +
        fileList.length +
        ' files and ' +
        folderList.length +
        ' subfolders'
    );
    return {
      success: true,
      files: fileList,
      folders: folderList,
      currentFolder: {
        id: folder.getId(),
        name: folder.getName(),
        url: folder.getUrl(),
      },
    };
  } catch (error) {
    Logger.log('Error in getFolderContents: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// Function to get a specific file by ID
function getFileById(fileId) {
  Logger.log('getFileById called with: ' + fileId);
  try {
    const file = DriveApp.getFileById(fileId);
    return {
      success: true,
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      mimeType: file.getMimeType(),
      size: file.getSize(),
      lastUpdated: file.getLastUpdated().toString(),
    };
  } catch (error) {
    Logger.log('Error in getFileById: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}
