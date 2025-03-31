document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');

  // Get team info from URL
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get('team');
  const teamLogo = urlParams.get('logo');
  
  // Add team city parameter to your URL or parse from teamName
  const teamCity = urlParams.get('city'); // New parameter

  // Create and add team logo
  const headerLogo = document.createElement('img');
  headerLogo.src = teamLogo;
  headerLogo.alt = `${teamName} Logo`;
  headerLogo.style.width = '150px';
  headerLogo.style.height = 'auto';
  document.body.prepend(headerLogo);

  // Add header section
  const headerContainer = document.createElement("div");
  headerContainer.classList.add("header-container");
  headerContainer.innerHTML = `
      <img src="assets/Group 1.png" alt="MLB Icon" class="header-logo">
  `;
  document.body.prepend(headerContainer);

  // Create team header with city and name
  const headerTitle = document.createElement('div');
  headerTitle.classList.add('team-header');
  
  if (teamCity) {
    // If we have both city and team name, display them with proper styling
    headerTitle.innerHTML = `
      <h1>
        <span class="team-city">${teamCity}</span>
        <span class="team-name">${teamName}</span>
      </h1>
    `;
  } else {
    // Fallback to just team name
    headerTitle.innerHTML = `<h1>${teamName}</h1>`;
  }
  
  headerContainer.appendChild(headerTitle);

  // Placeholder for future content
  const content = document.createElement('p');
  content.textContent = 'Select a tab to view team stats.';
});