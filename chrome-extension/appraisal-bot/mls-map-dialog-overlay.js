// MLS Map Dialog Overlay - Zone overlay toggle for map dialog on results pages
// Content script: Runs in "MAIN" world to access Google Maps instances directly
// Depends on: navica-map-tools.js (loaded first)

console.log('MLS Map Dialog Overlay: Loaded in Main World');

var dialogOverlayState = {
  overlay: null,
  targetMap: null,
  toggleState: null,
  initialized: false,
};

// ==========================================
// FIND THE DIALOG MAP INSTANCE
// ==========================================

function findDialogMap() {
  // The Navica site stores the map under the bare global `map`
  if (typeof map !== 'undefined' && map) return map;

  // Fallback: extract from the map container via __gm internal property
  return NavicaMapTools.findMapInContainer('mapDivDia');
}

// ==========================================
// INIT OVERLAY AND BUTTON
// ==========================================

function initDialogOverlay() {
  if (!NavicaMapTools.isGoogleMapsReady()) return false;

  var dialogMap = findDialogMap();
  if (!dialogMap) return false;

  dialogOverlayState.targetMap = dialogMap;
  dialogOverlayState.overlay = NavicaMapTools.createOverlay();
  createDialogToggleButton();
  dialogOverlayState.initialized = true;

  return true;
}

function createDialogToggleButton() {
  var btnId = 'btnToggleMlsZoneDialog';
  if (document.getElementById(btnId)) return;

  var dialog = document.querySelector('[aria-describedby="dialog-mapDiv"]');
  if (!dialog) return;

  var buttonPane = dialog.querySelector('.ui-dialog-buttonpane');
  if (!buttonPane) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = btnId;
  btn.className = 'float-left';
  NavicaMapTools.styleToggleButton(btn);
  btn.style.border = '1px solid #ccc';
  btn.style.borderRadius = '4px';
  btn.style.padding = '4px 12px';

  dialogOverlayState.toggleState = NavicaMapTools.createToggleHandler(
    btn,
    dialogOverlayState.overlay,
    dialogOverlayState.targetMap,
  );

  buttonPane.insertBefore(btn, buttonPane.firstChild);
  console.log('✅ MLS Zone toggle button added to map dialog');
}

// ==========================================
// WATCH FOR MAP DIALOG TO OPEN
// ==========================================

var dialogPollingActive = false;

function resetDialogOverlayState() {
  dialogOverlayState.overlay = null;
  dialogOverlayState.targetMap = null;
  dialogOverlayState.toggleState = null;
  dialogOverlayState.initialized = false;
  dialogPollingActive = false;
}

// Use MutationObserver to detect when the map dialog becomes visible
var dialogObserver = new MutationObserver(function () {
  var dialogMapDiv = document.getElementById('dialog-mapDiv');
  if (!dialogMapDiv) return;

  var isVisible =
    dialogMapDiv.style.display !== 'none' && dialogMapDiv.offsetHeight > 0;

  if (isVisible && !dialogOverlayState.initialized && !dialogPollingActive) {
    dialogPollingActive = true;
    console.log('MLS Map Dialog Overlay: Dialog detected, starting map poll');

    NavicaMapTools.poll({
      initFn: initDialogOverlay,
      maxAttempts: 40,
      interval: 200,
      label: 'MLS Map Dialog Overlay',
      onTimeout: function () {
        dialogPollingActive = false;
      },
    });
  } else if (!isVisible && (dialogOverlayState.initialized || dialogPollingActive)) {
    var existingBtn = document.getElementById('btnToggleMlsZoneDialog');
    if (existingBtn) existingBtn.remove();
    resetDialogOverlayState();
  }
});

// Start observing once the page is ready
setTimeout(function () {
  console.log('MLS Map Dialog Overlay: Starting observer...');
  dialogObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });
}, 1500);
