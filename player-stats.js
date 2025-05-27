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

            // Get recent stats for hot/cold indicators
            const recentHittingStats = await getPlayerRecentStats(player.id, 'hitting', 7);
            const recentPitchingStats = await getPlayerRecentStats(player.id, 'pitching', 3);

            // Get the player's team info to determine games played
            const playerTeamInfo = await getPlayerTeam(player.id);

            // Fetch all players' stats
            const allHittingPlayersData = await fetchAllPlayerStats('hitting', 2025);
            const allPitchingPlayersData = await fetchAllPlayerStats('pitching', 2025);

            // Fetch team standings to get games played for each team
            const teamStandings = await fetchTeamStandings(2025);

            // Filter qualified players and display player info
            displayPlayerInfo(
                playerDetails,
                playerHittingStats,
                allHittingPlayersData,
                playerPitchingStats,
                allPitchingPlayersData,
                playerTeamInfo,
                teamStandings,
                recentHittingStats,
                recentPitchingStats
            );

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

    async function getPlayerRecentStats(playerId, group = 'hitting', games = 7) {
        try {
            // For hitting: last 7 games; For pitching: last 3 games
            const gamesToFetch = group === 'hitting' ? 7 : 3;

            const response = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&group=${group}&season=2025&gameType=R&limit=${gamesToFetch}`);
            if (!response.ok) throw new Error(`Failed to get player recent ${group} stats`);
            const data = await response.json();

            // Get the game log splits (most recent games first)
            const recentGames = data.stats[0]?.splits || [];

            if (recentGames.length === 0) {
                return {
                    stats: {},
                    gamesCount: 0
                };
            }

            // Aggregate stats across the recent games
            const aggregatedStats = {};

            if (group === 'hitting') {
                // Initialize hitting stats
                let atBats = 0;
                let hits = 0;

                // Sum up stats from recent games
                recentGames.forEach(game => {
                    atBats += parseInt(game.stat.atBats || 0);
                    hits += parseInt(game.stat.hits || 0);
                });

                // Calculate batting average
                const avg = atBats > 0 ? hits / atBats : 0;

                aggregatedStats.avg = avg;
                aggregatedStats.atBats = atBats;
                aggregatedStats.hits = hits;
            } else {
                // Initialize pitching stats
                let earnedRuns = 0;
                let inningsPitched = 0;

                // Sum up stats from recent games
                recentGames.forEach(game => {
                    earnedRuns += parseInt(game.stat.earnedRuns || 0);

                    // Parse innings pitched (handle fractional innings)
                    const ipString = game.stat.inningsPitched || "0";
                    let innings = 0;

                    if (ipString.includes('.')) {
                        const [fullInnings, partialInnings] = ipString.split('.');
                        innings = parseInt(fullInnings) + (parseInt(partialInnings) / 3); // Convert .1 to 1/3, .2 to 2/3
                    } else {
                        innings = parseInt(ipString);
                    }

                    inningsPitched += innings;
                });

                // Calculate ERA (earned runs average)
                const era = inningsPitched > 0 ? (earnedRuns / inningsPitched) * 9 : 0;

                aggregatedStats.era = era;
                aggregatedStats.inningsPitched = inningsPitched;
                aggregatedStats.earnedRuns = earnedRuns;
            }

            return {
                stats: aggregatedStats,
                gamesCount: recentGames.length
            };
        } catch (error) {
            console.error('Error fetching recent stats:', error);
            return {
                stats: {},
                gamesCount: 0
            };
        }
    }

    async function getPlayerTeam(playerId) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=currentTeam`);
            if (!response.ok) throw new Error('Failed to get player team info');
            const data = await response.json();
            return data.people[0]?.currentTeam || null;
        } catch (error) {
            console.error('Error fetching player team:', error);
            return null;
        }
    }

    async function fetchTeamStandings(year = 2025) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${year}`);
            if (!response.ok) throw new Error(`Failed to fetch team standings for ${year}`);
            const data = await response.json();

            // Create a map of teamId -> gamesPlayed
            const teamGamesMap = {};
            data.records.forEach(record => {
                record.teamRecords.forEach(teamRecord => {
                    teamGamesMap[teamRecord.team.id] = teamRecord.gamesPlayed;
                });
            });

            return teamGamesMap;
        } catch (error) {
            console.error('Error fetching team standings:', error);
            return {};
        }
    }

    async function fetchAllPlayerStats(group, year = 2025) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=${group}&sportId=1&season=${year}&limit=200`);
            if (!response.ok) throw new Error(`Failed to fetch all ${group} stats for ${year}`);
            const data = await response.json();
            return data.stats[0]?.splits?.map(split => ({
                id: split.player.id,
                team: split.team,
                stats: split.stat,
                player: split.player
            })) || [];
        } catch (error) {
            console.error(`Error fetching all ${group} stats:`, error);
            return [];
        }
    }

   // Function to determine if a player is qualified based on PA/IP threshold
    function isQualifiedPlayer(playerStats, teamGamesPlayed, isPitcher, isReliefPitcher = false) {
        if (!teamGamesPlayed || teamGamesPlayed <= 0) {
            return false;
        }

        if (isPitcher) {
            const inningsPitched = parseFloat(playerStats.inningsPitched || 0);
            // Lowering thresholds to include more pitchers
            // Relief: from 0.297 to 0.2 (approx 32 IP/season)
            // Starter: from 1.0 to 0.75 (approx 121 IP/season)
            const threshold = isReliefPitcher ? 0.20 : 0.75; // Adjusted thresholds
            return (inningsPitched / teamGamesPlayed) >= threshold;
        } else {
            const plateAppearances = parseInt(playerStats.plateAppearances || 0);
            // Lowering threshold to include more batters
            // From 3.1 to 2.0 (approx 324 PA/season)
            return (plateAppearances / teamGamesPlayed) >= 2.0; // Adjusted threshold
        }
    }

    // Function to filter all players to only qualified ones
    function filterQualifiedPlayers(allPlayersData, teamStandings, isPitcher) {
        return allPlayersData.filter(playerData => {
            const teamId = playerData.team?.id;
            if (!teamId || !teamStandings[teamId]) {
                return false;
            }

            const teamGamesPlayed = teamStandings[teamId];
            const isReliefPitcher = isPitcher && (playerData.stats.gamesStarted || 0) < ((playerData.stats.gamesPlayed || 0) / 2);

            return isQualifiedPlayer(playerData.stats, teamGamesPlayed, isPitcher, isReliefPitcher);
        });
    }

    function calculatePlayerPercentile(playerValue, qualifiedPlayersValues, higherIsBetter = true) {
        const validValues = qualifiedPlayersValues.filter(value => typeof value === 'number' && !isNaN(value));
        if (validValues.length === 0) return 50;

        const sortedValues = [...validValues].sort((a, b) => a - b);
        let position = sortedValues.findIndex(value => value >= playerValue);

        // If the exact value isn't found, the player would be after all smaller values
        if (position === -1) {
            position = sortedValues.length;
        }

        const totalPlayers = sortedValues.length;

        if (totalPlayers > 1) {
            const rawPercentile = (position / totalPlayers) * 100;
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

    function displayPlayerInfo(player, hittingStats, allHittingData, pitchingStats, allPitchingData, playerTeam, teamStandings, recentHittingStats, recentPitchingStats) {
        playerNameElement.textContent = `${player.firstName} ${player.lastName}`;
        playerPositionElement.textContent = player.primaryPosition?.name || 'Position Unknown';
        playerImageDiv.innerHTML = `<img src="https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_150,h_150,c_fill,q_auto:best/v1/people/${player.id}/headshot/67/current" alt="${player.fullName}" onerror="this.onerror=null; this.src='assets/mlb_logo.svg'">`;

        statsContainer.innerHTML = '';
        const isPitcher = player.primaryPosition?.type === 'Pitcher';
        const currentStats = isPitcher ? pitchingStats : hittingStats;
        const isReliefPitcher = isPitcher && (currentStats.gamesStarted || 0) < ((currentStats.gamesPlayed || 0) / 2);


        // Get the player's team games played
        const teamGamesPlayed = playerTeam && teamStandings[playerTeam.id] ? teamStandings[playerTeam.id] : 0;

        // Determine if the player is qualified
        const isQualified = isQualifiedPlayer(currentStats, teamGamesPlayed, isPitcher, isReliefPitcher);

        // Filter all players to only qualified ones for percentile calculation
        const qualifiedPlayers = filterQualifiedPlayers(
            isPitcher ? allPitchingData : allHittingData,
            teamStandings,
            isPitcher
        );

        // Stats configuration based on player type
        const statConfigList = isPitcher ? getPitchingStatConfig() : getHittingStatConfig();

        // Display qualification status
        const qualificationStatus = document.createElement('div');
        qualificationStatus.className = 'qualification-status';
        qualificationStatus.style.marginBottom = '15px';
        qualificationStatus.style.padding = '8px';
        qualificationStatus.style.borderRadius = '4px';
        qualificationStatus.style.textAlign = 'center';
        qualificationStatus.style.fontSize = '1.3em';

        if (isQualified) {
            qualificationStatus.textContent = `✓ Qualified (${qualifiedPlayers.length} qualified ${isPitcher ? 'pitchers' : 'batters'})`;
            qualificationStatus.style.backgroundColor = '#e8f5e9';
            qualificationStatus.style.color = '#2e7d32';
        } else {
            const threshold = isPitcher ? (isReliefPitcher ? '0.297' : '1.0') : '3.1';
            const actual = isPitcher
                ? ((parseFloat(currentStats.inningsPitched) || 0) / teamGamesPlayed).toFixed(2)
                : ((parseInt(currentStats.plateAppearances) || 0) / teamGamesPlayed).toFixed(2);

            qualificationStatus.textContent = `✗ Not Qualified (${actual}/${threshold} ${isPitcher ? 'IP' : 'PA'} per team game)`;
            qualificationStatus.style.backgroundColor = '#ffebee';
            qualificationStatus.style.color = '#c62828';
        }

        statsContainer.appendChild(qualificationStatus);

        // Display recent performance (hot/cold) indicator
        const recentPerformance = document.createElement('div');
        recentPerformance.className = 'recent-performance';
        recentPerformance.style.marginBottom = '15px';
        recentPerformance.style.padding = '8px';
        recentPerformance.style.borderRadius = '4px';
        recentPerformance.style.display = 'flex';
        recentPerformance.style.alignItems = 'center';
        recentPerformance.style.justifyContent = 'center';
        recentPerformance.style.gap = '5px';
        recentPerformance.style.fontSize = '1.3em';

       // Show recent performance based on player type
        if (isPitcher) {
            const recentERA = recentPitchingStats.stats.era;
            const seasonERA = parseFloat(pitchingStats.era || 0);
            const gamesCount = recentPitchingStats.gamesCount;

            if (gamesCount > 0 && !isNaN(recentERA) && recentPitchingStats.stats.inningsPitched > 0) { // Ensure there are innings to calculate ERA
                const recentERADisplay = recentERA.toFixed(2);

                let indicator, color, bgColor;

                // Pitcher: Hot (<3.00 ERA), Steady (3.00-3.90 ERA), Cold (>3.90 ERA)
                if (recentERA < 3.00) {
                    indicator = '🔥 HOT';
                    color = '#d32f2f'; // Red for hot (good for pitchers)
                    bgColor = '#ffebee';
                } else if (recentERA >= 3.00 && recentERA <= 3.90) {
                    indicator = '⚖️ STEADY';
                    color = '#616161'; // Gray for steady
                    bgColor = '#f5f5f5';
                } else {
                    indicator = '❄️ COLD';
                    color = '#1976d2'; // Blue for cold (bad for pitchers)
                    bgColor = '#e3f2fd';
                }

                recentPerformance.style.backgroundColor = bgColor;
                recentPerformance.style.color = color;

                recentPerformance.innerHTML = `
                    <span style="font-weight: bold;">${indicator}:</span>
                    <span>ERA in last ${gamesCount} games: ${recentERADisplay}</span>
                `;

                statsContainer.appendChild(recentPerformance);
            }
        } else {
            const recentAVG = recentHittingStats.stats.avg;
            const seasonAVG = parseFloat(hittingStats.avg || 0);
            const gamesCount = recentHittingStats.gamesCount;

            if (gamesCount > 0 && !isNaN(recentAVG) && recentHittingStats.stats.atBats > 0) {
                const recentAVGDisplay = recentAVG.toFixed(3).replace(/^0+/, '');

                let indicator, color, bgColor;

                // Batter: Hot (>0.285 AVG), Steady (0.225-0.285 AVG), Cold (<0.225 AVG)
                if (recentAVG > 0.285) {
                    indicator = '🔥 HOT';
                    color = '#d32f2f'; // Red for hot (good for hitters)
                    bgColor = '#ffebee';
                } else if (recentAVG >= 0.225 && recentAVG <= 0.285) {
                    indicator = '⚖️ STEADY';
                    color = '#616161'; // Gray for steady
                    bgColor = '#f5f5f5';
                } else {
                    indicator = '❄️ COLD';
                    color = '#1976d2'; // Blue for cold (bad for hitters)
                    bgColor = '#e3f2fd';
                }

                recentPerformance.style.backgroundColor = bgColor;
                recentPerformance.style.color = color;

                recentPerformance.innerHTML = `
                    <span style="font-weight: bold;">${indicator}:</span>
                    <span>AVG in last ${gamesCount} games: ${recentAVGDisplay}</span>
                `;

                statsContainer.appendChild(recentPerformance);
            }
        }

        // Create container for stats display
        const statsDisplay = document.createElement('div');
        statsContainer.appendChild(statsDisplay);

        statConfigList.forEach(statConfig => {
            if (currentStats.hasOwnProperty(statConfig.name)) {
                const statValue = parseFloat(currentStats[statConfig.name]);
                if (!isNaN(statValue)) {
                    // Extract values for this stat from qualified players only
                    const qualifiedValuesForStat = qualifiedPlayers
                        .map(p => parseFloat(p.stats[statConfig.name]))
                        .filter(value => !isNaN(value));

                    const higherIsBetter = isPitcher ? !statConfig.goodLow : statConfig.goodHigh;

                    // Calculate percentile only if player is qualified
                    let percentile = 50; // Default to middle if not qualified
                    if (isQualified) {
                        percentile = calculatePlayerPercentile(statValue, qualifiedValuesForStat, higherIsBetter);
                    }

                    const displayValue = statConfig.format ? statConfig.format(statValue) : statValue;
                    const sliderColor = getPercentileColor(percentile);

                    const statItem = document.createElement('div');
                    statItem.className = 'stat-item';

                    // If not qualified, apply muted styling
                    if (!isQualified) {
                        statItem.style.opacity = '0.7';
                    }

                    statItem.innerHTML = `
                        <div class="stat-name">${statConfig.display}</div>
                        <div class="stat-value">${displayValue}</div>
                        <div class="percentile-container">
                        </div>
                    `;
                    statsDisplay.appendChild(statItem);

                    const percentileContainer = statItem.querySelector('.percentile-container');

                    // Create percentile bar container (background)
                    const percentileBarContainer = document.createElement('div');
                    percentileBarContainer.classList.add('percentile-bar-container');
                    percentileBarContainer.style.backgroundColor = '#f0f0f0';
                    percentileBarContainer.style.height = '100%';
                    percentileBarContainer.style.borderRadius = '8px';
                    percentileBarContainer.style.width = '100%';
                    percentileBarContainer.style.position = 'relative';

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
                    percentileBar.style.transition = 'width 1.3s ease-out';

                    // Create percentile circle
                    const percentileCircle = document.createElement('div');
                    percentileCircle.classList.add('percentile-circle');

                    // Show percentile value or N/A for unqualified players
                    percentileCircle.textContent = isQualified ? Math.round(percentile) : 'N/A';

                    percentileCircle.style.position = 'absolute';
                    percentileCircle.style.top = '-6px';
                    percentileCircle.style.right = '-14px';
                    percentileCircle.style.backgroundColor = isQualified ? sliderColor : '#9e9e9e';
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
                    percentileCircle.style.transition = 'inherit';

                    // Attach circle to bar and bar to container
                    percentileBar.appendChild(percentileCircle);
                    percentileBarContainer.appendChild(percentileBar);
                    percentileContainer.appendChild(percentileBarContainer);
                }
            }
        });

        // Apply animation after all stats are added
        const animate = true;
        if (animate) {
            setTimeout(() => {
                const percentileBars = statsDisplay.querySelectorAll('.percentile-bar');

                // Animate all bars simultaneously
                percentileBars.forEach(bar => {
                    const percentileText = bar.querySelector('.percentile-circle').textContent;
                    if (percentileText !== 'N/A') {
                        const percentile = parseFloat(percentileText);
                        bar.style.width = `${percentile}%`;
                    } else {
                        // For non-qualified players, show a muted 50% bar
                        bar.style.width = '50%';
                        bar.style.opacity = '0.4';
                    }
                });
            }, 50);
        }

        if (statsDisplay.children.length === 0) {
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
            { name: 'plateAppearances', display: 'Plate Appearances', goodHigh: true },
        ];
    }

    function getPitchingStatConfig() {
        return [
            { name: 'era', display: 'ERA', format: (v) => parseFloat(v).toFixed(2), goodLow: true },
            { name: 'whip', display: 'WHIP', format: (v) => parseFloat(v).toFixed(3), goodLow: true },
            { name: 'wins', display: 'Wins', goodHigh: true },
            { name: 'losses', display: 'Losses', goodLow: true },
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
            { name: 'gamesPlayed', display: 'Games Played', goodHigh: true },
            { name: 'gamesStarted', display: 'Games Started', goodHigh: true },
        ];
    }
});