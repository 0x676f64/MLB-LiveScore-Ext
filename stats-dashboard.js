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
  
  // Add stats container below the logo
  const statsContainer = document.createElement('div');
  statsContainer.classList.add('stats-container');
  statsContainer.style.width = '80%';
  statsContainer.style.margin = '20px auto';
  statsContainer.style.border = '1px solid #ddd';
  statsContainer.style.borderRadius = '8px';
  statsContainer.style.overflow = 'hidden';
  statsContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
  
  // Create tabs container
  const tabsContainer = document.createElement('div');
  tabsContainer.classList.add('tabs-container');
  tabsContainer.style.display = 'flex';
  tabsContainer.style.borderBottom = '1px solid #ddd';
  tabsContainer.style.justifyContent = 'center'; // Center the tabs
  
  // Create batting tab
  const battingTab = document.createElement('div');
  battingTab.classList.add('tab');
  battingTab.classList.add('active');
  battingTab.textContent = 'BATTING';
  battingTab.style.padding = '15px 20px';
  battingTab.style.fontWeight = 'bold';
  battingTab.style.cursor = 'pointer';
  battingTab.style.backgroundColor = '#f8f8f8';
  battingTab.style.borderBottom = '3px solid #057AFF';
  
  // Create pitching tab
  const pitchingTab = document.createElement('div');
  pitchingTab.classList.add('tab');
  pitchingTab.textContent = 'PITCHING';
  pitchingTab.style.padding = '15px 20px';
  pitchingTab.style.fontWeight = 'bold';
  pitchingTab.style.cursor = 'pointer';
  
  // Add tabs to container
  tabsContainer.appendChild(battingTab);
  tabsContainer.appendChild(pitchingTab);
  
  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('content-container');
  contentContainer.style.padding = '20px 10px'; // Reduced horizontal padding
  
  // Sample pitching data (placeholder values)
  const pitchingData = {
    'xBA': { value: '.249', percentile: 68 },
    'xSLG': { value: '.415', percentile: 72 },
    'Hard Hit%': { value: '40.2%', percentile: 65 },
    'Exit Velo': { value: '89.3', percentile: 63 },
    'Barrel%': { value: '8.5%', percentile: 70 },
    'xwOBA': { value: '.320', percentile: 75 },
    'GB%': { value: '43.8%', percentile: 55 },
    'Chase%': { value: '31.2%', percentile: 80 },
    'Whiff%': { value: '25.7%', percentile: 78 },
    'Launch Angle Sweet Spot%': { value: '32.6%', percentile: 62 }
  };
  
  // Sample batting data (placeholder values)
  const battingData = {
    'AVG': { value: '.272', percentile: 82 },
    'OBP': { value: '.342', percentile: 78 },
    'SLG': { value: '.478', percentile: 85 },
    'OPS': { value: '.820', percentile: 83 },
    'wRC+': { value: '125', percentile: 87 },
    'BB%': { value: '9.4%', percentile: 66 },
    'K%': { value: '21.3%', percentile: 60 },
    'ISO': { value: '.206', percentile: 79 },
    'BABIP': { value: '.305', percentile: 63 },
    'wOBA': { value: '.355', percentile: 82 }
  };

  // Function to create the stats display
  function createStatsDisplay(data) {
    const statsDisplay = document.createElement('div');
    
    // Loop through the stats data
    for (const [stat, values] of Object.entries(data)) {
      // Create row for each stat
      const statRow = document.createElement('div');
      statRow.classList.add('stat-row');
      statRow.style.display = 'flex';
      statRow.style.alignItems = 'center';
      statRow.style.marginBottom = '15px';
      statRow.style.padding = '5px 0';
      
      // Create stat name element
      const statName = document.createElement('div');
      statName.classList.add('stat-name');
      statName.textContent = stat;
      statName.style.width = '160px'; // Reduced from 200px
      statName.style.fontWeight = 'bold';
      statName.style.paddingLeft = '5px'; // Minimal left padding
      
      // Create stat value element
      const statValue = document.createElement('div');
      statValue.classList.add('stat-value');
      statValue.textContent = values.value;
      statValue.style.width = '60px';
      statValue.style.textAlign = 'center';
      statValue.style.fontWeight = 'bold';
      
      // Create percentile bar container
      const percentileContainer = document.createElement('div');
      percentileContainer.classList.add('percentile-container');
      percentileContainer.style.flex = '1';
      percentileContainer.style.height = '16px';
      percentileContainer.style.backgroundColor = '#f0f0f0';
      percentileContainer.style.borderRadius = '8px';
      percentileContainer.style.overflow = 'hidden';
      percentileContainer.style.position = 'relative';
      percentileContainer.style.marginLeft = '10px'; // Reduced margin
      
      // Create percentile bar
      const percentileBar = document.createElement('div');
      percentileBar.classList.add('percentile-bar');
      percentileBar.style.width = `${values.percentile}%`;
      percentileBar.style.height = '100%';
      percentileBar.style.backgroundColor = getPercentileColor(values.percentile);
      
      // Create percentile label
      const percentileLabel = document.createElement('div');
      percentileLabel.classList.add('percentile-label');
      percentileLabel.textContent = values.percentile;
      percentileLabel.style.position = 'absolute';
      percentileLabel.style.top = '0';
      percentileLabel.style.right = '8px';
      percentileLabel.style.fontSize = '12px';
      percentileLabel.style.fontWeight = 'bold';
      percentileLabel.style.color = '#333';
      
      // Assemble the row
      percentileContainer.appendChild(percentileBar);
      percentileContainer.appendChild(percentileLabel);
      statRow.appendChild(statName);
      statRow.appendChild(statValue);
      statRow.appendChild(percentileContainer);
      statsDisplay.appendChild(statRow);
    }
    
    return statsDisplay;
  }
  
  // Function to get color based on percentile (blue-gray-red gradient)
  function getPercentileColor(percentile) {
    // Convert percentile to a value between 0 and 1
    const value = percentile / 100;
    
    // Calculate RGB values for a blue-gray-red gradient
    let r, g, b;
    
    if (value <= 0.5) {
      // Blue (0%) to Gray (50%)
      // As value increases from 0 to 0.5, blue decreases and red/green increase
      const factor = value * 2; // Scale to 0-1 range
      r = Math.round(128 * factor);
      g = Math.round(128 * factor);
      b = Math.round(255 - (127 * factor));
    } else {
      // Gray (50%) to Red (100%)
      // As value increases from 0.5 to 1, green/blue decrease and red increases
      const factor = (value - 0.5) * 2; // Scale to 0-1 range
      r = Math.round(128 + (127 * factor));
      g = Math.round(128 - (128 * factor));
      b = Math.round(128 - (128 * factor));
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Initially show batting stats
  let currentStatsDisplay = createStatsDisplay(battingData);
  contentContainer.appendChild(currentStatsDisplay);
  
  // Add event listeners to tabs
  battingTab.addEventListener('click', function() {
    // Update active tab styles
    battingTab.classList.add('active');
    battingTab.style.backgroundColor = '#f8f8f8';
    battingTab.style.borderBottom = '3px solid #057AFF';
    
    pitchingTab.classList.remove('active');
    pitchingTab.style.backgroundColor = '';
    pitchingTab.style.borderBottom = '';
    
    // Update content
    contentContainer.innerHTML = '';
    currentStatsDisplay = createStatsDisplay(battingData);
    contentContainer.appendChild(currentStatsDisplay);
  });
  
  pitchingTab.addEventListener('click', function() {
    // Update active tab styles
    pitchingTab.classList.add('active');
    pitchingTab.style.backgroundColor = '#f8f8f8';
    pitchingTab.style.borderBottom = '3px solid #057AFF';
    
    battingTab.classList.remove('active');
    battingTab.style.backgroundColor = '';
    battingTab.style.borderBottom = '';
    
    // Update content
    contentContainer.innerHTML = '';
    currentStatsDisplay = createStatsDisplay(pitchingData);
    contentContainer.appendChild(currentStatsDisplay);
  });
  
  // Assemble the stats container
  statsContainer.appendChild(tabsContainer);
  statsContainer.appendChild(contentContainer);
  
  // Add stats container to the document after the logo
  document.body.insertBefore(statsContainer, headerLogo.nextSibling);
});