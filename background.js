chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "goBack") {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
              chrome.tabs.goBack(tabs[0].id);
              // Send a response to keep the message channel open
              sendResponse({status: "success"});
          } else {
              // Send an error response if no active tab found
              sendResponse({status: "error", message: "No active tab found"});
          }
      });
      // Return true to indicate an asynchronous response
      return true;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchStandings') {
        fetch(request.url)
            .then(response => response.json())
            .then(data => {
                sendResponse({ data: data });
            })
            .catch(error => {
                sendResponse({ error: error.message });
            });
        return true; // Indicates we wish to send a response asynchronously
    }
});

// In background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "navigate") {
        chrome.tabs.create({ url: request.url });
    }
});

