// This function receives the file IDs and sends them to the n8n webhook
function sendFileIdsToN8n(fileIds) {
  const n8nWebhookUrl = 'PASTE_YOUR_N8N_WEBHOOK_URL_HERE'; // <-- IMPORTANT

  Logger.log('file ids to send: ' + JSON.stringify({ fileIds: fileIds }));

  if (!n8nWebhookUrl.startsWith('http')) {
    Logger.log('n8n Webhook URL is not set.');
    return 'Error: Webhook URL not configured.';
  }

  const payload = JSON.stringify({ fileIds: fileIds });

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true, // Prevents script from stopping on HTTP errors
  };

  try {
    const response = UrlFetchApp.fetch(n8nWebhookUrl, options);
    Logger.log('n8n Response: ' + response.getContentText());
    return 'Successfully sent ' + fileIds.length + ' file(s) for processing.';
  } catch (e) {
    Logger.log('Error sending to n8n: ' + e.toString());
    return 'Error: Could not trigger workflow.';
  }
}
