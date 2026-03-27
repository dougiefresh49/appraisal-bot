/**
 * Prompts the user for the Google Drive Folder ID containing images
 * and the File ID of the JSON manifest.
 */
function promptForImageInputsFromFile() {
  const ui = DocumentApp.getUi();
  let jsonDataString = '';

  try {
    // Prompt for the Folder ID
    const folderResult = ui.prompt(
      'Step 1: Image Folder ID',
      'Please enter the ID of the Google Drive folder containing the subject images:',
      ui.ButtonSet.OK_CANCEL
    );

    if (
      folderResult.getSelectedButton() !== ui.Button.OK ||
      !folderResult.getResponseText()
    ) {
      ui.alert(
        'Operation Canceled',
        'Image insertion was canceled because no folder ID was provided.',
        ui.ButtonSet.OK
      );
      Logger.log('User canceled or provided no folder ID.');
      return;
    }
    const imageFolderId = folderResult.getResponseText().trim();
    Logger.log(`User provided Folder ID: ${imageFolderId}`);

    // Validate folder ID
    try {
      DriveApp.getFolderById(imageFolderId);
      Logger.log(
        `Successfully accessed image folder with ID: ${imageFolderId}`
      );
    } catch (e) {
      Logger.log(
        `Error accessing image folder ID ${imageFolderId}: ${e.message}`
      );
      ui.alert(
        'Invalid Folder ID',
        `Could not access image folder with ID: ${imageFolderId}. Please check the ID and permissions. Error: ${e.message}`,
        ui.ButtonSet.OK
      );
      return;
    }

    // Prompt for the JSON File ID
    const jsonFileResult = ui.prompt(
      'Step 2: JSON Manifest File ID',
      'Please enter the File ID of the JSON/text file in Google Drive containing the image list and labels:',
      ui.ButtonSet.OK_CANCEL
    );

    if (
      jsonFileResult.getSelectedButton() !== ui.Button.OK ||
      !jsonFileResult.getResponseText()
    ) {
      ui.alert(
        'Operation Canceled',
        'Image insertion was canceled because no JSON file ID was provided.',
        ui.ButtonSet.OK
      );
      Logger.log('User canceled or provided no JSON File ID.');
      return;
    }
    const jsonFileId = jsonFileResult.getResponseText().trim();
    Logger.log(`User provided JSON File ID: ${jsonFileId}`);

    // Read JSON data from the file
    try {
      const jsonFile = DriveApp.getFileById(jsonFileId);
      jsonDataString = jsonFile.getBlob().getDataAsString();
      Logger.log(
        `Successfully read JSON file "${jsonFile.getName()}". Length: ${
          jsonDataString.length
        }`
      );
      if (jsonDataString.length > 0) {
        Logger.log(
          `JSON string from file (first 200 chars): ${jsonDataString.substring(
            0,
            200
          )}`
        );
      }
    } catch (e) {
      Logger.log(`Error reading JSON file ID ${jsonFileId}: ${e.message}`);
      ui.alert(
        'JSON File Error',
        `Could not read the JSON file with ID: ${jsonFileId}. Please check the ID and permissions. Error: ${e.message}`,
        ui.ButtonSet.OK
      );
      return;
    }

    // Parse JSON and proceed
    Logger.log('Attempting to parse JSON data from file...');
    const imageManifest = JSON.parse(jsonDataString);
    Logger.log('Successfully parsed JSON data from file.');

    if (!Array.isArray(imageManifest)) {
      Logger.log('Parsed JSON is not an array.');
      throw new Error('JSON data from file must be an array.');
    }
    Logger.log(
      `Parsed imageManifest is an array. Number of images: ${imageManifest.length}`
    );

    Logger.log('Calling insertSubjectImages function...');
    insertSubjectImages(imageFolderId, imageManifest);
    Logger.log('Returned from insertSubjectImages function.');
  } catch (e) {
    const errorMessage = e.message || 'Unknown error';
    const errorStack = e.stack || 'No stack trace available';
    Logger.log(
      `ERROR in promptForImageInputsFromFile's catch block:\nMessage: ${errorMessage}\nStack: ${errorStack}\nJSON String (first 100 chars if available): ${
        jsonDataString ? jsonDataString.substring(0, 100) : 'N/A'
      }`
    );
    ui.alert(
      'Processing Error',
      `An error occurred.\nMessage: ${errorMessage}\nPlease check the script execution logs for more details.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Inserts subject images into the document based on the provided folder ID and manifest.
 * @param {string} imageFolderId The ID of the Google Drive folder containing the images.
 * @param {Array<Object>} imageManifest An array of objects, each with 'image' (filename) and 'label'.
 */
function insertSubjectImages(imageFolderId, imageManifest) {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const ui = DocumentApp.getUi();
  Logger.log(
    `insertSubjectImages called. Folder ID: ${imageFolderId}, Number of manifest entries: ${imageManifest.length}`
  );
  insertSubjectImagesInternal(doc, imageFolderId, imageManifest, ui);
}

/**
 * Internal function to insert subject images into a specific document.
 * This version doesn't use UI and can be called from webhooks.
 * @param {DocumentApp.Document} doc The Google Docs document to modify.
 * @param {string} imageFolderId The ID of the Google Drive folder containing the images.
 * @param {Array<Object>} imageManifest An array of objects, each with 'image' (filename) and 'label'.
 * @param {DocumentApp.Ui} ui Optional UI object for displaying alerts (can be null for webhook calls).
 * @return {Object} Result object with success status and message.
 */
function insertSubjectImagesInternal(
  doc,
  imageFolderId,
  imageManifest,
  ui = null
) {
  const body = doc.getBody();
  Logger.log(
    `insertSubjectImagesInternal called. Document ID: ${doc.getId()}, Folder ID: ${imageFolderId}, Number of manifest entries: ${
      imageManifest.length
    }`
  );

  // --- Constants for dimensions (inches * 72 points/inch) ---
  const HEADING_TEXT = 'SUBJECT PHOTOS';
  // --- UPDATED: More precise dimensions ---
  const FIRST_TABLE_IMAGE_COL_WIDTH_POINTS = 4.049 * 72;
  const FIRST_TABLE_IMAGE_WIDTH_POINTS = 3.91 * 96;
  const FIRST_TABLE_IMAGE_HEIGHT_POINTS = 2.95 * 96;
  const SUBSEQUENT_TABLE_IMAGE_COL_WIDTH_POINTS = 3.206 * 72;
  const SUBSEQUENT_TABLE_IMAGE_WIDTH_POINTS = 3.15 * 96;
  const SUBSEQUENT_TABLE_IMAGE_HEIGHT_POINTS = 2.36 * 96;

  const TABLE_TOTAL_WIDTH_POINTS = 6.5 * 72;

  let searchResult = null;
  let headingFound = false;
  let insertionIndex = -1;
  let headingElement = null;

  Logger.log(`Searching for heading: "${HEADING_TEXT}"`);
  // --- REVERTED: Use the more robust while loop to find the heading ---
  let paragraph = body.findElement(
    DocumentApp.ElementType.PARAGRAPH,
    searchResult
  );
  while (paragraph) {
    const element = paragraph.getElement();
    if (
      element.asParagraph().getHeading() ===
      DocumentApp.ParagraphHeading.HEADING2
    ) {
      if (
        element.asText().getText().trim().toUpperCase() ===
        HEADING_TEXT.toUpperCase()
      ) {
        headingFound = true;
        headingElement = element;
        insertionIndex = body.getChildIndex(headingElement) + 1;
        Logger.log(
          `Heading "${HEADING_TEXT}" found at index ${body.getChildIndex(
            headingElement
          )}. Will insert tables at index ${insertionIndex}.`
        );
        break;
      }
    }
    searchResult = paragraph;
    paragraph = body.findElement(
      DocumentApp.ElementType.PARAGRAPH,
      searchResult
    );
  }

  if (!headingFound) {
    Logger.log(`Heading 2 with text "${HEADING_TEXT}" not found.`);
    const errorMsg = `Heading 2 with text "${HEADING_TEXT}" not found. Images cannot be inserted. Please ensure it exists and matches exactly.`;
    if (ui) {
      ui.alert('Error', errorMsg, ui.ButtonSet.OK);
    }
    throw new Error(errorMsg);
  }

  let imageFolder;
  try {
    imageFolder = DriveApp.getFolderById(imageFolderId);
  } catch (e) {
    const errorMsg = `Cannot access image folder with ID: ${imageFolderId}. Error: ${e.message}`;
    Logger.log(errorMsg);
    if (ui) {
      ui.alert('Error', errorMsg, ui.ButtonSet.OK);
    }
    throw new Error(errorMsg);
  }

  const imagesToProcess = imageManifest.slice();
  Logger.log(
    `Starting image insertion loop. Total images to process: ${imagesToProcess.length}`
  );

  // --- First Table: 3 rows x 2 columns (Image | Label) ---
  if (imagesToProcess.length > 0) {
    Logger.log('Creating first table (3x2 layout, image | label).');
    const table1Rows = Math.min(3, imagesToProcess.length);
    const table1Cells = Array(table1Rows)
      .fill(null)
      .map(() => ['', '']);

    if (table1Rows > 0) {
      const table1 = body.insertTable(insertionIndex++, table1Cells);
      const imageColWidth = FIRST_TABLE_IMAGE_COL_WIDTH_POINTS;
      const labelColWidth = TABLE_TOTAL_WIDTH_POINTS - imageColWidth;

      table1.setColumnWidth(0, imageColWidth);
      table1.setColumnWidth(1, labelColWidth);

      for (let i = 0; i < table1Rows; i++) {
        if (imagesToProcess.length === 0) break;
        const imageData = imagesToProcess.shift();
        const cellImage = table1.getCell(i, 0);
        const cellLabel = table1.getCell(i, 1);
        // Pass only target width, height will be calculated
        configureCellWithAdjacentLabel(
          cellImage,
          cellLabel,
          imageFolder,
          imageData,
          FIRST_TABLE_IMAGE_WIDTH_POINTS,
          FIRST_TABLE_IMAGE_HEIGHT_POINTS
        );
      }
      table1.setBorderWidth(0);
      Logger.log('Finished first table.');
    }
  }

  // --- Subsequent Tables: 3 "visual" rows x 2 columns (Image above Label) ---
  while (imagesToProcess.length > 0) {
    Logger.log(
      `Creating subsequent table. Remaining images: ${imagesToProcess.length}.`
    );
    const tableCells = [
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
    ];
    const currentTable = body.insertTable(insertionIndex++, tableCells);

    const actualColWidth = TABLE_TOTAL_WIDTH_POINTS / 2;

    currentTable.setColumnWidth(0, actualColWidth);
    currentTable.setColumnWidth(1, actualColWidth);

    for (let r = 0; r < 3; r++) {
      const imageRowInTable = r * 2;
      const labelRowInTable = imageRowInTable + 1;
      for (let c = 0; c < 2; c++) {
        if (imagesToProcess.length === 0) break;
        const imageData = imagesToProcess.shift();
        const cellImage = currentTable.getCell(imageRowInTable, c);
        const cellLabel = currentTable.getCell(labelRowInTable, c);
        configureCellWithStackedImageAndLabel(
          cellImage,
          cellLabel,
          imageFolder,
          imageData,
          SUBSEQUENT_TABLE_IMAGE_WIDTH_POINTS,
          SUBSEQUENT_TABLE_IMAGE_HEIGHT_POINTS
        );
      }
      if (imagesToProcess.length === 0) break;
    }
    currentTable.setBorderWidth(0);
    Logger.log('Finished a subsequent table.');
  }

  const successMsg = 'Subject images have been inserted.';
  Logger.log(successMsg);
  if (ui) {
    ui.alert('Success', successMsg, ui.ButtonSet.OK);
  }

  return {
    success: true,
    message: successMsg,
    imagesInserted: imageManifest.length,
  };
}

/**
 * FIXED: Helper for first table: Image in cellImage, Label in adjacent cellLabel.
 * Image width is fixed, height adjusts to preserve aspect ratio.
 */
function configureCellWithAdjacentLabel(
  cellImage,
  cellLabel,
  imageFolder,
  imageData,
  targetWidth,
  targetHeight
) {
  try {
    // --- FIX: Set Cell Padding to Zero ---
    cellImage
      .setPaddingTop(0)
      .setPaddingBottom(0)
      .setPaddingLeft(0)
      .setPaddingRight(0);
    cellLabel
      .setPaddingTop(0)
      .setPaddingBottom(0)
      .setPaddingLeft(5)
      .setPaddingRight(0); // Add a little left padding to label

    // Clear cell and set basic properties
    cellImage
      .clear()
      .setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
    cellLabel
      .clear()
      .setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);

    const files = imageFolder.getFilesByName(imageData.image);
    if (files.hasNext()) {
      const file = files.next();
      const imageBlob = file.getBlob();

      const imgParagraph =
        cellImage.getChild(0).getType() === DocumentApp.ElementType.PARAGRAPH
          ? cellImage.getChild(0).asParagraph()
          : cellImage.insertParagraph(0, '');
      imgParagraph.clear();

      const insertedImage = imgParagraph.insertInlineImage(0, imageBlob);

      // --- FIX: Direct Sizing Logic ---
      const originalWidth = insertedImage.getWidth();
      const originalHeight = insertedImage.getHeight();
      const originalAspectRatio = originalHeight / originalWidth;

      insertedImage.setWidth(targetWidth);
      insertedImage.setHeight(targetHeight);

      // --- FIX: NO NEWLINE ---
      imgParagraph
        .setSpacingAfter(0)
        .setSpacingBefore(0)
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    } else {
      cellImage.insertParagraph(0, `Image not found: ${imageData.image}`);
    }

    // Configure Label Cell
    const labelParagraph =
      cellLabel.getChild(0).getType() === DocumentApp.ElementType.PARAGRAPH
        ? cellLabel.getChild(0).asParagraph()
        : cellLabel.insertParagraph(0, '');
    labelParagraph.clear();
    labelParagraph.appendText(imageData.label || '');
    labelParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
  } catch (e) {
    Logger.log(
      `Error in configureCellWithAdjacentLabel for ${imageData.image}: ${
        e.message
      }\nStack: ${e.stack || 'No stack'}`
    );
    cellImage.setText(`Error: ${imageData.image}`);
    cellLabel.setText('Error');
  }
}

/**
 * FIXED: Helper for subsequent tables: Image in cellImage, Label in cellLabel below it.
 * Image width is fixed, height adjusts to maintain aspect ratio.
 */
function configureCellWithStackedImageAndLabel(
  cellImage,
  cellLabel,
  imageFolder,
  imageData,
  targetWidth,
  targetHeight
) {
  try {
    // --- FIX: Set Cell Padding to Zero ---
    cellImage
      .setPaddingTop(0)
      .setPaddingBottom(0)
      .setPaddingLeft(0)
      .setPaddingRight(0);
    cellLabel
      .setPaddingTop(2)
      .setPaddingBottom(5)
      .setPaddingLeft(0)
      .setPaddingRight(0); // Give a little space between image and label

    // Clear cells and set basic properties
    cellImage
      .clear()
      .setVerticalAlignment(DocumentApp.VerticalAlignment.BOTTOM);
    cellLabel.clear().setVerticalAlignment(DocumentApp.VerticalAlignment.TOP);

    const files = imageFolder.getFilesByName(imageData.image);
    if (files.hasNext()) {
      const file = files.next();
      const imageBlob = file.getBlob();

      const imgParagraph =
        cellImage.getChild(0).getType() === DocumentApp.ElementType.PARAGRAPH
          ? cellImage.getChild(0).asParagraph()
          : cellImage.insertParagraph(0, '');
      imgParagraph.clear();

      const insertedImage = imgParagraph.insertInlineImage(0, imageBlob);

      // --- SIZING LOGIC ---
      const originalWidth = insertedImage.getWidth();
      const originalHeight = insertedImage.getHeight();
      const aspectRatio = originalHeight / originalWidth;

      insertedImage.setWidth(targetWidth);
      insertedImage.setHeight(targetHeight);

      // --- FIX: NO NEWLINE ---
      imgParagraph
        .setSpacingAfter(0)
        .setSpacingBefore(0)
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    } else {
      cellImage.insertParagraph(0, `Image not found: ${imageData.image}`);
    }

    // Configure Label Cell
    const labelParagraph =
      cellLabel.getChild(0).getType() === DocumentApp.ElementType.PARAGRAPH
        ? cellLabel.getChild(0).asParagraph()
        : cellLabel.insertParagraph(0, '');
    labelParagraph.clear();
    labelParagraph.appendText((imageData.label || '') + '\n');
    labelParagraph
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setSpacingAfter(0)
      .setSpacingBefore(0);
  } catch (e) {
    Logger.log(
      `Error in configureCellWithStackedImageAndLabel for ${imageData.image}: ${
        e.message
      }\nStack: ${e.stack || 'No stack'}`
    );
    cellImage.setText(`Error: ${imageData.image}`);
    cellLabel.setText('Error');
  }
}

/**
 * Webhook endpoint to insert subject images via HTTP POST request.
 * Expected JSON body:
 * {
 *   "documentId": "string (required)",
 *   "imageFolderId": "string (required)",
 *   "imageManifest": [{"image": "filename", "label": "label text"}, ...] (required)
 * }
 *
 * Returns JSON response with success status and message.
 */
function doPost(e) {
  return ApBot2.handleDocsWebhook(
    e,
    function (doc, requestData) {
      const imageFolderId = requestData.imageFolderId;
      const imageManifest = requestData.imageManifest;

      // Additional validation for imageManifest array
      if (!imageManifest || !Array.isArray(imageManifest)) {
        throw new Error('imageManifest is required and must be an array');
      }

      Logger.log(
        `Image insertion handler - Folder ID: ${imageFolderId}, Images: ${imageManifest.length}`
      );

      // Call the internal function (without UI)
      return insertSubjectImagesInternal(
        doc,
        imageFolderId,
        imageManifest,
        null
      );
    },
    {
      requiredFields: ['imageFolderId', 'imageManifest'],
      docIdField: 'documentId',
    }
  );
}

/**
 * GET endpoint for testing/webhook verification.
 * Returns a simple status message.
 */
function doGet(e) {
  return ApBot2.handleWebhookStatus(e, {
    requiredFields: ['documentId', 'imageFolderId', 'imageManifest'],
    endpointDescription:
      'Webhook endpoint is active. Use POST to insert images.',
  });
}

/**
 * Clears tables found immediately after the "SUBJECT PHOTOS" heading.
 */
function clearSubjectImageTables() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const ui = DocumentApp.getUi();
  const HEADING_TEXT = 'SUBJECT PHOTOS'; // Ensure this matches
  let headingElement = null;
  let searchResult = null;

  Logger.log('Searching for heading: ' + HEADING_TEXT);
  // --- REVERTED: Use the more robust while loop to find the heading ---
  let paragraph = body.findElement(
    DocumentApp.ElementType.PARAGRAPH,
    searchResult
  );
  while (paragraph) {
    const element = paragraph.getElement();
    if (
      element.asParagraph().getHeading() ===
      DocumentApp.ParagraphHeading.HEADING2
    ) {
      if (
        element.asText().getText().trim().toUpperCase() ===
        HEADING_TEXT.toUpperCase()
      ) {
        headingElement = element;
        Logger.log('Heading found.');
        break;
      }
    }
    searchResult = paragraph;
    paragraph = body.findElement(
      DocumentApp.ElementType.PARAGRAPH,
      searchResult
    );
  }

  if (!headingElement) {
    ui.alert(
      'Not Found',
      `Heading 2 with text "${HEADING_TEXT}" not found. No tables were removed.`,
      ui.ButtonSet.OK
    );
    return;
  }

  const tablesToRemove = [];
  let nextElement = headingElement.getNextSibling();

  Logger.log('Scanning for tables after the heading...');
  while (nextElement) {
    const elementType = nextElement.getType();
    if (elementType === DocumentApp.ElementType.TABLE) {
      tablesToRemove.push(nextElement.asTable());
      Logger.log('Found a table to remove.');
    } else if (
      elementType === DocumentApp.ElementType.PARAGRAPH &&
      nextElement.asParagraph().getText().trim() === ''
    ) {
      // It's an empty paragraph, might be spacing between tables, continue looking
    } else {
      Logger.log(
        'Found a non-table/non-empty-paragraph element. Stopping scan.'
      );
      break;
    }
    nextElement = nextElement.getNextSibling();
  }

  if (tablesToRemove.length === 0) {
    ui.alert(
      'No Tables Found',
      'No image tables found immediately after the heading to remove.',
      ui.ButtonSet.OK
    );
    return;
  }

  const response = ui.alert(
    'Confirm Deletion',
    `Found ${tablesToRemove.length} table(s) after the "${HEADING_TEXT}" heading. Are you sure you want to delete them?`,
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    let removedCount = 0;
    // Remove in reverse order to avoid issues with changing indices
    for (let i = tablesToRemove.length - 1; i >= 0; i--) {
      try {
        tablesToRemove[i].removeFromParent();
        removedCount++;
        Logger.log(`Removed table ${i + 1}.`);
      } catch (e) {
        Logger.log(`Error removing table ${i + 1}: ${e.message}`);
      }
    }
    ui.alert(
      'Tables Removed',
      `${removedCount} table(s) have been removed.`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert('Deletion Canceled', 'No tables were removed.', ui.ButtonSet.OK);
  }
}
