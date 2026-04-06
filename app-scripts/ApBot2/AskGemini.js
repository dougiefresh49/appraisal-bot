/**
 * Calls the Gemini API (Generative Language API) using an API Key
 * with a given prompt and input.
 * Appends instructions to the prompt for a concise answer.
 *
 * IMPORTANT: Requires an API Key stored in Script Properties.
 * See comments below on how to set it up.
 *
 * @param {string} prompt The main instruction or question for the model.
 * @param {string} input The specific data or context for the prompt.
 * @return The text response from the Gemini API.
 * @customfunction
 */
function askGemini(prompt, input) {
  // --- Configuration ---
  // See available models: https://ai.google.dev/models/gemini
  const MODEL_ID = 'gemini-3-flash-preview'; // Or "gemini-pro"
  const CACHE_EXPIRATION_SECONDS = 1 * 60 * 60; // 1 hour
  // const CACHE_EXPIRATION_SECONDS = 30; // 30 seconds

  // --- Cache Check ---
  // Use hashing for the cache key to prevent "Argument too large" errors
  const cacheKey = _getGeminiCacheKey(MODEL_ID, prompt, input);
  const cachedResult = _getGeminiFromCache(cacheKey); // Renamed function for clarity

  if (cachedResult !== null) {
    Logger.log(`Cache hit for key: ${cacheKey}`);
    Logger.log(`cached result: ${cachedResult}`);
    return cachedResult; // Return the cached result
  }

  Logger.log(`Cache miss for key: ${cacheKey}. Calling API.`);
  Logger.log(`using gemini model: ${MODEL_ID}`);
  // --- API Call ---
  let resultText = null;
  try {
    // --- API Key Retrieval ---
    const apiKey =
      PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      return 'ERROR: API Key not found in Script Properties.';
    }

    // Construct the full prompt
    const fullPrompt = `${prompt}\n\nInput: ${input}\n\nInstructions: Provide only the direct answer to the request, without any introductory phrases, explanations, or conversational filler.`;

    // API Endpoint
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

    // Payload
    const payload = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        thinkingConfig: {
          thinkingLevel: 'low',
        },
      },
    };

    // Options
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    // Make the API call
    // Logger.log(`Fetching response for prompt hash: ${cacheKey}`); // Log hash instead of full prompt
    const response = UrlFetchApp.fetch(apiEndpoint, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    // Check for API errors
    if (responseCode !== 200) {
      Logger.log(`API Error - Code: ${responseCode}, Body: ${responseBody}`);
      return `ERROR: API call failed with code ${responseCode}. Check Logs.`;
    }

    // Parse response
    const jsonResponse = JSON.parse(responseBody);

    // Extract text
    if (
      jsonResponse.candidates &&
      jsonResponse.candidates.length > 0 &&
      jsonResponse.candidates[0].content &&
      jsonResponse.candidates[0].content.parts &&
      jsonResponse.candidates[0].content.parts.length > 0 &&
      jsonResponse.candidates[0].content.parts[0].text
    ) {
      resultText = jsonResponse.candidates[0].content.parts[0].text.trim();
    } else if (jsonResponse.error) {
      Logger.log(`API Error Response: ${JSON.stringify(jsonResponse.error)}`);
      return `ERROR: API returned an error: ${
        jsonResponse.error.message || JSON.stringify(jsonResponse.error)
      }`;
    } else {
      Logger.log(`Unexpected API response structure: ${responseBody}`);
      return 'ERROR: Could not parse the expected text from API response.';
    }
  } catch (error) {
    Logger.log(`Script Error calling Gemini API: ${error}`);
    return `ERROR: ${error.message}`;
  }

  // --- Caching ---
  if (resultText !== null && !resultText.startsWith('ERROR:')) {
    _putGeminiInCache(cacheKey, resultText, CACHE_EXPIRATION_SECONDS); // Renamed function
  }

  return resultText;
}

// --- Caching Helper Functions ---

/**
 * Generates a unique, fixed-length cache key for Gemini requests using SHA-256 hashing.
 * This prevents errors caused by keys exceeding the 250-character limit.
 *
 * @param {string} modelId The model ID being used.
 * @param {string} prompt The user's prompt.
 * @param {string} input The user's input.
 * @return {string} The generated hashed cache key.
 * @private
 */
function _getGeminiCacheKey(modelId, prompt, input) {
  const keyDataString = JSON.stringify({
    prompt: prompt,
    input: input,
  });

  // Compute SHA-256 hash
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    keyDataString,
    Utilities.Charset.UTF_8,
  );

  // Convert byte array to hex string
  let signature = '';
  for (let i = 0; i < digest.length; i++) {
    let byte = digest[i];
    if (byte < 0) {
      byte += 256;
    }
    let hex = byte.toString(16);
    // Ensure 2 digits for each byte.
    if (hex.length === 1) {
      hex = '0' + hex;
    }
    signature += hex;
  }

  // Include model ID in the key prefix
  // Prefix + SHA256 Hex (64 chars) is well within the 250 char limit.
  return `gemini_${modelId}_${signature}`;
}

/**
 * Retrieves a value from the script cache.
 *
 * @param {string} key The cache key to retrieve.
 * @return {string|null} The cached value, or null if not found/expired.
 * @private
 */
function _getGeminiFromCache(key) {
  // Renamed from _getGeminiCache for clarity
  try {
    const cache = CacheService.getScriptCache();
    return cache.get(key);
  } catch (e) {
    // Catch potential errors during cache access (though less likely with fixed-length keys)
    Logger.log(`Error retrieving from cache for key ${key}: ${e}`);
    return null;
  }
}

/**
 * Puts a value into the script cache with specified expiration.
 *
 * @param {string} key The cache key to store the value under.
 * @param {string} value The value to store.
 * @param {number} expirationInSeconds The cache duration in seconds.
 * @private
 */
function _putGeminiInCache(key, value, expirationInSeconds) {
  // Renamed from _addGeminiCache
  try {
    const cache = CacheService.getScriptCache();
    Logger.log(
      `Caching result for key: ${key} for ${expirationInSeconds} seconds.`,
    );
    cache.put(key, value, expirationInSeconds);
  } catch (e) {
    // Catch potential errors during cache storage (e.g., value too large > 100KB)
    Logger.log(
      `Error putting value into cache for key ${key}: ${e}. Value length: ${
        value ? value.length : 'null'
      }`,
    );
    // Decide if you want to propagate the error or just log it.
    // For now, just logging, the function will still return the resultText.
  }
}

// --- Utility Functions ---

/**
 * Helper function to clear the Gemini cache manually if needed.
 * Note: This is a basic example and might clear other cache entries if not used carefully.
 */
function clearGeminiCache() {
  const cache = CacheService.getScriptCache();
  Logger.log(
    'Manual cache clearing requires specific key knowledge or waiting for expiration. This function is a placeholder.',
  );
  // To implement fully, you'd need to track keys or use cache.removeAll() if appropriate.
}

/*
// --- Setup Function (Run Once) ---
function storeApiKey() {
  // !!! REPLACE "YOUR_API_KEY" WITH YOUR ACTUAL KEY BEFORE RUNNING !!!
  // PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', 'YOUR_API_KEY');
  // Logger.log("API Key stored in Script Properties.");
  // !!! DELETE OR COMMENT OUT YOUR KEY AFTER RUNNING !!!
}
*/
