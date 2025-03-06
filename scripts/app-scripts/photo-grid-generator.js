function createPhotoGrid() {
  try {
    let doc = DocumentApp.getActiveDocument();
    let body = doc.getBody();
    let picturesFolder = DriveApp.getFolderByName('pictures'); // Assumes "pictures" folder is in your main Google Drive

    if (!picturesFolder) {
      DocumentApp.getUi().alert(
        'Error: Folder "pictures" not found in your Google Drive root.'
      );
      return;
    }

    let photos = picturesFolder.getFiles();
    let photoArray = [];
    while (photos.hasNext()) {
      let file = photos.next();
      if (file.getMimeType().startsWith('image/')) {
        // Only process image files
        photoArray.push(file);
      }
    }

    if (photoArray.length === 0) {
      DocumentApp.getUi().alert(
        'Error: No image files found in the "pictures" folder.'
      );
      return;
    }

    let photoIndex = 0;
    let photosPerPage = 6;

    // --- First Page (Special Layout) ---
    if (photoArray.length > 0) {
      // Only create the first page table if there are photos
      let table1 = body.appendTable(); // Create an empty table, we'll add rows in the loop
      for (let row = 0; row < 2; row++) {
        let rowElement = table1.appendTableRow(); // Append row for each row in 2x3 table
        for (let col = 0; col < 3; col++) {
          if (photoIndex < photoArray.length && photoIndex < photosPerPage) {
            let photoFile = photoArray[photoIndex];
            let image = rowElement
              .appendTableCell()
              .insertImage(photoFile)
              .asInlineImage();
            image.setWidth(200); // Adjust image width as needed (in pixels)
            image.setHeight(150); // Adjust image height to maintain aspect ratio

            if (col === 1) {
              // Second column: Labels
              rowElement
                .getCell(col)
                .setText(photoFile.getName().split('.')[0]); // Filename as label
            } else if (col === 2) {
              // Third column empty
              rowElement.getCell(col).setText(''); // Intentionally empty
            }
            photoIndex++;
          } else {
            rowElement.appendTableCell().setText(''); // Empty cells if fewer than 6 photos for first page
          }
        }
      }
      body.appendParagraph(''); // Add a paragraph break after the first table for spacing
    }

    // --- Subsequent Pages (Standard Layout) ---
    while (photoIndex < photoArray.length) {
      let tableNextPage = body.appendTable(); // New table for each page
      for (let row = 0; row < 2; row++) {
        let rowElement = tableNextPage.appendTableRow();
        for (let col = 0; col < 3; col++) {
          if (photoIndex < photoArray.length) {
            let photoFile = photoArray[photoIndex];
            let cell = rowElement.appendTableCell();
            let image = cell.insertImage(photoFile).asInlineImage();
            image.setWidth(200); // Adjust image width
            image.setHeight(150); // Adjust image height

            cell.appendText('\n' + photoFile.getName().split('.')[0]); // Label below image

            photoIndex++;
          } else {
            rowElement.appendTableCell().setText(''); // Empty cells for remaining spots
          }
        }
      }
      if (photoIndex < photoArray.length) {
        // Add page break if more photos are coming
        body.appendPageBreak();
      }
    }

    DocumentApp.getUi().alert('Photo grid generation complete!');
  } catch (e) {
    Logger.log('Error: ' + e); // Log detailed error to Apps Script execution log
    DocumentApp.getUi().alert(
      'An error occurred. Check Apps Script execution log (View > Logs).'
    );
  }
}

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Photo Grid')
    .addItem('Create Grid', 'createPhotoGrid')
    .addToUi();
}
