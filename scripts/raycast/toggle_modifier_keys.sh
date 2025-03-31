#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Toggle Keyboard Shortcuts (Mac/Windows)
# @raycast.mode silent

# Optional parameters:
# @raycast.icon ⌨️

# Documentation:
# @raycast.description Toggles only the keyboard shortcuts for Option (⌥) and Command (⌘), keeping other settings untouched.
# @raycast.packageName Appraisal Bot
# @raycast.needsConfirmation false
# @raycast.author dougiefresh49
# @raycast.authorURL https://github.com/dougiefresh49

# Temporary file to track the current keyboard layout
STATE_FILE="/tmp/keyboard_shortcuts_state"

# "Mac" layout = no remapping for Option/Command
MAC_LAYOUT='{
  "UserKeyMapping": []
}'

# "Windows" layout = swap ⌘ and ⌥ (left side)
WINDOWS_LAYOUT='{
  "UserKeyMapping": [
    {
      "HIDKeyboardModifierMappingSrc": 0x7000000E2,
      "HIDKeyboardModifierMappingDst": 0x7000000E3
    },
    {
      "HIDKeyboardModifierMappingSrc": 0x7000000E3,
      "HIDKeyboardModifierMappingDst": 0x7000000E2
    }
  ]
}'

# Function to apply a given JSON mapping with hidutil
apply_mapping() {
  local layout_json="$1"
  /usr/bin/hidutil property --set "$layout_json"
}

# Read the current layout from our file (if any)
if [ -f "$STATE_FILE" ]; then
  CURRENT_LAYOUT=$(cat "$STATE_FILE")
else
  # Default to Mac layout if we have no state
  CURRENT_LAYOUT="mac"
fi

# We can also read the actual system setting to see if the swap is present
# but for simplicity, we trust our STATE_FILE to track toggles.

if [ "$CURRENT_LAYOUT" = "mac" ]; then
  echo "Switching to Windows-style swap (⌘ ↔ ⌥)..."
  apply_mapping "$WINDOWS_LAYOUT"
  echo "windows" > "$STATE_FILE"
  echo "Keyboard shortcuts toggled to Windows layout successfully."
else
  echo "Switching to Mac default (no swap)..."
  apply_mapping "$MAC_LAYOUT"
  echo "mac" > "$STATE_FILE"
  echo "Keyboard shortcuts toggled to Mac layout successfully."
fi

