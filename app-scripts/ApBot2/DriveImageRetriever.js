 function getImageUrl(folderId, filename) {
  Logger.log("Filename: " + filename);
  Logger.log("Folder ID: " + folderId);
  // var imageUrl = "https://drive.google.com/uc?id=14X-dyOFyt4AF6W540zLpyP4qVAXsZ8Td&export=download";
  // return imageUrl;
try {
    var folder = DriveApp.getFolderById(folderId);
    Logger.log("Folder retrieved: " + folder.getName()); // Check if folder is retrieved
    var files = folder.getFilesByName(filename);
    if (files.hasNext()) {
      var file = files.next();
      Logger.log("File found: " + file.getName()); // Check if file is found
      var imageUrl = file.getDownloadUrl();
      Logger.log("Image URL: " + imageUrl); // Check the URL
      return imageUrl;
    } else {
      Logger.log("File not found.");
      return null;
    }
  } catch (e) {
    Logger.log("Error: " + e.toString()); // Log any errors
    Logger.log(e);
    return e.toString();
  }
}