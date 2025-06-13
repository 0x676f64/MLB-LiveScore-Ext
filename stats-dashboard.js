document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');

  // Get team info from URL
  const urlParams = new URLSearchParams(window.location.search);
  const teamShortName = urlParams.get('teamName');
  const teamLogo = urlParams.get('logo');
  
  // Team names dictionary
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

  // Map of team IDs to use with the API
  const teamIds = {
    "Arizona Diamondbacks": 109,
    "Atlanta Braves": 144,
    "Baltimore Orioles": 110,
    "Boston Red Sox": 111,
    "Chicago White Sox": 145,
    "Chicago Cubs": 112,
    "Cincinnati Reds": 113,
    "Cleveland Guardians": 114,
    "Colorado Rockies": 115,
    "Detroit Tigers": 116,
    "Houston Astros": 117,
    "Kansas City Royals": 118,
    "Los Angeles Angels": 108,
    "Los Angeles Dodgers": 119,
    "Miami Marlins": 146,
    "Milwaukee Brewers": 158,
    "Minnesota Twins": 142,
    "New York Yankees": 147,
    "New York Mets": 121,
    "Oakland Athletics": 133,
    "Philadelphia Phillies": 143,
    "Pittsburgh Pirates": 134,
    "San Diego Padres": 135,
    "San Francisco Giants": 137,
    "Seattle Mariners": 136,
    "St. Louis Cardinals": 138,
    "Tampa Bay Rays": 139,
    "Texas Rangers": 140,
    "Toronto Blue Jays": 141,
    "Washington Nationals": 120
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
  const teamId = teamIds[fullTeamName];

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
  headerLogo.style.width = '130px';
  headerLogo.style.height = 'auto';
  
  // 5. nav-container (adding a placeholder since it was mentioned in your order)
  const navContainer = document.createElement('div');
  navContainer.classList.add('nav-container');
  
  // Now add everything to the document in the correct order
  document.body.prepend(statsheaderContainer); // 1
  document.body.insertBefore(nameElement, statsheaderContainer.nextSibling); // 3
  document.body.insertBefore(cityElement, nameElement); // 2
  document.body.insertBefore(headerLogo, nameElement.nextSibling); // 4
  
  // Add CSS for animations
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes slideBar {
      from { width: 0%; }
    }
    
    .percentile-bar {
      transition: width 0.8s ease-out;
    }
    
    .percentile-circle {
      transition: left 0.8s ease-out;
    }
    
    .tab {
      transition: background-color 0.3s ease;
    }
    
    .tab.active {
      background-color: #D7827E !important;
      color: white !important;
    }

    .tab.inactive {
    background-color: transparent !important;
    }
    
    .percentile-container {
      margin-right: 15px; /* Add right margin to ensure circle fits */
    }
  `;
  document.head.appendChild(styleElement);
  
const statsContainer = document.createElement('div');
statsContainer.classList.add('stats-container');
statsContainer.style.display = 'flex'; // Make it a flex container
statsContainer.style.flexDirection = 'column'; // Stack children vertically
statsContainer.style.alignItems = 'center'; // Center content horizontally within the container
statsContainer.style.width = '700px'; // Consistent width with player-stats for 5 columns
statsContainer.style.border = '3px solid #000';
statsContainer.style.borderRadius = '8px';
statsContainer.style.overflow = 'hidden'; // Hide any overflow (e.g., from shadows)
statsContainer.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; // Stronger shadow
statsContainer.style.padding = '15px'; // Padding inside the entire stats block
statsContainer.style.backgroundColor = '#E5DECF'; // Keep the background color
statsContainer.style.marginLeft = '7px'; // Add some space from the header
  
  // Create tabs container
  const tabsContainer = document.createElement('div');
  tabsContainer.classList.add('tabs-container');
  tabsContainer.style.display = 'flex';
  tabsContainer.style.justifyContent = 'center'; // Center the tabs
  tabsContainer.style.padding = '0 5px'; 
  
  // Create batting tab
  const battingTab = document.createElement('div');
  battingTab.classList.add('tab', 'active');
  battingTab.textContent = 'BATTING';
  battingTab.style.padding = '10px 10px';
  battingTab.style.fontSize = '14px'; // Increased font size
  battingTab.style.fontWeight = '600';
  battingTab.style.cursor = 'pointer';
  battingTab.style.backgroundColor = '#e5decf';
  battingTab.style.border = '2px solid #D7827E';
  battingTab.style.borderRadius = '8px';
  battingTab.style.transition = 'all 0.3s ease'; 
  battingTab.style.fontWeight = 'bold';
  battingTab.style.color = '#3b3b3b';
  battingTab.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; // Rounded top corners
  
  // Create pitching tab
  const pitchingTab = document.createElement('div');
  pitchingTab.classList.add('tab');
  pitchingTab.textContent = 'PITCHING';
  pitchingTab.style.padding = '10px 10px';
  pitchingTab.style.fontSize = '15px'; // Increased font size
  pitchingTab.style.fontWeight = '600';
  pitchingTab.style.cursor = 'pointer';
  pitchingTab.style.backgroundColor = 'transparent';
  pitchingTab.style.border = '2px solid #D7827E';
  pitchingTab.style.borderRadius = '8px';
  pitchingTab.style.transition = 'all 0.3s ease'; 
  pitchingTab.style.fontWeight = 'bold';
  pitchingTab.style.color = '#3b3b3b';
  pitchingTab.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  
  // Add tabs to container
  tabsContainer.appendChild(battingTab);
  tabsContainer.appendChild(pitchingTab);

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('content-container');

  // Loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.textContent = 'Loading team stats...';
  loadingIndicator.style.textAlign = 'center';
  loadingIndicator.style.padding = '20px';
  loadingIndicator.style.fontWeight = 'bold';
  contentContainer.appendChild(loadingIndicator);
  
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
// Function to fetch team stats
async function fetchTeamStats() {
    try {
        // Fetch hitting stats for all teams
        const hittingResponse = await fetch('https://statsapi.mlb.com/api/v1/teams/stats?season=2025&group=hitting&stats=season&sportId=1');
        const hittingData = await hittingResponse.json();

        // Calculate XBH for each team
        hittingData.stats[0].splits.forEach(split => {
            const doubles = parseInt(split.stat.doubles) || 0;
            const triples = parseInt(split.stat.triples) || 0;
            const homeRuns = parseInt(split.stat.homeRuns) || 0;
            split.stat.xbh = doubles + triples + homeRuns;
        });

        // Fetch pitching stats for all teams
        const pitchingResponse = await fetch('https://statsapi.mlb.com/api/v1/teams/stats?season=2025&group=pitching&stats=season&sportId=1');
        const pitchingData = await pitchingResponse.json();

        return { hitting: hittingData, pitching: pitchingData };
    } catch (error) {
        console.error('Error fetching team stats:', error);
        return null;
    }
}

function processStats(allStats, statGroup) {
    const statKeys = statGroup === 'hitting' ? 
        ['runs', 'homeRuns', 'strikeOuts', 'baseOnBalls', 'hits', 'avg', 'ops', 'stolenBases', 'totalBases', 'rbi', 'leftOnBase', 'xbh'] :
        ['runs', 'homeRuns', 'hits', 'avg', 'ops', 'era', 'stolenBases', 'strikeOuts', 'whip', 'groundIntoDoublePlay', 'holds', 'strikeoutsPer9Inn'];

    const splitStats = allStats.stats[0].splits;
    const teamSplit = splitStats.find(s => s.team.id === teamId);
    if (!teamSplit) return null;

    const allValues = {};
    statKeys.forEach(key => allValues[key] = []);

    splitStats.forEach(split => {
        statKeys.forEach(key => {
            let val = parseFloat(split.stat[key]) || 0;
            allValues[key].push(val);
        });
    });

    let relevantStats = {};
    statKeys.forEach(key => {
        const teamValue = parseFloat(teamSplit.stat[key]) || 0;
        const sorted = allValues[key].slice().sort((a, b) => a - b);
        const position = sorted.indexOf(teamValue);
        let percentile = Math.round((position / (sorted.length - 1)) * 100);

        // Define "good high" and "good low" logic based on statGroup
        if (statGroup === 'hitting') {
            const goodLowHitting = ['strikeOuts', 'leftOnBase'];
            const goodHighHitting = ['runs', 'homeRuns', 'baseOnBalls', 'hits', 'avg', 'ops', 'stolenBases', 'totalBases', 'rbi', 'xbh'];

            if (goodLowHitting.includes(key)) {
                percentile = 100 - percentile;
            }
        } else if (statGroup === 'pitching') {
            const goodLowPitching = ['runs', 'homeRuns', 'hits', 'avg', 'ops', 'era', 'stolenBases', 'whip'];
            const goodHighPitching = ['strikeOuts', 'groundIntoDoublePlay', 'holds', 'strikeoutsPer9Inn'];

            if (goodLowPitching.includes(key)) {
                percentile = 100 - percentile;
            }
        }

        let displayValue = teamValue;
        if (['avg', 'ops', 'whip'].includes(key)) {
            displayValue = teamValue.toFixed(3);
        } else if (key === 'era') {
            displayValue = teamValue.toFixed(2);
        } else if (key === 'strikePercentage') {
            displayValue = (teamValue * 100).toFixed(1) + '%';
        }

        relevantStats[key] = {
            value: displayValue,
            percentile: percentile
        };
    });

    return relevantStats;
}

 // Function to create the stats display grid
function createStatsDisplay(data, animate = false) {

// Create the grid wrapper directly within this function
const statsGridWrapper = document.createElement('div');
statsGridWrapper.classList.add('stats-grid-wrapper');

// Flex styles are applied via CSS class now, but explicitly setting here for clarity
statsGridWrapper.style.display = 'flex';
statsGridWrapper.style.flexWrap = 'wrap';
statsGridWrapper.style.justifyContent = 'space-between';
statsGridWrapper.style.alignItems = 'stretch';
statsGridWrapper.style.gap = '10px 10px'; // Vertical and Horizontal gap
statsGridWrapper.style.width = '100%';
statsGridWrapper.style.marginTop = '10px';
    
// Loop through the stats data
                for (const [stat, values] of Object.entries(data)) {
                    // Create individual stat item (row)
                    const statRow = document.createElement('div');
                    statRow.classList.add('stat-row');
                    statRow.style.flexDirection = 'column'; // Ensure vertical stacking of name, value, percentile
                    statRow.style.alignItems = 'center';
                    // statRow.style.width = '125px'; // Removed, flexBasis handles this

                    // Create stat name element
                    const statName = document.createElement('div');
                    statName.classList.add('stat-name');
                    statName.textContent = formatStatName(stat);

                    // Create stat value element
                    const statValue = document.createElement('div');
                    statValue.classList.add('stat-value');
                    statValue.textContent = values.value;

                    // Create percentile bar container
                    const percentileContainer = document.createElement('div');
                    percentileContainer.classList.add('percentile-container');

                    // Create percentile bar
                    const percentileBar = document.createElement('div');
                    percentileBar.classList.add('percentile-bar');
                    percentileBar.style.width = animate ? '0%' : `${values.percentile}%`; // Start at 0 if animating
                    percentileBar.style.backgroundColor = getPercentileColor(values.percentile);

                    // Create percentile circle
                    const percentileCircle = document.createElement('div');
                    percentileCircle.classList.add('percentile-circle');
                    percentileCircle.textContent = values.percentile;
                    percentileCircle.style.left = animate ? '0%' : `calc(${values.percentile}% - 14px)`; // Position circle for non-animated state
                    percentileCircle.style.backgroundColor = getPercentileColor(values.percentile);

                    // Assemble the percentile elements
                    percentileContainer.appendChild(percentileBar);
                    percentileContainer.appendChild(percentileCircle);

                    // Assemble the stat row
                    statRow.appendChild(statName);
                    statRow.appendChild(statValue);
                    statRow.appendChild(percentileContainer);

                    // Append the stat row to the grid wrapper
                    statsGridWrapper.appendChild(statRow);
                }

                // If animate is true, trigger the animation after a short delay
                if (animate) {
                    setTimeout(() => {
                        const bars = statsGridWrapper.querySelectorAll('.percentile-bar');
                        const circles = statsGridWrapper.querySelectorAll('.percentile-circle');

                        bars.forEach((bar, index) => {
                            const percentile = parseFloat(circles[index].textContent);
                            bar.style.width = `${percentile}%`;
                            // Adjust left position for the circle to account for its own width
                            circles[index].style.left = `calc(${percentile}% - 14px)`;
                        });
                    }, 50); // Small delay to ensure DOM is ready and transitions apply
                }

                return statsGridWrapper; // Return the fully constructed grid wrapper
            }
  
  // Function to format stat names for display
  function formatStatName(stat) {
    const nameMap = {
      'runs': 'Runs',
      'homeRuns': 'Home Runs',
      'strikeOuts': 'Strikeouts',
      'baseOnBalls': 'Walks',
      'hits': 'Hits',
      'avg': 'AVG',
      'ops': 'OPS',
      'stolenBases': 'Stolen Bases',
      'totalBases': 'Total Bases',
      'rbi': 'RBI',
      'leftOnBase': 'Left On Base',
      'era': 'ERA',
      'strikePercentage': 'Strike %',
      'whip': 'WHIP',
      'groundIntoDoublePlay': 'GIDP',
      'holds': 'Holds',
      'xbh' : 'Extra Base Hits', // Added for hitting stats
      'strikeoutsPer9Inn': 'Strikeouts Per 9' // Added for pitching stats
    };
    
    return nameMap[stat] || stat;
  }
  
  // Fetch the stats and update the UI
  fetchTeamStats().then(allStats => {
    if (!allStats) {
      contentContainer.innerHTML = '<div style="text-align: center; padding: 20px;">Failed to load stats. Please try again later.</div>';
      return;
    }
    
    // Process hitting stats
    const hittingStats = processStats(allStats.hitting, 'hitting');
    
    // Process pitching stats
    const pitchingStats = processStats(allStats.pitching, 'pitching');
    
    // Remove loading indicator
    contentContainer.innerHTML = '';
    
    // Initially show batting stats with animation
                let currentStatsGrid = createStatsDisplay(hittingStats, true);
                contentContainer.appendChild(currentStatsGrid);
    
    // Add tab event listeners
    battingTab.addEventListener('click', function() {
      if (battingTab.classList.contains('active')) return; // Skip if already active
      
      battingTab.classList.add('active');
      battingTab.classList.remove('inactive');
      pitchingTab.classList.remove('active');
      pitchingTab.classList.add('inactive');
    
      contentContainer.innerHTML = '';
      currentStatsDisplay = createStatsDisplay(hittingStats, true);
      contentContainer.appendChild(currentStatsDisplay);
    });
    
    pitchingTab.addEventListener('click', function() {
      if (pitchingTab.classList.contains('active')) return; // Skip if already active
      
      pitchingTab.classList.add('active');
      pitchingTab.classList.remove('inactive');
      battingTab.classList.remove('active');
      battingTab.classList.add('inactive');
    
      contentContainer.innerHTML = '';
      currentStatsDisplay = createStatsDisplay(pitchingStats, true);
      contentContainer.appendChild(currentStatsDisplay);
    });
  }).catch(error => {
    console.error('Error processing stats:', error);
    contentContainer.innerHTML = '<div style="text-align: center; padding: 20px;">An error occurred while loading stats. Please try again later.</div>';
  });
  
  // Assemble the stats container
  statsContainer.appendChild(tabsContainer);
  statsContainer.appendChild(contentContainer);
  
  // Add stats container to the document after the logo
  document.body.insertBefore(statsContainer, headerLogo.nextSibling);
});