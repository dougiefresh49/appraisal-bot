/**
 * Calls the Gemini API (via Vertex AI) with a given prompt and input.
 * Appends instructions to the prompt for a concise answer.
 *
 * @param {string} prompt The main instruction or question for the model.
 * @param {string} input The specific data or context for the prompt.
 * @return The text response from the Gemini API.
 * @customfunction
 */
function askGemini_vertexAI(prompt, input) {
  // --- Configuration ---
  // !!! REPLACE WITH YOUR GOOGLE CLOUD PROJECT ID !!!
  const PROJECT_ID = "appraisalbot-455622";
  // !!! REPLACE WITH YOUR PROJECT'S REGION (e.g., "us-central1") !!!
  const LOCATION_ID = "us-central1";
  // You can change the model if needed, e.g., "gemini-1.5-flash-001"
  const MODEL_ID = "gemini-2.5-flash-preview-04-17";
  // --- End Configuration ---

  // Check if required configuration is set
//   if (PROJECT_ID === "YOUR_GCP_PROJECT_ID" || !PROJECT_ID) {
//     return "ERROR: Please set your Google Cloud Project ID in the script.";
//   }

  // Construct the full prompt with the conciseness instruction
  const fullPrompt = `${prompt}\n\nInput: ${input}\n\nInstructions: Provide only the direct answer to the request, without any introductory phrases, explanations, or conversational filler.`;

  // Vertex AI API Endpoint
  const apiEndpoint = `https://${LOCATION_ID}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:generateContent`;

  // Request Payload for the Gemini API
  const payload = {
    contents: [{
      role: "user",
      parts: [{
        text: fullPrompt
      }]
    }],
    // Optional: Add safety settings and generation config if needed
    // safetySettings: [ ... ],
    // generationConfig: { ... }
  };

  // Request Options for UrlFetchApp
  const options = {
    method: "POST",
    contentType: "application/json",
    // Use the script user's OAuth token for authentication
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // Prevent script failure on API errors, handle manually
  };

  try {
    // Make the API call
    const response = UrlFetchApp.fetch(apiEndpoint, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    // Check for errors
    if (responseCode !== 200) {
      return `ERROR: API call failed with code ${responseCode}. Response: ${responseBody}`;
    }

    // Parse the JSON response
    const jsonResponse = JSON.parse(responseBody);

    // Extract the generated text content
    // Check for potential errors or different response structures
    if (jsonResponse.candidates && jsonResponse.candidates.length > 0 &&
        jsonResponse.candidates[0].content && jsonResponse.candidates[0].content.parts &&
        jsonResponse.candidates[0].content.parts.length > 0 && jsonResponse.candidates[0].content.parts[0].text) {

      return jsonResponse.candidates[0].content.parts[0].text.trim();
    } else if (jsonResponse.error) {
        // Handle explicit errors returned by the API
        return `ERROR: API returned an error: ${JSON.stringify(jsonResponse.error)}`;
    }
     else {
      // Handle cases where the expected text is missing
      console.error("Unexpected API response structure:", responseBody);
      return "ERROR: Could not parse the expected text from the API response.";
    }

  } catch (error) {
    // Catch errors during the fetch operation itself
    Logger.log(`Error calling Gemini API: ${error}`);
    return `ERROR: ${error.message}`;
  }
}
