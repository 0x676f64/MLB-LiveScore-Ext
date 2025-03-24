document.addEventListener('DOMContentLoaded', function() {
  const backButton = document.getElementById('backButton');
  
  if (backButton) {
      backButton.addEventListener('click', function() {
          // Reset view state
          chrome.storage.local.set({
              'currentView': 'default',
              'currentGameId': null
          }, function() {
              // Navigate to the default view
              window.location.href = 'default.html';
          });
      });
  }
});