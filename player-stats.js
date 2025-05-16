 document.addEventListener('DOMContentLoaded', function() {
        const playerSearchInput = document.getElementById('playerSearch');
        const searchButton = document.getElementById('searchButton');
        const playerContainer = document.getElementById('playerContainer');
        const playerImageDiv = document.getElementById('playerImage');
        const playerNameElement = document.getElementById('playerName');
        const playerPositionElement = document.getElementById('playerPosition');
        const statsContainer = document.getElementById('statsContainer');
        const loading = document.getElementById('loading');
        const errorMessage = document.getElementById('errorMessage');

        // 1. statsheader-container
        const statsheaderContainer = document.createElement("div");
        statsheaderContainer.classList.add("statsheader-container");
        statsheaderContainer.innerHTML = `
            <img src="assets/Group 1.png" alt="MLB Icon" class="header-logo">
        `;

        // 2. Append the header to the body
        document.body.prepend(statsheaderContainer); // Use prepend to add it at the beginning of the body

        searchButton.addEventListener('click', searchPlayer);
        playerSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchPlayer();
            }
        });

        function resetDisplay() {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
            playerContainer.style.display = 'none';
            loading.style.display = 'none';
        }

        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }

        async function searchPlayer() {
            const searchTerm = playerSearchInput.value.trim();
            if (!searchTerm) {
                showError('Please enter a player name');
                return;
            }

            resetDisplay();
            loading.style.display = 'block';

            try {
                const players = await searchPlayers(searchTerm);

                if (players.length === 0) {
                    showError('No player found with that name');
                    return;
                }

                const player = players[0];
                const playerDetails = await getPlayerDetails(player.id);
                const playerHittingStats = await getPlayerStats(player.id, 'hitting', 2025);
                const playerPitchingStats = await getPlayerStats(player.id, 'pitching', 2025);
                const allHittingPlayersData = await fetchAllPlayerStats('hitting', 2025);
                const allPitchingPlayersData = await fetchAllPlayerStats('pitching', 2025);

                displayPlayerInfo(playerDetails, playerHittingStats, allHittingPlayersData, playerPitchingStats, allPitchingPlayersData);

                loading.style.display = 'none';
                playerContainer.style.display = 'block';

            } catch (error) {
                console.error('Error:', error);
                showError('An error occurred while fetching player data');
                loading.style.display = 'none';
            }
        }

        async function searchPlayers(name) {
            const response = await fetch(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(name)}&sportId=1`);
            if (!response.ok) throw new Error('Failed to search for players');
            const data = await response.json();
            return data.people || [];
        }

        async function getPlayerDetails(playerId) {
            const response = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
            if (!response.ok) throw new Error('Failed to get player details');
            const data = await response.json();
            return data.people[0];
        }

        async function getPlayerStats(playerId, group = 'hitting', year = 2025) {
        const response = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=statsSingleSeason&season=${year}&group=${group}&sportId=1`);
        if (!response.ok) throw new Error(`Failed to get player ${group} stats for ${year}`);
        const data = await response.json();
        return data.stats[0]?.splits[0]?.stat || {};
        }

        async function fetchAllPlayerStats(group, year = 2025) {
            try {
                const response = await fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=${group}&sportId=1&season=${year}`);
                if (!response.ok) throw new Error(`Failed to fetch all ${group} stats for ${year}`);
                const data = await response.json();
                return data.stats[0]?.splits?.map(split => ({ id: split.player.id, stats: split.stat })) || [];
            } catch (error) {
                console.error(`Error fetching all ${group} stats:`, error);
                return [];
            }
            }

        function calculatePlayerPercentile(playerValue, allPlayersValues, higherIsBetter = true) {
            const validValues = allPlayersValues.filter(value => typeof value === 'number');
            if (validValues.length === 0) return 50;

            const sortedValues = [...validValues].sort((a, b) => a - b);
            const position = sortedValues.indexOf(playerValue);
            const totalPlayers = sortedValues.length;

            if (totalPlayers > 1) {
                const rawPercentile = (position / (totalPlayers - 1)) * 100;
                return higherIsBetter ? Math.round(rawPercentile) : Math.round(100 - rawPercentile);
            } else {
                return 50; // Only one player with this stat
            }
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

function displayPlayerInfo(player, hittingStats, allHittingData, pitchingStats, allPitchingData) {
    playerNameElement.textContent = `${player.firstName} ${player.lastName}`;
    playerPositionElement.textContent = player.primaryPosition?.name || 'Position Unknown';
    playerImageDiv.innerHTML = `<img src="https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_150,h_150,c_fill,q_auto:best/v1/people/${player.id}/headshot/67/current" alt="${player.fullName}" onerror="this.onerror=null; this.src='assets/mlb_logo.svg'">`;

    statsContainer.innerHTML = '';
    const isPitcher = player.primaryPosition?.type === 'Pitcher';
    const currentStats = isPitcher ? pitchingStats : hittingStats;
    const allPlayersCurrentData = isPitcher ? allPitchingData : allHittingData;
    const statConfigList = isPitcher ? getPitchingStatConfig() : getHittingStatConfig();

    const statsDisplay = document.createElement('div'); // Create a container for all stats
    statsContainer.appendChild(statsDisplay);

    statConfigList.forEach(statConfig => {
        if (currentStats.hasOwnProperty(statConfig.name)) {
            const statValue = parseFloat(currentStats[statConfig.name]);
            if (!isNaN(statValue)) {
                const allValuesForStat = allPlayersCurrentData
                    .map(p => parseFloat(p.stats[statConfig.name]))
                    .filter(value => !isNaN(value));

                const higherIsBetter = isPitcher ? !statConfig.goodLow : statConfig.goodHigh;
                const percentile = calculatePlayerPercentile(statValue, allValuesForStat, higherIsBetter);
                const displayValue = statConfig.format ? statConfig.format(statValue) : statValue;
                const sliderColor = getPercentileColor(percentile);

                const statItem = document.createElement('div');
                statItem.className = 'stat-item';
                statItem.innerHTML = `
                    <div class="stat-name">${statConfig.display}</div>
                    <div class="stat-value">${displayValue}</div>
                    <div class="percentile-container">
                    </div>
                `;
                statsDisplay.appendChild(statItem); // Append to the container

                const percentileContainer = statItem.querySelector('.percentile-container');

                // Create percentile bar container (background)
                const percentileBarContainer = document.createElement('div');
                percentileBarContainer.classList.add('percentile-bar-container');
                percentileBarContainer.style.backgroundColor = '#f0f0f0'; // Background color for empty bar
                percentileBarContainer.style.height = '100%';
                percentileBarContainer.style.borderRadius = '8px';
                percentileBarContainer.style.width = '100%'; // Full width container
                percentileBarContainer.style.position = 'relative'; // For absolute positioning of the circle
                
                // Create the actual percentile bar that will animate
                const percentileBar = document.createElement('div');
                percentileBar.classList.add('percentile-bar');
                percentileBar.style.backgroundColor = sliderColor;
                percentileBar.style.height = '100%';
                percentileBar.style.width = '0%'; // Start at 0 for animation
                percentileBar.style.borderRadius = '8px';
                percentileBar.style.position = 'absolute';
                percentileBar.style.top = '0';
                percentileBar.style.left = '0';
                percentileBar.style.transition = 'width 1.3s ease-out'; // Smooth animation
                
                // Create percentile circle that will always be at the end of the bar
                const percentileCircle = document.createElement('div');
                percentileCircle.classList.add('percentile-circle');
                percentileCircle.textContent = Math.round(percentile);
                percentileCircle.style.position = 'absolute';
                percentileCircle.style.top = '-6px';
                percentileCircle.style.right = '-14px'; // Position at the end of the bar
                percentileCircle.style.backgroundColor = sliderColor;
                percentileCircle.style.color = 'white';
                percentileCircle.style.width = '28px';
                percentileCircle.style.height = '28px';
                percentileCircle.style.borderRadius = '50%';
                percentileCircle.style.display = 'flex';
                percentileCircle.style.alignItems = 'center';
                percentileCircle.style.justifyContent = 'center';
                percentileCircle.style.fontSize = '11px';
                percentileCircle.style.fontWeight = 'bold';
                percentileCircle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                percentileCircle.style.transition = 'inherit'; // Match the bar's transition

                // Attach circle to bar and bar to container
                percentileBar.appendChild(percentileCircle);
                percentileBarContainer.appendChild(percentileBar);
                percentileContainer.appendChild(percentileBarContainer);
            }
        }
    });

    // Apply animation after all stats are added
    const animate = true; // Ensure this is true for animation
    if (animate) {
        setTimeout(() => {
            const percentileBars = statsDisplay.querySelectorAll('.percentile-bar');
            
            // Animate all bars simultaneously
            percentileBars.forEach(bar => {
                const percentile = parseFloat(bar.querySelector('.percentile-circle').textContent);
                bar.style.width = `${percentile}%`;
            });
        }, 50);
    }

    if (statsContainer.children.length === 0) {
        statsContainer.textContent = `No ${isPitcher ? 'pitching' : 'hitting'} stats available for 2025.`;
    }
}

        function getHittingStatConfig() {
            return [
                { name: 'avg', display: 'Batting Avg', format: (v) => parseFloat(v).toFixed(3).replace(/^0+/, ''), goodHigh: true },
                { name: 'homeRuns', display: 'Home Runs', goodHigh: true },
                { name: 'rbi', display: 'RBI', goodHigh: true },
                { name: 'stolenBases', display: 'Stolen Bases', goodHigh: true },
                { name: 'obp', display: 'On-Base %', format: (v) => parseFloat(v).toFixed(3).replace(/^0+/, ''), goodHigh: true },
                { name: 'slg', display: 'Slugging %', format: (v) => parseFloat(v).toFixed(3).replace(/^0+/, ''), goodHigh: true },
                { name: 'ops', display: 'OPS', format: (v) => parseFloat(v).toFixed(3).replace(/^0+/, ''), goodHigh: true },
                { name: 'hits', display: 'Hits', goodHigh: true },
                { name: 'doubles', display: 'Doubles', goodHigh: true },
                { name: 'triples', display: 'Triples', goodHigh: true },
                { name: 'strikeOuts', display: 'Strike Outs', goodLow: true },
                { name: 'leftOnBase', display: 'Left On Base', goodLow: true },
                { name: 'baseOnBalls', display: 'Walks', goodHigh: true },
                { name: 'totalBases', display: 'Total Bases', goodHigh: true },
            ];
        }

        function getPitchingStatConfig() {
            return [
                { name: 'era', display: 'ERA', format: (v) => parseFloat(v).toFixed(2), goodLow: true },
                { name: 'whip', display: 'WHIP', format: (v) => parseFloat(v).toFixed(3), goodLow: true },
                { name: 'wins', display: 'Wins', goodHigh: true },
                { name: 'losses', display: 'Loses', goodLow: true },
                { name: 'strikeOuts', display: 'Strikeouts', goodHigh: true },
                { name: 'inningsPitched', display: 'Innings', goodHigh: true },
                { name: 'hits', display: 'Hits', goodLow: true },
                { name: 'runs', display: 'Runs', goodLow: true },
                { name: 'homeRuns', display: 'Home Runs', goodLow: true },
                { name: 'walks', display: 'Walks', goodLow: true },
                { name: 'saves', display: 'Saves', goodHigh: true },
                { name: 'holds', display: 'Holds', goodHigh: true },
                { name: 'groundIntoDoublePlay', display: 'GIDP', goodHigh: true },
                { name: 'ops', display: 'OPS', goodLow: true},
            ];
        }

        function resetDisplay() {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
            playerContainer.style.display = 'none';
            loading.style.display = 'none';
        }

        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    });