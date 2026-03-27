/**
 * Generic webhook handler for Google Apps Script web apps.
 * Provides request parsing, validation, and response formatting.
 */

/**
 * Handles a POST request for a Google Docs webhook.
 * Parses the request, validates required fields, opens the document, and calls the handler function.
 *
 * @param {Object} e The event parameter from doPost
 * @param {Function} handlerFunction Function to call with (doc, requestData). Should return {success: boolean, message?: string, ...}
 * @param {Object} options Configuration options
 * @param {string} options.docIdField Field name in requestData that contains the document ID (default: 'documentId')
 * @param {Array<string>} options.requiredFields Array of required field names (excluding docIdField which is always required)
 * @return {TextOutput} JSON response
 */
function handleDocsWebhook(e, handlerFunction, options = {}) {
  try {
    const docIdField = options.docIdField || 'documentId';
    const requiredFields = options.requiredFields || [];

    Logger.log(
      'Webhook called. Content type: ' + (e.postData ? e.postData.type : 'N/A')
    );

    // Parse the request body
    let requestData;
    try {
      if (e.postData && e.postData.contents) {
        requestData = JSON.parse(e.postData.contents);
      } else if (e.parameter) {
        // Fallback: try to get from parameters if JSON parsing fails
        requestData = e.parameter;
      } else {
        throw new Error('No request data found in POST body');
      }
    } catch (parseError) {
      Logger.log('Error parsing request data: ' + parseError.message);
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body: ' + parseError.message,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Validate required fields
    const documentId = requestData[docIdField];
    if (!documentId) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: `${docIdField} is required`,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Validate other required fields
    for (const field of requiredFields) {
      if (requestData[field] === undefined || requestData[field] === null) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error: `${field} is required`,
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    Logger.log(`Webhook request - Document ID: ${documentId}`);

    // Open the document by ID
    let doc;
    try {
      doc = DocumentApp.openById(documentId);
    } catch (docError) {
      Logger.log('Error opening document: ' + docError.message);
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error:
            'Cannot access document with ID: ' +
            documentId +
            '. Error: ' +
            docError.message,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Call the handler function
    try {
      const result = handlerFunction(doc, requestData);
      Logger.log(
        'Webhook completed successfully: ' + (result.message || 'OK')
      );
      return ContentService.createTextOutput(
        JSON.stringify(result)
      ).setMimeType(ContentService.MimeType.JSON);
    } catch (handlerError) {
      Logger.log('Error in handler function: ' + handlerError.message);
      Logger.log('Stack trace: ' + (handlerError.stack || 'No stack trace'));
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error:
            handlerError.message ||
            'Unknown error occurred in handler function',
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Unexpected error in handleDocsWebhook: ' + error.message);
    Logger.log('Stack trace: ' + (error.stack || 'No stack trace'));
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: 'Unexpected error: ' + error.message,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Generic GET endpoint for webhook verification/status.
 * Returns a simple status message with endpoint information.
 *
 * @param {Object} e The event parameter from doGet (optional)
 * @param {Object} options Configuration options
 * @param {Array<string>} options.requiredFields Array of required field names for POST requests
 * @param {string} options.endpointDescription Description of what the endpoint does
 * @return {TextOutput} JSON response
 */
function handleWebhookStatus(e, options = {}) {
  const requiredFields = options.requiredFields || [];
  const description =
    options.endpointDescription ||
    'Webhook endpoint is active. Use POST to process requests.';

  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'OK',
      message: description,
      endpoint: 'POST /',
      requiredFields: requiredFields,
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

