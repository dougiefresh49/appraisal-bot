// Function to check if text matches Ector CAD format (xxxxx.xxxxx.xxxxx)
function isEctorCAD(text) {
  return /^\d{5}\.\d{5}\.\d{5}$/.test(text);
}

// Function to check if text matches Midland CAD format (R followed by 9 numbers)
function isMidlandCAD(text) {
  return /^R\d{9}$/.test(text);
}

// Upton County format checkers
function isUptonAPN(text) {
  return /^\d{4}$/.test(text);
}
function isUptonDeed(text) {
  return /^\d{6}$/.test(text);
}

// Ward County format checker (assume 6 digits for APN)
function isWardAPN(text) {
  return /^\d{4,6}$/.test(text);
}

// Andrews County format checker (4-6 digit all-digit property IDs)
function isAndrewsAPN(text) {
  return /^\d{4,6}$/.test(text);
}

// Function to create context menu items
function createContextMenuItems() {
  // Remove existing menu items
  chrome.contextMenus.removeAll();

  // Create parent menu
  chrome.contextMenus.create({
    id: 'appraisal-bot-menu',
    title: 'Appraisal Bot',
    contexts: ['all'],
  });

  // Create Ector County submenu
  chrome.contextMenus.create({
    id: 'ector-county',
    parentId: 'appraisal-bot-menu',
    title: 'ECTOR COUNTY',
    contexts: ['all'],
  });

  // Create Ector County items
  chrome.contextMenus.create({
    id: 'ector-cad',
    parentId: 'ector-county',
    title: 'CAD',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'ector-gis',
    parentId: 'ector-county',
    title: 'GIS',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'ector-deeds',
    parentId: 'ector-county',
    title: 'Deeds',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'ector-zoning',
    parentId: 'ector-county',
    title: 'Zoning',
    contexts: ['all'],
  });

  // Create Midland County submenu
  chrome.contextMenus.create({
    id: 'midland-county',
    parentId: 'appraisal-bot-menu',
    title: 'MIDLAND COUNTY',
    contexts: ['all'],
  });

  // Create Midland County items
  chrome.contextMenus.create({
    id: 'midland-cad',
    parentId: 'midland-county',
    title: 'CAD',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'midland-gis',
    parentId: 'midland-county',
    title: 'GIS',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'midland-deeds',
    parentId: 'midland-county',
    title: 'Deeds',
    contexts: ['all'],
  });

  // Create Upton County submenu
  chrome.contextMenus.create({
    id: 'upton-county',
    parentId: 'appraisal-bot-menu',
    title: 'UPTON COUNTY',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'upton-cad',
    parentId: 'upton-county',
    title: 'CAD',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'upton-gis',
    parentId: 'upton-county',
    title: 'GIS',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'upton-deeds',
    parentId: 'upton-county',
    title: 'Deeds',
    contexts: ['all'],
  });

  // Create Ward County submenu
  chrome.contextMenus.create({
    id: 'ward-county',
    parentId: 'appraisal-bot-menu',
    title: 'WARD COUNTY',
    contexts: ['all'],
  });
  chrome.contextMenus.create({
    id: 'ward-cad',
    parentId: 'ward-county',
    title: 'CAD',
    contexts: ['all'],
  });
  chrome.contextMenus.create({
    id: 'ward-gis',
    parentId: 'ward-county',
    title: 'GIS',
    contexts: ['all'],
  });

  // Create Andrews County submenu
  chrome.contextMenus.create({
    id: 'andrews-county',
    parentId: 'appraisal-bot-menu',
    title: 'ANDREWS COUNTY',
    contexts: ['all'],
  });
  chrome.contextMenus.create({
    id: 'andrews-cad',
    parentId: 'andrews-county',
    title: 'CAD',
    contexts: ['all'],
  });
  chrome.contextMenus.create({
    id: 'andrews-deeds',
    parentId: 'andrews-county',
    title: 'Deeds',
    contexts: ['all'],
  });
  chrome.contextMenus.create({
    id: 'andrews-gis',
    parentId: 'andrews-county',
    title: 'GIS',
    contexts: ['all'],
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText ? info.selectionText.trim() : '';
  let url;

  switch (info.menuItemId) {
    case 'ector-cad':
      if (selectedText && isEctorCAD(selectedText)) {
        url = `https://search.ectorcad.org/parcel/${selectedText}`;
      } else {
        url = 'https://search.ectorcad.org/';
      }
      break;

    case 'midland-cad':
      if (selectedText && isMidlandCAD(selectedText)) {
        url = `https://www.southwestdatasolution.com/webProperty.aspx?dbkey=MIDLANDCAD&id=${selectedText}`;
      } else {
        url =
          'https://www.southwestdatasolution.com/webSearchAddress.aspx?dbkey=MIDLANDCAD';
      }
      break;

    case 'ector-gis':
      if (selectedText && isEctorCAD(selectedText)) {
        url = `https://search.ectorcad.org/map/#${selectedText}`;
      } else {
        url = 'https://search.ectorcad.org/map/';
      }
      break;

    case 'midland-gis':
      if (selectedText && isMidlandCAD(selectedText)) {
        url = `https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47&apn=${selectedText}`;
      } else {
        url =
          'https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47';
      }
      break;

    case 'ector-zoning':
      url =
        'https://experience.arcgis.com/experience/7889746e0f64472994a7554eb9771f57';
      break;

    case 'ector-deeds':
      url = 'https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1';
      break;

    case 'midland-deeds':
      url = 'https://midland.tx.publicsearch.us/';
      break;

    case 'upton-cad':
      if (selectedText && isUptonAPN(selectedText)) {
        url = `https://uptoncad.org/Home/Details?parcelId=${selectedText}`;
      } else {
        url = 'https://uptoncad.org/home';
      }
      break;

    case 'upton-gis':
      if (selectedText && isUptonAPN(selectedText)) {
        url = `https://maps.pandai.com/UptonCAD/?find=${selectedText}`;
      } else {
        url = 'https://maps.pandai.com/UptonCAD/';
      }
      break;

    case 'upton-deeds':
      if (selectedText && isUptonDeed(selectedText)) {
        url = `https://i2j.uslandrecords.com/TX/Upton/D/default.aspx?doc=${selectedText}`;
      } else {
        url = 'https://i2j.uslandrecords.com/TX/Upton/D/default.aspx';
      }
      break;

    case 'ward-cad':
      if (selectedText && isWardAPN(selectedText)) {
        url = `https://www.wardcad.org/Home/Details?parcelId=${selectedText}`;
      } else {
        url = 'https://www.wardcad.org/home';
      }
      break;

    case 'ward-gis':
      if (selectedText && isWardAPN(selectedText)) {
        url = `https://maps.pandai.com/WardCAD/?find=${selectedText}`;
      } else {
        url = 'https://maps.pandai.com/WardCAD/';
      }
      break;

    case 'andrews-cad':
      if (selectedText && isAndrewsAPN(selectedText)) {
        url = `https://esearch.andrewscad.org/Property/View/${selectedText}`;
      } else {
        url = 'https://esearch.andrewscad.org/';
      }
      break;

    case 'andrews-deeds':
      url =
        'https://andrewscountytx-web.tylerhost.net/web/search/DOCSEARCH642S1';
      break;

    case 'andrews-gis':
      if (selectedText && isAndrewsAPN(selectedText)) {
        url = `https://gis.bisclient.com/andrewscad/index.html?find=${selectedText}`;
      } else {
        url = 'https://gis.bisclient.com/andrewscad/index.html';
      }
      break;
  }

  if (url) {
    chrome.tabs.create({ url });
  }
});

// Initialize context menu when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  createContextMenuItems();
});
