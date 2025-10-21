chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_POPUP') {
    chrome.action.openPopup();
  }
});
