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