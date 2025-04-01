document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');

  // Get team info from URL
  const urlParams = new URLSearchParams(window.location.search);
  const teamShortName = urlParams.get('teamName');
  const teamLogo = urlParams.get('logo');
  
  var teamNames = {
    "Arizona Diamondbacks": "ARI",
    "Atlanta Braves": "ATL",
    "Baltimore Orioles": "BAL",
    "Boston Red Sox": "BOS",
    "Chicago White Sox": "CWS",
    "Chicago Cubs": "CHC",
    "Cincinnati Reds": "CIN",
    "Cleveland Guardians": "CLE",
    "Colorado Rockies": "COL",
    "Detroit Tigers": "DET",
    "Houston Astros": "HOU",
    "Kansas City Royals": "KC",
    "Los Angeles Angels": "LAA",
    "Los Angeles Dodgers": "LAD",
    "Miami Marlins": "MIA",
    "Milwaukee Brewers": "MIL",
    "Minnesota Twins": "MIN",
    "New York Yankees": "NYY",
    "New York Mets": "NYM",
    "Oakland Athletics": "OAK",
    "Philadelphia Phillies": "PHI",
    "Pittsburgh Pirates": "PIT",
    "San Diego Padres": "SD",
    "San Francisco Giants": "SF",
    "Seattle Mariners": "SEA",
    "St. Louis Cardinals": "STL",
    "Tampa Bay Rays": "TB",
    "Texas Rangers": "TEX",
    "Toronto Blue Jays": "TOR",
    "Washington Nationals": "WSH"
  };

  const fullTeamName = Object.keys(teamNames).find(name => name.includes(teamShortName));

  if (!fullTeamName) {
    alert('Invalid team!');
    return;
  }

  // Fix for cities with multiple words
  let cityParts = [];
  let teamNameParts = [];
  
  // Special cases for teams with multi-word cities
  if (fullTeamName.startsWith("New York")) {
    cityParts = ["New York"];
    teamNameParts = fullTeamName.replace("New York ", "").split(' ');
  } else if (fullTeamName.startsWith("San Francisco")) {
    cityParts = ["San Francisco"];
    teamNameParts = fullTeamName.replace("San Francisco ", "").split(' ');
  } else if (fullTeamName.startsWith("San Diego")) {
    cityParts = ["San Diego"];
    teamNameParts = fullTeamName.replace("San Diego ", "").split(' ');
  } else if (fullTeamName.startsWith("St. Louis")) {
    cityParts = ["St. Louis"];
    teamNameParts = fullTeamName.replace("St. Louis ", "").split(' ');
  } else if (fullTeamName.startsWith("Los Angeles")) {
    cityParts = ["Los Angeles"];
    teamNameParts = fullTeamName.replace("Los Angeles ", "").split(' ');
  } else if (fullTeamName.startsWith("Kansas City")) {
    cityParts = ["Kansas City"];
    teamNameParts = fullTeamName.replace("Kansas City ", "").split(' ');
  } else if (fullTeamName.startsWith("Tampa Bay")) {
    cityParts = ["Tampa Bay"];
    teamNameParts = fullTeamName.replace("Tampa Bay ", "").split(' ');
  } else {
    // Default case for cities with one word
    const allParts = fullTeamName.split(' ');
    cityParts = [allParts[0]];
    teamNameParts = allParts.slice(1);
  }
  
  const city = cityParts.join(' ');
  const teamName = teamNameParts.join(' ');

  // Create all elements first
  // 1. statsheader-container
  const statsheaderContainer = document.createElement("div");
  statsheaderContainer.classList.add("statsheader-container");
  statsheaderContainer.innerHTML = `
      <img src="assets/Group 1.png" alt="MLB Icon" class="header-logo">
  `;
  
  // 2 & 3. team-city and team-name elements
  const cityElement = document.createElement('div');
  cityElement.classList.add('team-city');
  cityElement.textContent = city;
  
  const nameElement = document.createElement('div');
  nameElement.classList.add('team-name');
  nameElement.textContent = teamName;
  
  // 4. logo image
  const headerLogo = document.createElement('img');
  headerLogo.src = teamLogo;
  headerLogo.alt = `${fullTeamName} Logo`;
  headerLogo.style.width = '150px';
  headerLogo.style.height = 'auto';
  
  // 5. nav-container (adding a placeholder since it was mentioned in your order)
  const navContainer = document.createElement('div');
  navContainer.classList.add('nav-container');
  
  // Now add everything to the document in the correct order
  document.body.prepend(statsheaderContainer); // 1
  document.body.insertBefore(nameElement, statsheaderContainer.nextSibling); // 3
  document.body.insertBefore(cityElement, nameElement); // 2
  document.body.insertBefore(headerLogo, nameElement.nextSibling); // 4
});