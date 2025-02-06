chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const existingCookies = details.requestHeaders.find(
      (header) => header.name.toLowerCase() === 'cookie'
    );

    if (existingCookies) {
      if (!existingCookies.value.includes('disclaimerAccepted=true')) {
        existingCookies.value += '; disclaimerAccepted=true';
      }
    } else {
      details.requestHeaders.push({
        name: 'Cookie',
        value: 'disclaimerAccepted=true',
      });
    }

    return { requestHeaders: details.requestHeaders };
  },
  { urls: ['https://ectorcountytx-web.tylerhost.net/*'] },
  ['blocking', 'requestHeaders']
);
