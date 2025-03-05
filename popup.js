document.addEventListener("DOMContentLoaded", async () => {
    const popupContainer = document.createElement("div");
    popupContainer.id = "popup-container";

    const gameInfo = document.createElement("div");
    gameInfo.id = "game-info";

    // Team elements
    const awayLogo = document.createElement("img");
    awayLogo.id = "away-logo";
    awayLogo.classList.add("team-logo");

    const awayRecord = document.createElement("p");
    awayRecord.id = "away-record";
    awayRecord.classList.add("team-record");

    const awayScore = document.createElement("p");
    awayScore.id = "away-score";
    awayScore.classList.add("team-score");

    const inningInfo = document.createElement("p");
    inningInfo.id = "inning-info";
    inningInfo.classList.add("inning");

    const homeScore = document.createElement("p");
    homeScore.id = "home-score";
    homeScore.classList.add("team-score");

    const homeLogo = document.createElement("img");
    homeLogo.id = "home-logo";
    homeLogo.classList.add("team-logo");

    const homeRecord = document.createElement("p");
    homeRecord.id = "home-record";
    homeRecord.classList.add("team-record");

    // Append elements in the correct order
    gameInfo.appendChild(awayLogo);
    gameInfo.appendChild(awayRecord);
    gameInfo.appendChild(awayScore);
    gameInfo.appendChild(inningInfo);
    gameInfo.appendChild(homeScore);
    gameInfo.appendChild(homeLogo);
    gameInfo.appendChild(homeRecord); 

    popupContainer.appendChild(gameInfo);

    // Create player info containers
    const awayPlayerInfo = document.createElement("div");
    awayPlayerInfo.id = "away-player-info";
    awayPlayerInfo.classList.add("player-info");

    const scorebugContainer = document.createElement("div");
    scorebugContainer.id = "scorebug";

    const homePlayerInfo = document.createElement("div");
    homePlayerInfo.id = "home-player-info";
    homePlayerInfo.classList.add("player-info");

    // Create player stat display area
    const awayPlayerStats = document.createElement("div");
    awayPlayerStats.id = "away-player-stats";
    awayPlayerInfo.appendChild(awayPlayerStats);

    const homePlayerStats = document.createElement("div");
    homePlayerStats.id = "home-player-stats";
    homePlayerInfo.appendChild(homePlayerStats);

    // Create container for all three elements with even spacing
    const gameplayInfoContainer = document.createElement("div");
    gameplayInfoContainer.id = "gameplay-info-container";
    
    // Create wrapper for scorebug to maintain centered alignment
    const scorebugWrapper = document.createElement("div");
    scorebugWrapper.id = "scorebug-wrapper";
    scorebugWrapper.appendChild(scorebugContainer);
    
    // Add all elements to the container with explicit spacing
    const leftSpacer = document.createElement("div");
    leftSpacer.className = "spacer";
    
    const rightSpacer = document.createElement("div");
    rightSpacer.className = "spacer";
    
    gameplayInfoContainer.appendChild(awayPlayerInfo);
    gameplayInfoContainer.appendChild(leftSpacer);
    gameplayInfoContainer.appendChild(scorebugWrapper);
    gameplayInfoContainer.appendChild(rightSpacer);
    gameplayInfoContainer.appendChild(homePlayerInfo);

    popupContainer.appendChild(gameplayInfoContainer);
    document.body.appendChild(popupContainer);

    // Add CSS for layout
    const styleElement = document.createElement("style");
    styleElement.textContent = `
        #gameplay-info-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 90%;
            margin-top: 15px;
            padding: 0 10px;
            margin-left: 30px;
        }

        #home-player-info {
            margin-left: 25px;
        }
        
        #scorebug-wrapper {
            flex: 2;
            display: flex;
            justify-content: center;
        }
        
        .player-info {
            flex: 1;
            padding: 8px;
            background-color: transparent;
            border-radius: 5px;
            max-width: 150px;
            min-width: 120px;
        }
        
        .spacer {
            flex: 0.5;
        }
        
        .player-name {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .player-position {
            font-style: italic;
            margin-bottom: 5px;
            color: #555;
            font-size: 12px;
        }
        
        .player-stat {
            margin: 2px 0;
            font-size: 12px;
        }
    `;
    document.head.appendChild(styleElement);

    // Extract gamePk from the URL
    const params = new URLSearchParams(window.location.search);
    const gamePk = params.get("gamePk");

    if (gamePk) {
        fetchGameDetails(gamePk);
        fetchGameData(gamePk);
    }

    function formatGameTime(gameDate) {
        const dateTime = new Date(gameDate);
        const hours = dateTime.getHours();
        const minutes = dateTime.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        return `${(hours % 12) || 12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    }

    async function fetchGameDetails(gamePk) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const data = await response.json();

            if (data && data.gameData && data.liveData) {
                const game = data.gameData;
                const linescore = data.liveData.linescore;

                // Team details
                const awayTeam = game.teams.away;
                const homeTeam = game.teams.home;
                const awayScoreText = linescore.teams.away.runs || 0;
                const homeScoreText = linescore.teams.home.runs || 0;

                // Game status handling
                let gameStatusText = game.status.detailedState;
                let inningText = "";
                let inningBoxStyle = "";

                if (gameStatusText === "Suspended: Rain") {
                    inningText = "SUSPENDED";
                    inningBoxStyle = "color: red;";
                } else if (gameStatusText === "Final" || gameStatusText === "Game Over") {
                    inningText = "FINAL";
                    inningBoxStyle = "color: red;";
                } else if (gameStatusText === "Pre-Game" || gameStatusText === "Scheduled") {
                    inningText = formatGameTime(game.datetime.dateTime);
                    inningBoxStyle = "color: red;";
                } else {
                    const inningHalf = linescore.inningHalf ? (linescore.inningHalf === "Top" ? "TOP" : "BOT") : "";
                    const currentInning = linescore.currentInning || "";
                    inningText = `${inningHalf} ${currentInning}`;
                }

                // Set values to HTML
                awayLogo.src = `assets/${awayTeam.id}.svg`;
                awayLogo.alt = awayTeam.name;
                awayScore.textContent = awayScoreText;
                awayRecord.textContent = `${data.gameData.teams.away.record.wins}-${data.gameData.teams.away.record.losses}`;  // ✅ Correct way

                inningInfo.textContent = inningText;
                inningInfo.style = inningBoxStyle;

                homeScore.textContent = homeScoreText;
                homeLogo.src = `assets/${homeTeam.id}.svg`;
                homeLogo.alt = homeTeam.name;
                homeRecord.textContent = `${data.gameData.teams.home.record.wins}-${data.gameData.teams.home.record.losses}`;  // ✅ Correct way
                
                // Display current players (hitter/pitcher)
                updatePlayerInfo(data);
            } else {
                inningInfo.textContent = "Game data unavailable.";
            }
        } catch (error) {
            console.error("Error fetching game details:", error);
            inningInfo.textContent = "Error loading game details.";
        }
    }

    function updatePlayerInfo(data) {
        const currentPlay = data.liveData.plays.currentPlay;
        const gameState = data.gameData.status.detailedState;
        const inningState = data.liveData.linescore.inningHalf;

        const awayBattingOrder = data.liveData.boxscore.teams.away.battingOrder;
        const homeBattingOrder = data.liveData.boxscore.teams.home.battingOrder;

        // Manually input all 9 batters so they are dynamically rendered - Away Batters
        const playerOne = awayBattingOrder[0] ? data.gameData.players[`ID${awayBattingOrder[0]}`]?.boxscoreName || '' : '';
        const playerTwo = awayBattingOrder[1] ? data.gameData.players[`ID${awayBattingOrder[1]}`]?.boxscoreName || '' : '';
        const playerThree = awayBattingOrder[2] ? data.gameData.players[`ID${awayBattingOrder[2]}`]?.boxscoreName || '' : '';
        const playerFour = awayBattingOrder[3] ? data.gameData.players[`ID${awayBattingOrder[3]}`]?.boxscoreName || '' : '';
        const playerFive = awayBattingOrder[4] ? data.gameData.players[`ID${awayBattingOrder[4]}`]?.boxscoreName || '' : '';
        const playerSix = awayBattingOrder[5] ? data.gameData.players[`ID${awayBattingOrder[5]}`]?.boxscoreName || '' : '';
        const playerSeven = awayBattingOrder[6] ? data.gameData.players[`ID${awayBattingOrder[6]}`]?.boxscoreName || '' : '';
        const playerEight = awayBattingOrder[7] ? data.gameData.players[`ID${awayBattingOrder[7]}`]?.boxscoreName || '' : '';
        const playerNine = awayBattingOrder[8] ? data.gameData.players[`ID${awayBattingOrder[8]}`]?.boxscoreName || '' : '';

        // Now do the same for the Home Team Batting Order
        const homeOne = homeBattingOrder[0] ? data.gameData.players[`ID${homeBattingOrder[0]}`]?.boxscoreName || '' : '';
        const homeTwo = homeBattingOrder[1] ? data.gameData.players[`ID${homeBattingOrder[1]}`]?.boxscoreName || '' : '';
        const homeThree = homeBattingOrder[2] ? data.gameData.players[`ID${homeBattingOrder[2]}`]?.boxscoreName || '' : '';
        const homeFour = homeBattingOrder[3] ? data.gameData.players[`ID${homeBattingOrder[3]}`]?.boxscoreName || '' : '';
        const homeFive = homeBattingOrder[4] ? data.gameData.players[`ID${homeBattingOrder[4]}`]?.boxscoreName || '' : '';
        const homeSix = homeBattingOrder[5] ? data.gameData.players[`ID${homeBattingOrder[5]}`]?.boxscoreName || '' : '';
        const homeSeven = homeBattingOrder[6] ? data.gameData.players[`ID${homeBattingOrder[6]}`]?.boxscoreName || '' : '';
        const homeEight = homeBattingOrder[7] ? data.gameData.players[`ID${homeBattingOrder[7]}`]?.boxscoreName || '' : '';
        const homeNine = homeBattingOrder[8] ? data.gameData.players[`ID${homeBattingOrder[8]}`]?.boxscoreName || '' : '';

        // Example async/await fetch function and render
        async function fetchDataAndRender() {
            const data = await fetchData(); // Assuming fetchData is defined elsewhere
            renderBattingOrders(data);
        }

        // Bat Side for the Away Team
        const awayHandOne = playerOne ? data.gameData.players[`ID${awayBattingOrder[0]}`]?.batSide?.code : '';
        const awayHandTwo = playerTwo ? data.gameData.players[`ID${awayBattingOrder[1]}`]?.batSide?.code : '';
        const awayHandThree = playerThree ? data.gameData.players[`ID${awayBattingOrder[2]}`]?.batSide?.code : '';
        const awayHandFour = playerFour ? data.gameData.players[`ID${awayBattingOrder[3]}`]?.batSide?.code : '';
        const awayHandFive = playerFive ? data.gameData.players[`ID${awayBattingOrder[4]}`]?.batSide?.code : '';
        const awayHandSix = playerSix ? data.gameData.players[`ID${awayBattingOrder[5]}`]?.batSide?.code : '';
        const awayHandSeven = playerSeven ? data.gameData.players[`ID${awayBattingOrder[6]}`]?.batSide?.code : '';
        const awayHandEight = playerEight ? data.gameData.players[`ID${awayBattingOrder[7]}`]?.batSide?.code : '';
        const awayHandNine = playerNine ? data.gameData.players[`ID${awayBattingOrder[8]}`]?.batSide?.code : '';

        // Bat Side for the Home Team 
        const homeHandOne = homeOne ? data.gameData.players[`ID${homeBattingOrder[0]}`]?.batSide?.code : '';
        const homeHandTwo = homeTwo ? data.gameData.players[`ID${homeBattingOrder[1]}`]?.batSide?.code : '';
        const homeHandThree = homeThree ? data.gameData.players[`ID${homeBattingOrder[2]}`]?.batSide?.code : '';
        const homeHandFour = homeFour ? data.gameData.players[`ID${homeBattingOrder[3]}`]?.batSide?.code : '';
        const homeHandFive = homeFive ? data.gameData.players[`ID${homeBattingOrder[4]}`]?.batSide?.code : '';
        const homeHandSix = homeSix ? data.gameData.players[`ID${homeBattingOrder[5]}`]?.batSide?.code : '';
        const homeHandSeven = homeSeven ? data.gameData.players[`ID${homeBattingOrder[6]}`]?.batSide?.code : '';
        const homeHandEight = homeEight ? data.gameData.players[`ID${homeBattingOrder[7]}`]?.batSide?.code : '';
        const homeHandNine = homeNine ? data.gameData.players[`ID${homeBattingOrder[8]}`]?.batSide?.code : '';

        // Position abbreviation for Away Lineup 
        const awayFieldOne = playerOne ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[0]}`]?.position.abbreviation : '';
        const awayFieldTwo = playerTwo ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[1]}`]?.position.abbreviation : '';
        const awayFieldThree = playerThree ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[2]}`]?.position.abbreviation : '';
        const awayFieldFour = playerFour ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[3]}`]?.position.abbreviation : '';
        const awayFieldFive = playerFive ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[4]}`]?.position.abbreviation : '';
        const awayFieldSix = playerSix ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[5]}`]?.position.abbreviation : '';
        const awayFieldSeven = playerSeven ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[6]}`]?.position.abbreviation : '';
        const awayFieldEight = playerEight ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[7]}`]?.position.abbreviation : '';
        const awayFieldNine = playerNine ? data.liveData.boxscore.teams.away.players[`ID${awayBattingOrder[8]}`]?.position.abbreviation : '';

        // Position abbreviation for Home Lineup 
        const homeFieldOne = homeOne ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[0]}`]?.position.abbreviation : '';
        const homeFieldTwo = homeTwo ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[1]}`]?.position.abbreviation : '';
        const homeFieldThree = homeThree ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[2]}`]?.position.abbreviation : '';
        const homeFieldFour = homeFour ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[3]}`]?.position.abbreviation : '';
        const homeFieldFive = homeFive ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[4]}`]?.position.abbreviation : '';
        const homeFieldSix = homeSix ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[5]}`]?.position.abbreviation : '';
        const homeFieldSeven = homeSeven ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[6]}`]?.position.abbreviation : '';
        const homeFieldEight = homeEight ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[7]}`]?.position.abbreviation : '';
        const homeFieldNine = homeNine ? data.liveData.boxscore.teams.home.players[`ID${homeBattingOrder[8]}`]?.position.abbreviation : '';
        
        // Clear previous player info
        const awayPlayerStats = document.getElementById("away-player-stats");
        const homePlayerStats = document.getElementById("home-player-stats");
        
        awayPlayerStats.innerHTML = "";
        homePlayerStats.innerHTML = "";
        
        if (gameState === "Final" || gameState === "Game Over") {
            awayPlayerStats.innerHTML = "<p>Game Finished</p>";
            homePlayerStats.innerHTML = "<p>Game Finished</p>";
            return;
        }
        
        if (gameState === "Pre-Game" || gameState === "Scheduled") {
            document.getElementById("scorebug-wrapper").style.display = "none";

            // Display probable pitchers
            if (data.gameData.probablePitchers) {
                const awayPitcher = data.gameData.probablePitchers.away;
                const homePitcher = data.gameData.probablePitchers.home;

                
                if (awayPitcher) {
                    awayPlayerStats.innerHTML = `
                        <p class="player-name">${awayPitcher.fullName}</p>
                        <p class="player-position">Probable Pitcher</p>
                        <p class="lineup">1. <span class="hand">${awayHandOne}</span> ${playerOne} <span class="field">${awayFieldOne}</span></p>
                        <p class="lineup">2. <span class="hand">${awayHandTwo}</span> ${playerTwo} <span class="field">${awayFieldTwo}</span></p>
                        <p class="lineup">3. <span class="hand">${awayHandThree}</span> ${playerThree} <span class="field">${awayFieldThree}</span></p>
                        <p class="lineup">4. <span class="hand">${awayHandFour}</span> ${playerFour} <span class="field">${awayFieldFour}</span></p>
                        <p class="lineup">5. <span class="hand">${awayHandFive}</span> ${playerFive} <span class="field">${awayFieldFive}</span></p>
                        <p class="lineup">6. <span class="hand">${awayHandSix}</span> ${playerSix} <span class="field">${awayFieldSix}</span></p>
                        <p class="lineup">7. <span class="hand">${awayHandSeven}</span> ${playerSeven} <span class="field">${awayFieldSeven}</span></p>
                        <p class="lineup">8. <span class="hand">${awayHandEight}</span> ${playerEight} <span class="field">${awayFieldEight}</span></p>
                        <p class="lineup">9. <span class="hand">${awayHandNine}</span> ${playerNine} <span class="field">${awayFieldNine}</span></p>
                    `;
                }
                
                if (homePitcher) {
                    homePlayerStats.innerHTML = `
                        <p class="player-name">${homePitcher.fullName}</p>
                        <p class="player-position">Probable Pitcher</p>
                        <p class="lineup">1. <span class="hand">${homeHandOne}</span> ${homeOne} <span class="field">${homeFieldOne}</span></p>
                        <p class="lineup">2. <span class="hand">${homeHandTwo}</span> ${homeTwo} <span class="field">${homeFieldTwo}</span></p>
                        <p class="lineup">3. <span class="hand">${homeHandThree}</span> ${homeThree} <span class="field">${homeFieldThree}</span></p>
                        <p class="lineup">4. <span class="hand">${homeHandFour}</span> ${homeFour} <span class="field">${homeFieldFour}</span></p>
                        <p class="lineup">5. <span class="hand">${homeHandFive}</span> ${homeFive} <span class="field">${homeFieldFive}</span></p>
                        <p class="lineup">6. <span class="hand">${homeHandSix}</span> ${homeSix} <span class="field">${homeFieldSix}</span></p>
                        <p class="lineup">7. <span class="hand">${homeHandSeven}</span> ${homeSeven} <span class="field">${homeFieldSeven}</span></p>
                        <p class="lineup">8. <span class="hand">${homeHandEight}</span> ${homeEight} <span class="field">${homeFieldEight}</span></p>
                        <p class="lineup">9. <span class="hand">${homeHandNine}</span> ${homeNine} <span class="field">${homeFieldNine}</span></p>
                    `;
                }
            }
            return;
        }

        // For in-progress games
        if (currentPlay) {
            const matchup = currentPlay.matchup;
            
            if (matchup) {
                const batter = matchup.batter;
                const pitcher = matchup.pitcher;
                
                // Check if it's top or bottom of inning to determine home/away
                if (inningState === "Top") {
                    // Away team batting, home team pitching
                    // Away batter info
                    if (batter) {
                        const batterId = batter.id;
                        const batterStats = batterId ? data.liveData.boxscore.teams.away.players[`ID${batterId}`]?.seasonStats.batting : null;  
                        
                        awayPlayerStats.innerHTML = `
                        <p class="player-name">${batter.fullName}</p>
                        <p class="player-position">Batter</p>
                        <p class="player-stat">AVG: ${batterStats?.avg || '---'}</p>
                        <p class="player-stat">OPS: ${batterStats?.ops || '0'}</p>
                        <p class="player-stat">HR: ${batterStats?.homeRuns || '---'}</p>
                    `;
                    }
                    
                    // Home pitcher info
                    if (pitcher) {
                        const pitcherId = pitcher.id;
                        const pitcherStats = pitcherId ? data.liveData.boxscore.teams.home.players[`ID${pitcherId}`]?.seasonStats.pitching : null;
                        
                        homePlayerStats.innerHTML = `
                        <p class="player-name">${pitcher.fullName}</p>
                        <p class="player-position">Pitcher</p>
                        <p class="player-stat">ERA: ${pitcherStats?.era || '---'}</p>
                        <p class="player-stat">IP: ${pitcherStats?.inningsPitched || '0'}</p>
                        <p class="player-stat">K: ${pitcherStats?.strikeOuts || '0'}</p>
                    `;
                    }
                } else if (inningState === "Bottom") {
                    // Home team batting, away team pitching
                    // Away pitcher info
                    if (pitcher) {
                        const pitcherId = pitcher.id;
                        const pitcherStats = pitcherId ? data.liveData.boxscore.teams.away.players[`ID${pitcherId}`]?.seasonStats.pitching : null;
                        
                        awayPlayerStats.innerHTML = `
                            <p class="player-name">${pitcher.fullName}</p>
                            <p class="player-position">Pitcher</p>
                            <p class="player-stat">ERA: ${pitcherStats?.era || '---'}</p>
                            <p class="player-stat">IP: ${pitcherStats?.inningsPitched || '0'}</p>
                            <p class="player-stat">K: ${pitcherStats?.strikeOuts || '0'}</p>
                        `;
                    }
                    
                    // Home batter info
                    if (batter) {
                        const batterId = batter.id;
                        const batterStats = batterId ? data.liveData.boxscore.teams.home.players[`ID${batterId}`]?.seasonStats.batting : null;  
                        
                        homePlayerStats.innerHTML = `
                            <p class="player-name">${batter.fullName}</p>
                            <p class="player-position">Batter</p>
                            <p class="player-stat">AVG: ${batterStats?.avg || '---'}</p>
                            <p class="player-stat">OPS: ${batterStats?.ops || '0'}</p>
                            <p class="player-stat">HR: ${batterStats?.homeRuns || '---'}</p>
                        `;
                    }
                }
            }
        }

        var newContent = `
            <div>
                <p>HELP ME I SUCK!</p>
            </div>
        `
    }

    async function fetchGameData(gamePk) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const data = await response.json();
            updateScorebug(data);
            updatePlayerInfo(data);  // Update player info when refreshing data
            renderLivePitchData(data); // Update pitch data when refreshing data
        } catch (error) {
            console.error("Error fetching game data:", error);
        }
    }
    

    function updateScorebug(data) {
        const currentPlay = data.liveData.plays.currentPlay;
        let count = currentPlay.count || { balls: 0, strikes: 0, outs: 0 };

        // Reset balls and strikes at the end of a plate appearance
        if (data.gameData.status.detailedState === "Final" || data.gameData.status.detailedState === "Pre-Game" || data.gameData.status.detailedState === "Scheduled" || currentPlay.result.eventType === "strikeout" || currentPlay.result.eventType === "walk" || currentPlay.result.eventType === "hit" || currentPlay.result.eventType === "field_out") {
            count = { balls: 0, strikes: 0, outs: count.outs };
        }
        
        const onBase = data.liveData.linescore.offense || {};

        scorebugContainer.innerHTML = `
            <div class="scorebug">
                ${generateSVGField(count, onBase)}
                <div class="balls-strikes" id="count" style="color: #2f4858;">
                    ${count.balls} - ${count.strikes}
                </div>
            </div>
        `;

        updateSVG(count, onBase);
    }

    function renderLivePitchData(data) {
        // Check if game is live
        const gameState = data.gameData.status.abstractGameState;
        if (gameState !== "Live" && gameState !== "In Progress") return;
        
        // Remove any existing pitch data display
        const existingPitchData = document.getElementById("pitch-data-section");
        if (existingPitchData) {
            existingPitchData.remove();
        }
        
        // Create pitch data section
        const pitchDataSection = document.createElement("div");
        pitchDataSection.id = "pitch-data-section";
        
        // Create separator line
        const separator = document.createElement("hr");
        separator.classList.add("separator-line");
        pitchDataSection.appendChild(separator);
        
        // Create pitch data container that will display in a single row
        const pitchDataContainer = document.createElement("div");
        pitchDataContainer.id = "pitch-data-container";
        
        // Get last pitch data
        const allPlays = data.liveData.plays.allPlays;
        const lastPlay = allPlays[allPlays.length - 1];
        
        if (!lastPlay || !lastPlay.pitchIndex || !lastPlay.pitchIndex.length) return; // No pitch data available
        
        const lastPitchIndex = lastPlay.pitchIndex[lastPlay.pitchIndex.length - 1];
        const pitchDetails = lastPlay.playEvents[lastPitchIndex];
        
        // Get pitcher details
        const pitcher = data.liveData.plays.currentPlay.matchup.pitcher;
        
        // Extract relevant data
        const pitcherName = `${pitcher.fullName.split(" ")[0][0]}. ${pitcher.fullName.split(" ")[1]}`;
        const pitchType = pitchDetails.details.type.description || "Unknown";
        const pitchVelocity = pitchDetails.pitchData.startSpeed ? `${pitchDetails.pitchData.startSpeed.toFixed(1)} MPH` : "N/A";
        const spinRate = pitchDetails.pitchData.breaks ? `${pitchDetails.pitchData.breaks.spinRate} RPM` : "N/A";
        
        // Set content in a single row format
        pitchDataContainer.innerHTML = `
            <span class="pitch-info"><strong>Pitcher:</strong> ${pitcherName}</span>
            <span class="pitch-info"><strong>Pitch:</strong> ${pitchType}</span>
            <span class="pitch-info"><strong>Velocity:</strong> ${pitchVelocity}</span>
            <span class="pitch-info"><strong>Spin:</strong> ${spinRate}</span>
        `;
        
        pitchDataSection.appendChild(pitchDataContainer);
        
        // Insert after gameplay-info-container
        const gameplayInfoContainer = document.getElementById("gameplay-info-container");
        gameplayInfoContainer.parentNode.insertBefore(pitchDataSection, gameplayInfoContainer.nextSibling);
    }

    function generateSVGField(count, onBase) {
        return `
            <svg id="field" width="100" height="100" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg" style="background: #e5decf;">
                <circle id="out-1" cx="13" cy="61" r="6" fill="${count.outs >= 1 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
                <circle id="out-2" cx="30" cy="61" r="6" fill="${count.outs >= 2 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
                <circle id="out-3" cx="47" cy="61" r="6" fill="${count.outs >= 3 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
                
                <rect id="third-base" x="17.6066" y="29.7071" width="14" height="14" transform="rotate(45 17.6066 29.7071)" fill="${onBase.third ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
                <rect id="second-base" x="29.364" y="17.7071" width="14" height="14" transform="rotate(45 29.364 17.7071)" fill="${onBase.second ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
                <rect id="first-base" x="41.6066" y="29.7071" width="14" height="14" transform="rotate(45 41.6066 29.7071)" fill="${onBase.first ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            </svg>
        `;
    }

    function updateSVG(count, onBase) {
        console.log('Updating SVG:', count, onBase);

        for (let i = 1; i <= 3; i++) {
            const outCircle = document.getElementById(`out-${i}`);
            if (outCircle) {
                outCircle.style.fill = i <= count.outs ? '#000' : '#e5decf';
            }
        }

        document.getElementById('first-base').style.fill = onBase.first ? '#000' : '#e5decf';
        document.getElementById('second-base').style.fill = onBase.second ? '#000' : '#e5decf';
        document.getElementById('third-base').style.fill = onBase.third ? '#000' : '#e5decf';
    }
   
    setInterval(() => fetchGameData(gamePk), 15000); // Refresh every 15s
});

