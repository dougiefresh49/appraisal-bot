document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  // Open extension settings when clicking the settings button
  document
    .getElementById('appraisal-bot-settings-btn')
    .addEventListener('click', () => {
      console.log('clicked');
      console.log(chrome.runtime.id);
      chrome.tabs.create({
        url: `chrome://extensions/?id=${chrome.runtime.id}`,
      });
    });
});
