let featureEnabled = false;

console.log("⚡ Background worker loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_FEATURE") {
    featureEnabled = message.enable;

    chrome.storage.local.set({ featureEnabled });

    // Broadcast to all tabs safely
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_FEATURE", enable: featureEnabled }, (resp) => {
          if (chrome.runtime.lastError) return; // ignore tabs without content script
          console.log("✅ Tab notified:", tab.id, resp);
        });
      });
    });

    sendResponse({ status: "ok", enable: featureEnabled });
  } 
  else if (message.type === "GET_FEATURE_STATE") {
    sendResponse({ enable: featureEnabled });
  }

  return true;
});
