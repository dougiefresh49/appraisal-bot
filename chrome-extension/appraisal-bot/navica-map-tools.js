// Navica Map Tools - Shared config and utilities for MLS zone overlays
// Loaded in "MAIN" world before mls-map-search-obr.js and mls-map-dialog-overlay.js

var NavicaMapTools = {
  // ==========================================
  // CONFIGURATION - update overlay image/bounds here once
  // ==========================================
  imageUrl: 'https://i.imgur.com/WofoDas.png',
  imageBounds: {
    north: 32.001826,
    south: 31.75376,
    east: -102.22262,
    west: -102.579481,
  },

  // ==========================================
  // OVERLAY CREATION
  // ==========================================
  createOverlay: function () {
    return new google.maps.GroundOverlay(
      this.imageUrl,
      this.imageBounds,
      { opacity: 0.5, clickable: false },
    );
  },

  // ==========================================
  // CHECK IF GOOGLE MAPS API IS READY
  // ==========================================
  isGoogleMapsReady: function () {
    return typeof google !== 'undefined' && google.maps;
  },

  // ==========================================
  // TOGGLE BUTTON HELPER
  // ==========================================
  // Creates the click handler for a zone toggle button.
  // Returns { btn, state } where state.isVisible tracks toggle state.
  createToggleHandler: function (btn, overlay, targetMap) {
    var state = { isVisible: false };

    btn.onclick = function (e) {
      if (e) e.preventDefault();
      state.isVisible = !state.isVisible;

      if (state.isVisible) {
        overlay.setMap(targetMap);
        btn.innerText = 'Hide MLS Zones';
        btn.style.opacity = '1';
      } else {
        overlay.setMap(null);
        btn.innerText = 'Show MLS Zones';
        btn.style.opacity = '0.7';
      }
    };

    return state;
  },

  // ==========================================
  // STYLE A TOGGLE BUTTON (shared yellow style)
  // ==========================================
  styleToggleButton: function (btn) {
    btn.innerText = 'Show MLS Zones';
    btn.style.backgroundColor = '#ffeb3b';
    btn.style.color = '#333';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
  },

  // ==========================================
  // FIND MAP INSTANCE FROM A CONTAINER ELEMENT
  // ==========================================
  // Searches for a Google Maps instance within a container div
  // by inspecting internal __gm properties.
  findMapInContainer: function (containerId) {
    var container = document.getElementById(containerId);
    if (!container) return null;

    // Check child divs for Google Maps internal __gm property
    var children = container.querySelectorAll('div');
    for (var i = 0; i < children.length; i++) {
      if (children[i].__gm && children[i].__gm.map) {
        return children[i].__gm.map;
      }
    }

    // Fallback: look for .gm-style parent elements
    var gmStyleDivs = container.querySelectorAll('.gm-style');
    for (var j = 0; j < gmStyleDivs.length; j++) {
      var parent = gmStyleDivs[j].parentElement;
      if (parent && parent.__gm && parent.__gm.map) {
        return parent.__gm.map;
      }
    }

    return null;
  },

  // ==========================================
  // POLLING HELPER
  // ==========================================
  // Polls initFn until it returns true or maxAttempts is reached.
  // Calls onSuccess or onTimeout accordingly.
  poll: function (options) {
    var initFn = options.initFn;
    var maxAttempts = options.maxAttempts || 50;
    var interval = options.interval || 200;
    var onSuccess = options.onSuccess || function () {};
    var onTimeout = options.onTimeout || function () {};
    var label = options.label || 'NavicaMapTools';

    var attempts = 0;
    var timer = setInterval(function () {
      if (initFn()) {
        clearInterval(timer);
        console.log(label + ': Initialization complete');
        onSuccess();
      } else if (++attempts >= maxAttempts) {
        clearInterval(timer);
        console.warn(label + ': Timed out after ' + attempts + ' attempts');
        onTimeout();
      }
    }, interval);

    return timer;
  },
};

console.log('Navica Map Tools: Shared utilities loaded');
