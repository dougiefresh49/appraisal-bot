/**
 * Adds a newline character after every comma that is NOT inside parentheses.
 * * Usage: =ADD_NEWLINE_OUTSIDE_PARENS(FILTER(...))
 *
 * @param {string|Array<string>} input The string or range of strings to process.
 * @return The text formatted with newlines.
 * @customfunction
 */
function ADD_NEWLINE_OUTSIDE_PARENS(input) {
  // Handle array inputs (e.g., if used on a range or FILTER result)
  if (Array.isArray(input)) {
    return input.map((row) => {
      // Handle 2D arrays (ranges) or 1D arrays
      if (Array.isArray(row)) {
        return row.map((cell) => processString_(cell));
      }
      return processString_(row);
    });
  }
  return processString_(input);
}

/**
 * Helper function to process a single string.
 */
function processString_(text) {
  if (typeof text !== 'string') return text;

  let result = '';
  let parenDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '(') {
      parenDepth++;
    } else if (char === ')') {
      parenDepth--;
    }

    if (parenDepth === 0) {
      // 1. Handle commas and colons (add newline after)
      if (char === ',' || char === ':') {
        result += char + '\n';

        // Optional: If the next character is a space, skipping it
        // often makes the list look cleaner.
        if (text[i + 1] === ' ') {
          i++; // Skip the next character (the space)
        }
        continue;
      }

      // 2. Handle bullet markers (⋅ or -)
      // Ensure there is a newline before bullet markers if they are part of a list.
      // For '-', we check if it's followed by a space to avoid splitting hyphens/ranges.
      if (char === '⋅' || (char === '-' && text[i + 1] === ' ')) {
        // If we're not at the very beginning and don't already have a newline
        if (result.length > 0 && !result.endsWith('\n')) {
          if (result.endsWith(' ')) {
            result = result.slice(0, -1) + '\n';
          } else {
            result += '\n';
          }
        }
        result += char;
        continue;
      }
    }

    result += char;
  }
  return result;
}
