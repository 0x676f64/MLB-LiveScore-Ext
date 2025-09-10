// Floating window management
let floatingWindowId = null;

// Existing goBack functionality
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

// Existing fetchStandings functionality
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

// Existing navigation functionality
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "navigate") {
        chrome.tabs.create({ url: request.url });
    }
});

// NEW: Floating window functionality
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openFloatingWindow') {
        createFloatingWindow();
        sendResponse({status: "success"});
    } else if (message.action === 'closeFloatingWindow') {
        closeFloatingWindow();
        sendResponse({status: "success"});
    } else if (message.action === 'toggleFloatingWindow') {
        toggleFloatingWindow();
        sendResponse({status: "success"});
    }
});

async function createFloatingWindow() {
    // Check if floating window already exists
    if (floatingWindowId) {
        try {
            // Try to focus the existing window
            await chrome.windows.update(floatingWindowId, { focused: true });
            return;
        } catch (error) {
            // Window no longer exists, reset the ID
            floatingWindowId = null;
        }
    }
    
    // Get saved window position or use defaults
    try {
        const result = await chrome.storage.local.get(['floatingWindowPosition']);
        const position = result.floatingWindowPosition || { top: 100, left: 100 };
        
        // Create new floating window
        const window = await chrome.windows.create({
            url: chrome.runtime.getURL('floating-window.html'),
            type: 'popup',
            width: 400,
            height: 600,
            top: position.top,
            left: position.left,
            focused: true
        });
        
        floatingWindowId = window.id;
    } catch (error) {
        console.error('Error creating floating window:', error);
    }
}

function closeFloatingWindow() {
    if (floatingWindowId) {
        chrome.windows.remove(floatingWindowId, () => {
            floatingWindowId = null;
        });
    }
}

async function toggleFloatingWindow() {
    if (floatingWindowId) {
        // Window exists, close it
        closeFloatingWindow();
    } else {
        // Window doesn't exist, create it
        await createFloatingWindow();
    }
}

// Clean up when floating window is closed by user
chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === floatingWindowId) {
        floatingWindowId = null;
    }
});

// Save window position when it's moved or resized
chrome.windows.onBoundsChanged.addListener(async (window) => {
    if (window.id === floatingWindowId) {
        try {
            await chrome.storage.local.set({
                floatingWindowPosition: {
                    top: window.top,
                    left: window.left,
                    width: window.width,
                    height: window.height
                }
            });
        } catch (error) {
            console.error('Error saving window position:', error);
        }
    }
});

// Optional: Handle extension startup - you can auto-open floating window if desired
chrome.runtime.onStartup.addListener(() => {
    // Uncomment if you want to auto-open floating window on browser startup
    // createFloatingWindow();
});

// Optional: Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('MLB Scoreboard extension installed');
        // Optionally show a welcome floating window
        // createFloatingWindow();
    } else if (details.reason === 'update') {
        console.log('MLB Scoreboard extension updated');
    }
});