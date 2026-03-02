console.log('[AppraisalBot] Andrews GIS Injector loaded');

(function () {
  function dismissSplash() {
    const okButton = document.querySelector(
      '.jimu-widget-splash .footer .jimu-btn'
    );
    if (okButton) {
      okButton.click();
      console.log('[AppraisalBot] Auto-dismissed GIS splash popup');
      return true;
    }

    const splashWidget = document.querySelector('.jimu-widget-splash');
    if (splashWidget && splashWidget.style.display !== 'none') {
      splashWidget.style.display = 'none';
      const overlay = splashWidget.querySelector('.overlay');
      if (overlay) overlay.style.display = 'none';
      console.log('[AppraisalBot] Hid GIS splash popup via display:none');
      return true;
    }

    return false;
  }

  if (dismissSplash()) return;

  const observer = new MutationObserver((_, obs) => {
    if (dismissSplash()) {
      obs.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => observer.disconnect(), 15000);
})();
