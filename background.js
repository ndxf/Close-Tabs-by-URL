// Function to extract the root domain from a URL
function extractDomain(url) {
  let hostname = new URL(url).hostname;
  let parts = hostname.split('.');
  if (parts.length > 2) {
    return parts.slice(parts.length - 2).join('.');
  }
  return hostname;
}

// Close the selected tabs
function closeSelectedTabs(tabIds) {
  tabIds.forEach(tabId => {
    chrome.tabs.remove(tabId);
  });
}

// Get tabs from the same domain
async function getTabsFromSameDomain(currentTab) {
  let domain = extractDomain(currentTab.url);
  return new Promise((resolve) => {
    chrome.tabs.query({}, function (tabs) {
      let tabsToClose = tabs.filter(tab => extractDomain(tab.url) === domain);
      resolve(tabsToClose);
    });
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTabsToClose") {
    getCurrentTab().then(currentTab => {
      getTabsFromSameDomain(currentTab).then(tabs => {
        sendResponse({ tabs });
      });
    });
    return true; // To allow async sendResponse
  } else if (message.action === "closeSelectedTabs") {
    closeSelectedTabs(message.tabIds);
  }
});

// Get the currently active tab
function getCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        resolve(tabs[0]);
      } else {
        reject("No active tab found.");
      }
    });
  });
}
