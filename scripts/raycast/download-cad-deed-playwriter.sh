#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Download CAD + Deed (Playwriter)
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 📄
# @raycast.argument1 { "type": "text", "placeholder": "Subfolder: land | sales | rentals" }

# Documentation:
# @raycast.description Scans comps/<type> for folders with only an MLS PDF. Extracts Tax ID, opens the PDF in Chrome for reference, then uses Playwriter to automate CAD + deed download. Assumes Chrome + Playwriter extension are running.
# @raycast.packageName Appraisal Bot
# @raycast.needsConfirmation false
# @raycast.author dougiefresh49
# @raycast.authorURL https://github.com/dougiefresh49

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FLOW_JS="$REPO_ROOT/scripts/playwriter/ecad-deed-flow.js"

if [ ! -f "$FLOW_JS" ]; then
  echo "Missing: $FLOW_JS"
  exit 1
fi

PW_CMD=""
if command -v playwriter &>/dev/null; then
  PW_CMD="playwriter"
else
  echo "playwriter not found. Install: npm i -g playwriter"
  exit 1
fi

# ---------- resolve work_dir (same logic as organize-comps.sh) ----------

subfolder_arg="${1:-}"
subfolder_arg="${subfolder_arg//[[:space:]]/}"
valid_subfolders_re='^(land|sales|rentals)$'

if [[ ! "$subfolder_arg" =~ $valid_subfolders_re ]]; then
  echo "Argument must be one of: land, sales, rentals (got: ${1:-})"
  exit 1
fi

current_dir=$(osascript -e 'tell application "Finder" to get POSIX path of (target of front window as alias)' 2>/dev/null || true)

if [ -z "$current_dir" ]; then
  echo "No Finder window. Open the job folder or comps folder."
  exit 1
fi
current_dir="${current_dir%/}"

if [[ "$current_dir" == *"/comps"* ]]; then
  comps_root="${current_dir%%/comps*}/comps"
else
  comps_root="${current_dir}/comps"
fi

work_dir="${comps_root}/${subfolder_arg}"

if [ ! -d "$work_dir" ]; then
  echo "Not found: $work_dir"
  exit 1
fi

# ---------- collect staged comp folders ----------

skip_folders_re='^(_?data|_?unused)$'

staged=()
while IFS= read -r comp_dir; do
  [ -n "$comp_dir" ] || continue

  dir_base="$(basename "$comp_dir")"
  [[ ! "$dir_base" =~ $skip_folders_re ]] || continue

  nested="$(find "$comp_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')"
  [ "$nested" = "0" ] || continue

  files=()
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    files+=("$f")
  done < <(find "$comp_dir" -maxdepth 1 -type f ! -name '.DS_Store' 2>/dev/null | sort)

  [ "${#files[@]}" -eq 1 ] || continue

  base="$(basename "${files[0]}")"
  lower="$(echo "$base" | tr '[:upper:]' '[:lower:]')"
  [[ "$lower" == *" - mls.pdf" ]] || continue

  staged+=("${files[0]}")
done < <(find "$work_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)

if [ "${#staged[@]}" -eq 0 ]; then
  echo "No staged comp folders found in: $work_dir"
  echo "(Each folder must contain exactly one '… - mls.pdf' and nothing else.)"
  exit 0
fi

echo "Found ${#staged[@]} staged comp(s) in ${subfolder_arg}:"
for p in "${staged[@]}"; do echo "  $(basename "$(dirname "$p")")"; done
echo ""

# ---------- extract Tax IDs ----------

extract_ecad_tax_id() {
  strings "$1" 2>/dev/null | grep -oE '[0-9]{4,6}\.[0-9]{4,6}\.[0-9]{4,6}' | head -1
}

declare -a tax_ids=()
all_ok=true
for pdf in "${staged[@]}"; do
  tid=$(extract_ecad_tax_id "$pdf")
  if [ -z "$tid" ]; then
    echo "SKIP — could not extract Tax ID from: $(basename "$pdf")"
    all_ok=false
  else
    echo "  $(basename "$(dirname "$pdf")") → Tax ID: $tid"
  fi
  tax_ids+=("$tid")
done
echo ""

# ---------- Playwriter session ----------

echo "Starting Playwriter session…"
session_out=$($PW_CMD session new 2>&1)
SID=$(echo "$session_out" | grep -oE 'Session [0-9]+' | grep -oE '[0-9]+')
if [ -z "$SID" ]; then
  SID=$(echo "$session_out" | grep -oE '[0-9]+' | tail -1)
fi
if [ -z "$SID" ]; then
  echo "Could not create Playwriter session."
  echo "$session_out"
  exit 1
fi
echo "Session: $SID"
echo ""

# ---------- process each comp ----------

TMP_ROOT="/tmp/playwriter-cad-deed-$$"
mkdir -p "$TMP_ROOT"

processed=0
errors=0

for i in "${!staged[@]}"; do
  pdf="${staged[$i]}"
  tid="${tax_ids[$i]}"

  comp_dir="$(dirname "$pdf")"
  folder_name="$(basename "$comp_dir")"

  if [ -z "$tid" ]; then
    continue
  fi

  slug=$(echo "$folder_name" | sed 's/[^a-zA-Z0-9._-]/-/g; s/--*/-/g; s/^-//; s/-$//')
  tmp_out="$TMP_ROOT/$slug"
  mkdir -p "$tmp_out"

  file_url=$(python3 -c "import pathlib, sys; print(pathlib.Path(sys.stdin.read().strip()).resolve().as_uri())" <<< "$pdf")

  echo "▶ [$((i+1))/${#staged[@]}] $folder_name"
  echo "  Tax ID:  $tid"
  echo "  Temp:    $tmp_out"

  # Chrome blocks file:// navigation via CDP; open the PDF natively for visual reference
  echo "  Opening MLS PDF in Chrome…"
  open -a "Google Chrome" "$file_url"
  sleep 1

  tmp_js=$(mktemp "$TMP_ROOT/pw-XXXXXX.js")
  cat "$FLOW_JS" > "$tmp_js"
  cat >> "$tmp_js" <<JSEOF

state.page = state.page || context.pages().find(p => p.url() === "about:blank") || (await context.newPage());
await downloadCadAndDeed(state.page, {
  taxId: "${tid}",
  addressSlug: "${folder_name}",
  outputPath: "${tmp_out}",
});
JSEOF

  pw_out=$($PW_CMD -s "$SID" --timeout 180000 -e "$(cat "$tmp_js")" 2>&1) || true
  rm -f "$tmp_js"

  echo "$pw_out" | sed 's/^/  /'
  echo ""

  copied=0
  for f in "$tmp_out"/*.pdf; do
    [ -f "$f" ] || continue
    cp "$f" "$comp_dir/"
    echo "  → Copied $(basename "$f") to comp folder"
    copied=$((copied + 1))
  done

  if [ "$copied" -gt 0 ]; then
    processed=$((processed + 1))
  else
    echo "  ⚠ No PDFs produced for this comp."
    errors=$((errors + 1))
  fi
  echo ""
done

# ---------- cleanup ----------

rm -rf "$TMP_ROOT"

echo "Done: $processed comp(s) processed, $errors error(s)."
