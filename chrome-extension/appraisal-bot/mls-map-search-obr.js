// MLS Map Search - Zone overlay toggle for Navica MLS Google Maps (search page)
// Content script: Runs in "MAIN" world via manifest.json configuration
// Depends on: navica-map-tools.js (loaded first)

console.log('MLS Map Search: Loaded in Main World');

var mlsOverlay = null;
var targetMap = null;
var toggleState = null;

// ==========================================
// FIND MAP INSTANCE
// ==========================================

function getMlsMap() {
  // Try known globals for the search map page
  if (typeof map !== 'undefined') return map;
  if (window.map) return window.map;
  if (window.googleMap) return window.googleMap;

  // Fallback: extract from container
  return NavicaMapTools.findMapInContainer('mapDiv');
}

// ==========================================
// INIT OVERLAY AND BUTTON
// ==========================================

function initOverlayAndButton() {
  if (!document.getElementById('mapDiv')) return false;
  if (!NavicaMapTools.isGoogleMapsReady()) return false;

  targetMap = getMlsMap();
  if (!targetMap) return false;

  mlsOverlay = NavicaMapTools.createOverlay();
  createToggleButton();

  return true;
}

function createToggleButton() {
  var btnId = 'btnToggleMlsZone';
  if (document.getElementById(btnId)) return;

  var accentBar = document.querySelector('.accentBar');
  if (!accentBar) return;

  var rightSideGroup = accentBar.querySelector('.float-right');

  // Container
  var btnContainer = document.createElement('div');
  btnContainer.className = 'float-left';
  btnContainer.style.marginLeft = '10px';

  // Button
  var btn = document.createElement('a');
  btn.href = '#';
  btn.id = btnId;
  btn.className = 'btn-display btn-sm';
  NavicaMapTools.styleToggleButton(btn);
  toggleState = NavicaMapTools.createToggleHandler(btn, mlsOverlay, targetMap);

  btnContainer.appendChild(btn);

  if (rightSideGroup) {
    accentBar.insertBefore(btnContainer, rightSideGroup);
  } else {
    accentBar.appendChild(btnContainer);
  }

  console.log('✅ MLS Toggle Button Injected Successfully!');
}

// ==========================================
// START POLLING
// ==========================================

setTimeout(function () {
  console.log('MLS Map Search: Starting map detection...');

  NavicaMapTools.poll({
    initFn: initOverlayAndButton,
    maxAttempts: 100,
    interval: 200,
    label: 'MLS Map Search',
  });
}, 1500);
