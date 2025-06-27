document.addEventListener("DOMContentLoaded", async () => {
    const popupContainer = document.createElement("div");
    popupContainer.id = "popup-container";

    const gameInfo = document.createElement("div");
    gameInfo.id = "game-info";

    const awayTeamContainer = document.createElement("div");
    awayTeamContainer.classList.add("team-container");

    const awayLogo = document.createElement("img");
    awayLogo.id = "away-logo";
    awayLogo.classList.add("team-logo");

    const awayRecord = document.createElement("p");
    awayRecord.id = "away-record";
    awayRecord.classList.add("team-record");

    awayTeamContainer.appendChild(awayLogo);
    awayTeamContainer.appendChild(awayRecord);

    const gameStatusContainer = document.createElement("div");
    gameStatusContainer.classList.add("game-status");

    const awayScore = document.createElement("p");
    awayScore.id = "away-score";
    awayScore.classList.add("team-score");

    const homeScore = document.createElement("p");
    homeScore.id = "home-score";
    homeScore.classList.add("team-score");

    const inningInfo = document.createElement("p");
    inningInfo.id = "inning-info";
    inningInfo.classList.add("inning");

    const stadiumInfo = document.createElement("p");
    stadiumInfo.id = "stadium-info";
    stadiumInfo.classList.add("stadium");

    const centerElements = document.createElement("div");
    centerElements.id = "center-elements";
    centerElements.appendChild(inningInfo);
    centerElements.appendChild(stadiumInfo);

    gameStatusContainer.appendChild(awayScore);
    gameStatusContainer.appendChild(centerElements);
    gameStatusContainer.appendChild(homeScore);

    const homeTeamContainer = document.createElement("div");
    homeTeamContainer.classList.add("team-container");

    const homeLogo = document.createElement("img");
    homeLogo.id = "home-logo";
    homeLogo.classList.add("team-logo");

    const homeRecord = document.createElement("p");
    homeRecord.id = "home-record";
    homeRecord.classList.add("team-record");

    homeTeamContainer.appendChild(homeLogo);
    homeTeamContainer.appendChild(homeRecord);

    gameInfo.appendChild(awayTeamContainer);
    gameInfo.appendChild(gameStatusContainer);
    gameInfo.appendChild(homeTeamContainer);

    popupContainer.appendChild(gameInfo);

    const tabSection = document.createElement("div");
    tabSection.id = "tab-section";

    const tabsContainer = document.createElement("div");
    tabsContainer.id = "tabs-container";

    // These buttons will remain, but their functionality will change
    const dynamicTab = document.createElement("button"); // Use 'dynamicTab' as the variable name
    dynamicTab.id = "dynamic-tab"; // Assign ID to the correct variable
    dynamicTab.classList.add("tab-button", "active"); // No 'active' class by default, this will be set dynamically
    dynamicTab.textContent = "Loading..."; // Initial placeholder text
    
    const boxscoreTab = document.createElement("button");
    boxscoreTab.id = "boxscore-tab";
    boxscoreTab.classList.add("tab-button");
    boxscoreTab.textContent = "Box Score";

    const scoringPlaysTab = document.createElement("button");
    scoringPlaysTab.id = "scoring-plays-tab";
    scoringPlaysTab.classList.add("tab-button");
    scoringPlaysTab.textContent = "Scoring Plays";

    const allPlaysTab = document.createElement("button");
    allPlaysTab.id = "all-plays-tab";
    allPlaysTab.classList.add("tab-button");
    allPlaysTab.textContent = "All Plays";

    tabsContainer.appendChild(dynamicTab);
    tabsContainer.appendChild(boxscoreTab);
    tabsContainer.appendChild(scoringPlaysTab);
    tabsContainer.appendChild(allPlaysTab);
    tabSection.appendChild(tabsContainer);

    popupContainer.appendChild(tabSection);

    const awayPlayerInfo = document.createElement("div");
    awayPlayerInfo.id = "away-player-info";
    awayPlayerInfo.classList.add("player-info");

    const scorebugContainer = document.createElement("div");
    scorebugContainer.id = "scorebug";

    const homePlayerInfo = document.createElement("div");
    homePlayerInfo.id = "home-player-info";
    homePlayerInfo.classList.add("player-info");

    const awayPlayerStats = document.createElement("div");
    awayPlayerStats.id = "away-player-stats";
    awayPlayerInfo.appendChild(awayPlayerStats);

    const homePlayerStats = document.createElement("div");
    homePlayerStats.id = "home-player-stats";
    homePlayerInfo.appendChild(homePlayerStats);

    const gameplayInfoContainer = document.createElement("div");
    gameplayInfoContainer.id = "gameplay-info-container";

    const scorebugWrapper = document.createElement("div");
    scorebugWrapper.id = "scorebug-wrapper";
    scorebugWrapper.appendChild(scorebugContainer);

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

    // Add boxscore content container (starts hidden)
    const boxScoreContainer = document.createElement("div");
    boxScoreContainer.id = "boxscore-content";
    boxScoreContainer.style.display = "none"; // hidden by default
    boxScoreContainer.innerHTML = `<h1>Box Score Placeholder</h1>`;
    popupContainer.appendChild(boxScoreContainer);


    // Removed contentArea and loadingIndicator creation and appending

    document.body.appendChild(popupContainer);

// Store original display values
const originalDisplayValues = {};

function storeOriginalDisplay(elementId) {
    const element = document.getElementById(elementId);
    if (element && !originalDisplayValues[elementId]) {
        originalDisplayValues[elementId] = window.getComputedStyle(element).display;
    }
}

// Function to reapply current tab's visibility rules (call this after refreshes)
function reapplyTabVisibility() {
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab && activeTab.id === 'dynamic-tab') {
        toggleContainers(true);
    } else if (activeTab) {
        toggleContainers(false);
    }
}

// Visibility management function
function toggleContainers(showDynamic, isBoxscoreTab = false, isAllPlaysTab = false) {
    const gameInfoContainer = document.getElementById('game-info');
    const gameplayInfoContainer = document.getElementById('gameplay-info-container');
    const topPerformer = document.getElementById('top-performers');
    const pitchDataSection = document.getElementById('pitch-data-section');
    const boxScoreContainer = document.getElementById('boxscore-content');
    const allPlaysContainer = document.getElementById('all-plays-container');

    // Store original display values if not already stored
    ['game-info', 'gameplay-info-container', 'top-performers', 'pitch-data-section'].forEach(storeOriginalDisplay);

    if (showDynamic) {
        // Show dynamic containers
        if (gameInfoContainer) gameInfoContainer.style.display = originalDisplayValues['game-info'] || '';
        if (gameplayInfoContainer) gameplayInfoContainer.style.display = originalDisplayValues['gameplay-info-container'] || '';
        if (topPerformer) topPerformer.style.display = originalDisplayValues['top-performers'] || '';
        if (pitchDataSection) pitchDataSection.style.display = originalDisplayValues['pitch-data-section'] || '';
    } else {
        // Hide dynamic containers
        if (gameInfoContainer) gameInfoContainer.style.display = originalDisplayValues['game-info'] || '';
        if (gameplayInfoContainer) gameplayInfoContainer.style.display = 'none';
        if (topPerformer) topPerformer.style.display = 'none';
        if (pitchDataSection) pitchDataSection.style.display = 'none';
    }

    // Handle box score container
    if (boxScoreContainer) {
        boxScoreContainer.style.display = isBoxscoreTab ? 'block' : 'none';
    }
    
    // Handle all plays container
    if (allPlaysContainer) {
        allPlaysContainer.style.display = isAllPlaysTab ? 'block' : 'none';
    }
}

// Add these function definitions to your code

// Function to handle different tab content loading
function openGameDetailsPage(tabType) {
    console.log(`Loading ${tabType} content`);
    
    switch(tabType) {
        case 'live':
        case 'wrap':
        case 'pre-game':
            loadDynamicContent(tabType);
            break;
        case 'boxscore':
            loadBoxScore();
            break;
        case 'scoring-plays':
            loadScoringPlays();
            break;
        case 'all-plays':
            loadAllPlays();
            break;
        default:
            console.warn(`Unknown tab type: ${tabType}`);
    }
}

// Function for basic game info refresh (lighter than full refresh)
function fetchBasicGameInfo(gamePk) {
    // This should be a lighter version of your main fetchGameData function
    // Only update essential info like score, inning, game state
    console.log(`Fetching basic info for game ${gamePk}`);
    
    // Example - you'll need to implement based on your data source
    // This might call your API but only update specific DOM elements
    // without refreshing the entire content area
}

// Helper functions that openGameDetailsPage calls
function loadDynamicContent(tabType) {
    const boxScoreContainer = document.getElementById("boxscore-content");
    if (boxScoreContainer) boxScoreContainer.style.display = "none";
    console.log(`Loading dynamic content for ${tabType}`);
}

function loadScoringPlays() {
    // Load scoring plays data
    console.log('Loading scoring plays');
}

function loadAllPlays() {
    // Load all plays data
    console.log('Loading all plays');
}

// Event listeners for all tabs
dynamicTab.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    dynamicTab.classList.add('active');
    toggleContainers(true); // show dynamic, hide boxscore
    const currentDynamicTabType = dynamicTab.textContent.toLowerCase().replace(' ', '-');
    openGameDetailsPage(currentDynamicTabType);
});

boxscoreTab.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    boxscoreTab.classList.add('active');
    toggleContainers(false, true); // hide dynamic, show boxscore
    openGameDetailsPage('boxscore');
});

scoringPlaysTab.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    scoringPlaysTab.classList.add('active');
    toggleContainers(false); // hide dynamic & boxscore
    openGameDetailsPage('scoring-plays');
});

allPlaysTab.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    allPlaysTab.classList.add('active');
    toggleContainers(false, false, true); // hide dynamic, hide boxscore, show all-plays
    openGameDetailsPage('all-plays');
});


// Function to update dynamic tab based on game state
function updateDynamicTab(detailedState) {
    if (detailedState === 'In Progress') {
        dynamicTab.textContent = 'Live';
    } else if (detailedState === 'Final') {
        dynamicTab.textContent = 'Wrap';
    } else {
        dynamicTab.textContent = 'Pre-Game';
    }
    
    // If dynamic tab is active, refresh content
    if (dynamicTab.classList.contains('active')) {
        const currentDynamicTabType = dynamicTab.textContent.toLowerCase().replace(' ', '-');
        openGameDetailsPage(currentDynamicTabType);
    }
}

// Add this helper function to check if pitch data should be shown
function shouldShowPitchData() {
    const activeTab = document.querySelector('.tab-button.active');
    return activeTab && activeTab.id === 'dynamic-tab';
}

// Conditional refresh based on active tab
setInterval(() => {
    // Only run if gamePk is set
    if (!gamePk) {
        console.warn('gamePk not set, skipping refresh');
        return;
    }
    
    const activeTab = document.querySelector('.tab-button.active');
    
    if (activeTab && activeTab.id === 'dynamic-tab') {
        // Only refresh when dynamic tab is active
        if (typeof fetchGameData === 'function') {
            fetchGameData(gamePk);
        } else {
            console.warn('fetchGameData function not defined');
        }
    } else {
        // For other tabs, only refresh basic game info
        fetchBasicGameInfo(gamePk);
    }
}, 2000);

// Initialize - make sure dynamic tab shows all containers by default
toggleContainers(true);

    // Add CSS for layout
    const styleElement = document.createElement("style");
    styleElement.textContent = `
        #gameplay-info-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 0 10px;
            margin-left: 30px;
        }

        #away-player-stats {
            margin-left: 20px;
        }
        
        #scorebug-wrapper {
            flex: 2;
            display: flex;
            justify-content: center;
            width: 10%;
            padding-right: 30px;

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
            color: #D7827E;
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

    let gameRefreshInterval = null;
    let currentGamePk = null;

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

                // Check if game is live/in-progress
                const isLiveGame = !["Final", "Game Over", "Pre-Game", "Scheduled", "Suspended: Rain"].includes(gameStatusText);
    
                // --- START OF WHERE TO PUT YOUR TAB LOGIC ---
                const dynamicTab = document.getElementById("dynamic-tab"); // Ensure dynamicTab is accessible here

                if (gameStatusText === "Final" || gameStatusText === "Game Over") {
                dynamicTab.textContent = "Wrap"; // Or "Final Summary"
                    } else if (gameStatusText === "Pre-Game" || gameStatusText === "Scheduled") {
                dynamicTab.textContent = "Game Info";
                    } else if (gameStatusText === "Warmup" || gameStatusText === "Delayed" || gameStatusText === "Postponed" || gameStatusText === "Suspended") {
                dynamicTab.textContent = gameStatusText; // Show the specific status
                    } else {
                // For "In Progress", "Manager Challenge", etc.
                dynamicTab.textContent = "Live";
            }

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
                awayLogo.src = `https://www.mlbstatic.com/team-logos/${awayTeam.id}.svg`;
                awayLogo.alt = awayTeam.name;
                awayScore.textContent = awayScoreText;
                awayRecord.textContent = `${data.gameData.teams.away.record.wins}-${data.gameData.teams.away.record.losses}`;
    
                inningInfo.textContent = inningText;
                inningInfo.style = inningBoxStyle;
    
                homeScore.textContent = homeScoreText;
                homeLogo.src = `https://www.mlbstatic.com/team-logos/${homeTeam.id}.svg`;
                homeLogo.alt = homeTeam.name;
                homeRecord.textContent = `${data.gameData.teams.home.record.wins}-${data.gameData.teams.home.record.losses}`;
                
                // Display current players (hitter/pitcher)
                updatePlayerInfo(data);

                // Start auto-refresh only for live games
                if (isLiveGame && (!gameRefreshInterval || currentGamePk !== gamePk)) {
                startAutoRefresh(gamePk);
                }
            } else {
                inningInfo.textContent = "Game data unavailable.";
            }
        } catch (error) {
            console.error("Error fetching game details:", error);
            inningInfo.textContent = "Error loading game details.";
        }
    }
            function startAutoRefresh(gamePk) {
            stopAutoRefresh(); // Clear any existing interval
            currentGamePk = gamePk;
            
            gameRefreshInterval = setInterval(() => {
                fetchGameDetails(gamePk);
            }, 2000);
        }

        function stopAutoRefresh() {
            if (gameRefreshInterval) {
                clearInterval(gameRefreshInterval);
                gameRefreshInterval = null;
                currentGamePk = null;
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

        const topPerformers = data.liveData.boxscore.topPerformers || [];

        // Extract the top 3 performers safely
        const topPerformerOne = topPerformers[0]?.player?.person?.fullName || "N/A";
        const topPerformerTwo = topPerformers[1]?.player?.person?.fullName || "N/A";
        const topPerformerThree = topPerformers[2]?.player?.person?.fullName || "N/A";
        
        awayPlayerStats.innerHTML = "";
        homePlayerStats.innerHTML = "";

   // ** When the Game is Over **    
   
        if (gameState === "Final" || gameState === "Game Over") {
    awayPlayerStats.innerHTML = `<p><span class="winning-pitcher">W:</span> ${data.liveData.decisions.winner.fullName}</p>` || "N/A" ;
    homePlayerStats.innerHTML = `<p><span class="losing-pitcher">L:</span> ${data.liveData.decisions.loser.fullName}</p>` || "N/A" ;
    document.getElementById("scorebug-wrapper").style.display = "none";

    if (data.gameData.status.detailedState === "Final: Tied") {
        document.getElementById("awayPlayerStats").style.display = "none";
        document.getElementById("homePlayerStats").style.display = "none";
    }
    

    // **Find the gameplay-info-container**
    const gameplayContainer = document.getElementById("gameplay-info-container");
    if (!gameplayContainer) return; // Prevents errors if it doesn't exist

    // **Check if Top Performers already exist**
    let topPerformersContainer = document.getElementById("top-performers");
    if (!topPerformersContainer) {
        topPerformersContainer = document.createElement("div");
        topPerformersContainer.id = "top-performers";
        topPerformersContainer.classList.add("top-performers-section"); // Add CSS class

        // **Extract top performers dynamically**
        const topPerformers = data.liveData.boxscore.topPerformers.slice(0, 3); // Ensure we only use the first 3

        // **Get Player Stats and Image based on Type**
        const getPlayerStats = (player) => {
            if (!player || !player.player) return { name: "N/A", stats: "No stats available", imageUrl: "" };

            const name = player.player.person.fullName;
            const playerId = player.player.person.id;
            // Try multiple MLB image endpoints
            const imageUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_100,h_100,c_fill,q_auto:best/v1/people/${playerId}/headshot/67/current`;
            let stats = "No stats available";

            if (player.type === "pitcher" || "starter" && player.player.stats?.pitching?.summary) {
                stats = player.player.stats.pitching.summary; // Use summary for pitchers
            } else if (player.type === "hitter" && player.player.stats?.batting?.summary) {
                stats = player.player.stats.batting.summary; // Use summary for hitters
            } else if (player.type === "hitter") {
                // If summary is missing, construct a fallback from available batting stats
                const batting = player.player.stats.batting;
                if (batting) {
                    stats = `${batting.hits}-${batting.atBats}, ${batting.runs} R, ${batting.rbi} RBI`;
                }
            }
        
            return { name, stats, imageUrl };
        };

        // **Get Stats for the 3 Performers**
        const performerOne = getPlayerStats(topPerformers[0]);
        const performerTwo = getPlayerStats(topPerformers[1]);
        const performerThree = getPlayerStats(topPerformers[2]);

        // **Create HTML with Images**
        topPerformersContainer.innerHTML = `
        <div class="top-performers-row">
            <div class="top-performer">
                <img src="${performerOne.imageUrl}" alt="${performerOne.name}" class="performer-image" onerror="this.onerror=null; this.src='https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png'">
                <p class="performer-name">
                    <span>${performerOne.name.split(" ")[0]}</span> 
                    <span>${performerOne.name.split(" ")[1]}</span>
                </p>
                <p class="performer-stats">${performerOne.stats}</p>
            </div>
            <div class="top-performer">
                <img src="${performerTwo.imageUrl}" alt="${performerTwo.name}" class="performer-image" onerror="this.onerror=null; this.src='https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png'">
                <p class="performer-name">
                    <span>${performerTwo.name.split(" ")[0]}</span> 
                    <span>${performerTwo.name.split(" ")[1]}</span>
                </p>
                <p class="performer-stats">${performerTwo.stats}</p>
            </div>
            <div class="top-performer">
                <img src="${performerThree.imageUrl}" alt="${performerThree.name}" class="performer-image" onerror="this.onerror=null; this.src='https://content.mlb.com/images/headshots/current/60x60/generic_player@2x.png'">
                <p class="performer-name">
                    <span>${performerThree.name.split(" ")[0]}</span> 
                    <span>${performerThree.name.split(" ")[1]}</span>
                </p>
                <p class="performer-stats">${performerThree.stats}</p>
            </div>
        </div>
    `;

        // **Insert it AFTER gameplay-info-container**
        gameplayContainer.parentNode.insertBefore(topPerformersContainer, gameplayContainer.nextSibling);
    }

    return;
}
        
        
        
        if (gameState === "Pre-Game" || gameState === "Scheduled" || gameState === "Warmup") {
            document.getElementById("scorebug-wrapper").style.display = "none";
            document.getElementById("tabs-container").style.display = "none";

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
    
            // Assuming updateScorebug, updatePlayerInfo, and renderLivePitchData are your other functions
            updateScorebug(data); // Update scorebug when refreshing data
            updatePlayerInfo(data);  // Update player info when refreshing data
            renderLivePitchData(data); // Update pitch data when refreshing data
    
            // Game status handling
            const game = data.gameData;
            const linescore = data.liveData.linescore;
            let gameStatusText = game.status.detailedState;
            let inningText = "";
            let inningBoxStyle = "";
    
            if (gameStatusText === "Suspended: Rain") {
                inningText = "SUSPENDED";
                inningBoxStyle = "color: #ff6a6c;";
            } else if (gameStatusText === "Cancelled") {
                inningText = "RAIN";
                inningBoxStyle = "color: #ff6a6c;";
            } else if (gameStatusText === "Final" || gameStatusText === "Game Over" || gameStatusText === "Final: Tied") {
                inningText = "FINAL";
                inningBoxStyle = "color: #ff6a6c;";
            } else if (gameStatusText === "Pre-Game" || gameStatusText === "Scheduled") {
                inningText = formatGameTime(game.datetime.dateTime);
                inningBoxStyle = "color: #ff6a6c;";
            } else {
                const inningHalf = linescore.inningHalf ? (linescore.inningHalf === "Top" ? "TOP" : "BOT") : "";
                const currentInning = linescore.currentInning || "";
                inningText = `${inningHalf} ${currentInning}`;
            }
    
            // Update the inning info
            inningInfo.textContent = inningText;
            inningInfo.style = inningBoxStyle;
    
        } catch (error) {
            console.error("Error fetching game data:", error);
        }
    }
    

    function updateScorebug(data) {
        // Check if the game is finished and hide the scorebug if it is
        if (data.gameData.status.detailedState === "Final" || data.gameData.status.detailedState === "Game Over" || data.gameData.status.detailedState === "Final: Tied") {
            scorebugContainer.innerHTML = ""; // Clear the scorebug content
            document.getElementById("scorebug-wrapper").style.display = "none";
            return;
        }
    
        // Check if the game is in progress (i.e., live play data exists)
        if (!data.liveData || !data.liveData.plays || !data.liveData.plays.currentPlay) {
            console.log("No live game data available.");
            return; // Exit if there's no current play (game not in progress)
        }
    
        // Show scorebug wrapper in case it was hidden previously
        document.getElementById("scorebug-wrapper").style.display = "";
    
        const currentPlay = data.liveData.plays.currentPlay;
        let count = currentPlay.count || { balls: 0, strikes: 0, outs: 0 };
        
        // Reset balls and strikes at the end of a plate appearance
        if (data.gameData.status.detailedState === "Final" || data.gameData.status.detailedState === "Pre-Game" || data.gameData.status.detailedState === "Scheduled" || currentPlay.result?.eventType === "strikeout" || currentPlay.result?.eventType === "walk" || currentPlay.result?.eventType === "hit" || currentPlay.result?.eventType === "field_out") {
            count = { balls: 0, strikes: 0, outs: count.outs };
        }
    
        const onBase = data.liveData?.linescore?.offense || {};
    
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
        
        // Create pitch data container
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
        const pitchType = pitchDetails?.details?.type?.description || "Unknown";
        const pitchVelocity = pitchDetails.pitchData.startSpeed ? `${pitchDetails.pitchData.startSpeed.toFixed(1)} MPH` : "N/A";
        const spinRate = pitchDetails.pitchData.breaks ? `${pitchDetails.pitchData.breaks.spinRate} RPM` : "N/A";
        
        // Set content in a single row format
        pitchDataContainer.innerHTML = `
            <span class="pitch-info"><strong>Pitcher:</strong> ${pitcherName}</span>
            <span class="pitch-info pitch-type"><strong>Pitch:</strong> ${pitchType}</span>
            <span class="pitch-info pitch-velo"><strong>Velocity:</strong> ${pitchVelocity}</span>
            <span class="pitch-info"><strong>Spin:</strong> ${spinRate}</span>
        `;
        
        pitchDataSection.appendChild(pitchDataContainer);
    
// Create pitch description section
const pitchDescriptionContainer = document.createElement("div");
pitchDescriptionContainer.id = "pitch-description-container";

// Safely get the latest currentPlay pitch description
const currentPlay = data.liveData.plays.currentPlay;

// First, try to get the overall play description
let pitchResult = currentPlay?.result?.description || 
                  currentPlay?.result?.event ||
                  "Unknown";

// If that doesn't work, look in playEvents for the most recent event with a description
if (!pitchResult || pitchResult === "Unknown") {
    const latestEvent = [...(currentPlay?.playEvents || [])].reverse().find(e => 
        e?.details?.description && 
        e?.details?.description !== e?.details?.event // Avoid generic event names
    );
    pitchResult = latestEvent?.details?.description || "Unknown";
}

// Fallback to checking allPlays for the most recent completed play
if (!pitchResult || pitchResult === "Unknown") {
    const allPlays = data.liveData.plays.allPlays || [];
    const mostRecentPlay = allPlays[allPlays.length - 1];
    pitchResult = mostRecentPlay?.result?.description || "No play data available";
}

// Get hit data from the right source
const getHitData = () => {
    console.log("Searching for hit data..."); // Debug log
    
    // Try multiple sources for hit data
    let hitData = null;
    
    // Check currentPlay playEvents (most common location)
    if (currentPlay?.playEvents) {
        for (let event of currentPlay.playEvents) {
            if (event.hitData) {
                console.log("Found hit data in currentPlay.playEvents:", event.hitData);
                hitData = event.hitData;
                break;
            }
        }
    }
    
    // Check currentPlay directly
    if (!hitData && currentPlay?.hitData) {
        console.log("Found hit data in currentPlay:", currentPlay.hitData);
        hitData = currentPlay.hitData;
    }
    
    // Check allPlays for the most recent play
    if (!hitData) {
        const allPlays = data.liveData.plays.allPlays || [];
        const mostRecentPlay = allPlays[allPlays.length - 1];
        
        if (mostRecentPlay?.playEvents) {
            for (let event of mostRecentPlay.playEvents) {
                if (event.hitData) {
                    console.log("Found hit data in allPlays.playEvents:", event.hitData);
                    hitData = event.hitData;
                    break;
                }
            }
        }
        
        if (!hitData && mostRecentPlay?.hitData) {
            console.log("Found hit data in allPlays play:", mostRecentPlay.hitData);
            hitData = mostRecentPlay.hitData;
        }
    }
    
    if (!hitData) {
        console.log("No hit data found");
        console.log("currentPlay structure:", currentPlay);
    }
    
    return hitData;
};

let resultClass = "unclassified"; // Default to gray for unknown results

// Determine color based on event or description
if (pitchResult === "Strikeout" || pitchResult.includes("Called Strike") || pitchResult.includes("Swinging Strike") || pitchResult.includes("Foul") || pitchResult.includes("Foul Ball")) {
    resultClass = "strike";
} else if (pitchResult.includes("Ball") || pitchResult.includes("Ball In the Dirt") || pitchResult.includes("Walk")) {
    resultClass = "ball";

            // Extract hit data if available
    const hitData = getHitData();
    console.log("Hit detected, hit data found:", hitData); // Debug log
    if (hitData) {
        const launchSpeed = hitData.launchSpeed ? `${hitData.launchSpeed.toFixed(1)} MPH` : "N/A";
        const launchAngle = hitData.launchAngle ? `${hitData.launchAngle.toFixed(1)}°` : "N/A";
        const totalDistance = hitData.totalDistance ? `${hitData.totalDistance} ft` : "N/A";

        // Append hit data formatted correctly
        pitchResult += `<div class="hit-data">
        <span><i><strong>EV:</strong></i> ${launchSpeed}</span>
        <span><i><strong>LA:</strong></i> ${launchAngle}</span>
        <span><i><strong>Distance:</strong></i> ${totalDistance}</span>
    </div>`;
    }
} else if (pitchResult.includes("Out") || pitchResult.includes("Groundout") || 
           pitchResult.includes("Flyout") || pitchResult.includes("Forceout") || 
           pitchResult.includes("Pop Out") || pitchResult.includes("Lineout") || 
           pitchResult.includes("Sac Fly") || pitchResult.includes("grounded") ||
           pitchResult.includes("flied") || pitchResult.includes("lined") ||
           pitchResult.includes("popped")) {
    // Keep the full description for outs
    resultClass = "out";

    // Extract hit data if available (for balls put in play leading to outs)
    const hitData = getHitData();
    console.log("Out detected, hit data found:", hitData); // Debug log
    if (hitData) {
        const launchSpeed = hitData.launchSpeed ? `${hitData.launchSpeed.toFixed(1)} MPH` : "N/A";
        const launchAngle = hitData.launchAngle ? `${Math.round(hitData.launchAngle)}°` : "N/A";
        const totalDistance = hitData.totalDistance ? `${hitData.totalDistance} ft` : "N/A";

        // Append hit data formatted correctly
        pitchResult += `<div class="hit-data">
        <span><i><strong>EV:</strong></i> ${launchSpeed}</span>
        <span><i><strong>LA:</strong></i> ${launchAngle}</span>
        <span><i><strong>Distance:</strong></i> ${totalDistance}</span>
    </div>`;
    }
} else if (
    pitchResult.includes("Foul") ||
    pitchResult === "Foul Tip" ||
    pitchResult === "Foul Bunt" ||
    pitchResult === "Foul Ball" ||
    pitchResult === "Foul Out" ||
    pitchResult === "Foul Strike" ||
    pitchResult === "Foul Tip Catch"
) {
    pitchResult = "Foul Ball";
    resultClass = "foul";
} else if (pitchResult.includes("Pitching Change") || 
    pitchResult === "Mound Visit" ||
    pitchResult === "Batter Timeout" ||
    pitchResult === "Batting Timeout" 
) {
    pitchResult = "Time Out";
    resultClass = "change";
} else if (pitchResult.includes("Stolen Base")) {
    pitchResult = "Stolen Base";
    resultClass = "strike";
} else if (pitchResult.includes("Caught Stealing")) {
    pitchResult = "Caught Stealing";
    resultClass = "ball";
} else if (pitchResult.includes("Wild Pitch")) {
    pitchResult = "Wild Pitch";
    resultClass = "ball";
} else {
    // Anything not covered falls here
    resultClass = "unclassified"; // Default gray
}

// Set pitch description content with color-coded class
pitchDescriptionContainer.innerHTML = `
    <span class="pitch-description ${resultClass}">${pitchResult}</span>
`;

pitchDataSection.appendChild(pitchDescriptionContainer);

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

   // setInterval(() => fetchGameData(gamePk), 2000); // Refresh every 2s
    async function loadBoxScore() {
    const boxScoreContainer = document.getElementById("boxscore-content");
    boxScoreContainer.style.display = "block";
    boxScoreContainer.innerHTML = "<p>Loading Box Score...</p>";

    async function fetchAbbreviation(teamId) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
            const data = await response.json();
            return data.teams[0].abbreviation || "N/A";
        } catch (error) {
            console.error("Error fetching abbreviation:", error);
            return "N/A";
        }
    }

    const params = new URLSearchParams(window.location.search);
    const gamePk = params.get("gamePk");

    if (!gamePk) {
        boxScoreContainer.innerHTML = "<p>No gamePk found in URL.</p>";
        return;
    }

    try {
        // Fetch both game data and lineup data
        const [gameResponse, lineupResponse] = await Promise.all([
            fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`),
            fetch(`https://statsapi.mlb.com/api/v1/schedule?hydrate=lineups&sportId=1&gamePk=${gamePk}`)
        ]);

        const gameData = await gameResponse.json();
        const lineupData = await lineupResponse.json();

        const linescore = gameData?.liveData?.linescore;
        const boxscore = gameData?.liveData?.boxscore;
        
        if (!linescore || !boxscore) {
            boxScoreContainer.innerHTML = "<p>Box score data not available.</p>";
            return;
        }

        const awayTeamId = gameData.gameData.teams.away.id;
        const homeTeamId = gameData.gameData.teams.home.id;
        const innings = linescore.innings;

        const homeAbbr = await fetchAbbreviation(homeTeamId);
        const awayAbbr = await fetchAbbreviation(awayTeamId);

        const awayTeam = gameData.gameData.teams.away;
        const homeTeam = gameData.gameData.teams.home;
        const awayStats = boxscore.teams.away;
        const homeStats = boxscore.teams.home;

        // Extract lineup data
        const gameInfo = lineupData.dates?.[0]?.games?.[0];
        const awayLineup = gameInfo?.teams?.away?.lineup || [];
        const homeLineup = gameInfo?.teams?.home?.lineup || [];

        // Debug logging
        console.log("Away lineup:", awayLineup);
        console.log("Home lineup:", homeLineup);
        console.log("Away stats players:", Object.keys(awayStats.players || {}));
        console.log("Home stats players:", Object.keys(homeStats.players || {}));

        // Get player stats from boxscore
     // Updated getPlayerStats function to include season batting average
// Updated getPlayerStats function to include season batting average
function getPlayerStats(playerId, teamStats, isHitter = true) {
    const playerKey = `ID${playerId}`;
    const player = teamStats.players[playerKey];
    
    console.log(`Looking for player ${playerId} (${playerKey}) in teamStats:`, player ? "FOUND" : "NOT FOUND");
    
    if (!player) return null;
    
    if (isHitter) {
        const gameStats = player.stats?.batting || {};
        const seasonStats = player.seasonStats?.batting || {};
        
        return {
            name: player.person?.fullName || 'Unknown',
            position: player.position?.abbreviation || '',
            ab: gameStats.atBats || 0,
            r: gameStats.runs || 0,
            h: gameStats.hits || 0,
            rbi: gameStats.rbi || 0,
            bb: gameStats.baseOnBalls || 0,
            so: gameStats.strikeOuts || 0,
            seasonAvg: seasonStats.avg || '.000'  // Season batting average
        };
    } else {
        const gameStats = player.stats?.pitching || {};
        const seasonStats = player.seasonStats?.pitching || {};
        
        return {
            name: player.person?.fullName || 'Unknown',
            position: player.position?.abbreviation || 'P',
            ip: gameStats.inningsPitched || '0.0',
            h: gameStats.hits || 0,
            r: gameStats.runs || 0,
            er: gameStats.earnedRuns || 0,
            bb: gameStats.baseOnBalls || 0,
            so: gameStats.strikeOuts || 0,
            seasonEra: seasonStats.era || '0.00'  // Season ERA
        };
    }
}

// Updated getAllBatters function to include season stats
function getAllBatters(teamStats) {
    const batters = [];
    const batterIds = teamStats.batters || [];
    
    batterIds.forEach(id => {
        const playerKey = `ID${id}`;
        const player = teamStats.players[playerKey];
        if (player && player.stats?.batting) {
            const gameStats = player.stats.batting;
            const seasonStats = player.seasonStats?.batting || {};
            
            batters.push({
                id: id,
                name: player.person?.fullName || 'Unknown',
                position: player.position?.abbreviation || '',
                battingOrder: player.battingOrder || 99,
                ab: gameStats.atBats || 0,
                r: gameStats.runs || 0,
                h: gameStats.hits || 0,
                rbi: gameStats.rbi || 0,
                bb: gameStats.baseOnBalls || 0,
                so: gameStats.strikeOuts || 0,
                seasonAvg: seasonStats.avg || '.000'  // Season batting average
            });
        }
    });
    
    // Sort by batting order
    return batters.sort((a, b) => a.battingOrder - b.battingOrder);
}

// Updated createBattingStatsRow function to use season average
function createBattingStatsRow(player, battingOrder, teamStats) {
    const playerId = player.person?.id || player.id;
    console.log(`Creating batting row for player ${playerId} at batting order ${battingOrder}`);
    
    let stats = null;
    
    // Try to get stats using the original method
    if (playerId) {
        stats = getPlayerStats(playerId, teamStats, true);
    }
    
    // If that didn't work, try to find the player by name in the batters
    if (!stats && player.person?.fullName) {
        const allBatters = getAllBatters(teamStats);
        const foundBatter = allBatters.find(b => b.name === player.person.fullName);
        if (foundBatter) {
            stats = foundBatter;
        }
    }
    
    // If still no stats, create a placeholder row
    if (!stats) {
        const playerName = player.person?.fullName || player.name || 'Unknown';
        console.log(`No stats found for player: ${playerName} (ID: ${playerId})`);
        return `
            <tr>
                <td class="batting-order">${battingOrder}</td>
                <td class="player-name-boxscore" title="${playerName}">${playerName}</td>
                <td class="position">${player.position?.abbreviation || ''}</td>
                <td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>.000</td>
            </tr>
        `;
    }

    // Format name as "First Initial. Last Name"
    const nameParts = stats.name.split(' ');
    const suffixes = ['Jr.', 'Jr', 'Sr.', 'Sr', 'II', 'III', 'IV', 'V'];
    const lastPart = nameParts[nameParts.length - 1];
    const lastName = suffixes.includes(lastPart) && nameParts.length > 2
        ? nameParts[nameParts.length - 2] 
        : lastPart;

    const shortName = stats.name.length > 15 && nameParts.length >= 2 
        ? `${nameParts[0][0]}. ${lastName}` 
        : stats.name;
        
    return `
        <tr>
            <td class="batting-order">${battingOrder}</td>
            <td class="player-name-boxscore" title="${stats.name}">${shortName}</td>
            <td class="position">${stats.position}</td>
            <td>${stats.ab}</td>
            <td>${stats.r}</td>
            <td>${stats.h}</td>
            <td>${stats.rbi}</td>
            <td>${stats.bb}</td>
            <td>${stats.so}</td>
            <td>${stats.seasonAvg}</td>
        </tr>
    `;
}

// Updated createPitchingStatsRow function to use season ERA
function createPitchingStatsRow(pitcher, teamStats) {
    const playerId = pitcher.person?.id;
    const stats = getPlayerStats(playerId, teamStats, false);
    
    if (!stats) {
        return `
            <tr class="pitcher-row">
                <td class="batting-order">P</td>
                <td class="player-name-boxscore" title="${pitcher.person?.fullName || 'Unknown'}">${pitcher.person?.fullName || 'Unknown'}</td>
                <td class="position">${pitcher.position?.abbreviation || 'P'}</td>
                <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
            </tr>
        `;
    }

    // Format name as "First Initial. Last Name"
    const nameParts = stats.name.split(' ');
    const suffixes = ['Jr.', 'Jr', 'Sr.', 'Sr', 'II', 'III', 'IV', 'V'];
    const lastPart = nameParts[nameParts.length - 1];
    const lastName = suffixes.includes(lastPart) && nameParts.length > 2
        ? nameParts[nameParts.length - 2] 
        : lastPart;

    const shortName = stats.name.length > 15 && nameParts.length >= 2 
        ? `${nameParts[0][0]}. ${lastName}` 
        : stats.name;
    
    return `
        <tr class="pitcher-row">
            <td class="batting-order">P</td>
            <td class="player-name-boxscore" title="${stats.name}">${shortName}</td>
            <td class="position">${stats.position}</td>
            <td>${stats.ip}</td>
            <td>${stats.h}</td>
            <td>${stats.r}</td>
            <td>${stats.er}</td>
            <td>${stats.bb}</td>
            <td>${stats.so}</td>
            <td>${stats.seasonEra}</td>
        </tr>
    `;
}

       function createTeamSection(teamName, teamId, lineup, teamStats, isHome = false) {
            const teamClass = isHome ? 'home-team' : 'away-team';
            const toggleId = isHome ? 'home-team-toggle' : 'away-team-toggle';
            const contentId = isHome ? 'home-team-content' : 'away-team-content';

            // Get batting lineup - try multiple approaches
            let battingLineup = [];
            
            // Approach 1: Use provided lineup if it exists and has players
            if (lineup && lineup.length > 0) {
                // Filter out pitchers from batting lineup
                battingLineup = lineup.filter(player => {
                    const position = player.position?.abbreviation || '';
                    return position !== 'P' && position !== 'Pitcher';
                });
            } else {
                // Approach 2: Fall back to getting all batters from boxscore and sorting them
                const allBatters = getAllBatters(teamStats);
                battingLineup = allBatters.filter(batter => {
                    const position = batter.position || '';
                    return position !== 'P' && position !== 'Pitcher';
                }).map(batter => ({
                    person: { id: batter.id, fullName: batter.name },
                    position: { abbreviation: batter.position }
                }));
            }

            console.log(`${teamName} batting lineup (filtered):`, battingLineup);

            // Get all pitchers who appeared in the game (for pitching section only)
            const pitcherIds = teamStats.pitchers || [];
            const pitchers = pitcherIds.map(id => {
                const playerKey = `ID${id}`;
                const player = teamStats.players[playerKey];
                return player ? {
                    person: player.person,
                    position: player.position,
                    stats: player.stats?.pitching
                } : null;
            }).filter(p => p !== null);

            return `
                <div class="team-section ${teamClass}">
                    <div class="team-header" data-content-id="${contentId}" data-toggle-id="${toggleId}">
                        <img src="https://www.mlbstatic.com/team-logos/${teamId}.svg" alt="${teamName}" class="team-logo-small">
                        <span class="team-name-small">${teamName}</span>
                        <span class="toggle-icon" id="${toggleId}">▼</span>
                    </div>
                    <div class="team-content" id="${contentId}">
                        <div class="stats-table-wrapper">
                            <div class="section-subtitle">Batting</div>
                            <table class="stats-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Player</th>
                                        <th>Pos</th>
                                        <th>AB</th>
                                        <th>R</th>
                                        <th>H</th>
                                        <th>RBI</th>
                                        <th>BB</th>
                                        <th>K</th>
                                        <th>AVG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${battingLineup.map((player, index) => 
                                        createBattingStatsRow(player, index + 1, teamStats)
                                    ).join('')}
                                </tbody>
                            </table>
                            
                            <div class="section-subtitle">Pitching</div>
                            <table class="stats-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Pitcher</th>
                                        <th>Pos</th>
                                        <th>IP</th>
                                        <th>H</th>
                                        <th>R</th>
                                        <th>ER</th>
                                        <th>BB</th>
                                        <th>K</th>
                                        <th>ERA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pitchers.map(pitcher => 
                                        createPitchingStatsRow(pitcher, teamStats)
                                    ).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        // Enhanced HTML with modern styling
        let fullHTML = `
            <style>
            .boxscore-container {
                width: 600px;
                height: 400px;
                margin: 0 auto;
                padding: 10px;
                font-family: 'Rubik', Tahoma, Geneva, Verdana, sans-serif;
                background: #e5decf;
                overflow-y: auto;
                display: block;
                scrollbar-width: thin;
            }

            .boxscore-title {
                text-align: center;
                margin: 0 0 12px 0;
                font-size: 18px;
                font-weight: 600;
                color: #0b0f13;
            }

            .boxscore-table {
                margin: 0 auto 15px auto;
                width: 90%;
                max-width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .boxscore-table thead {
                background: #0b0f13;
                color: white;
            }

            .boxscore-table th {
                padding: 8px 4px;
                text-align: center;
                font-weight: 600;
                font-size: 11px;
                border-right: 1px solid rgba(255,255,255,0.1);
            }

            .boxscore-table th:last-child {
                border-right: none;
            }

            .boxscore-table tbody tr {
                transition: background-color 0.2s ease;
            }

            .boxscore-table tbody tr:hover {
                background-color: rgba(255,106,108,0.1);
            }

            .boxscore-table tbody tr:nth-child(even) {
                background-color: rgba(229,222,207,0.3);
            }

            .boxscore-table td {
                padding: 8px 4px;
                text-align: center;
                border-right: 1px solid rgba(215,130,126,0.3);
                border-bottom: 1px solid rgba(215,130,126,0.3);
                font-weight: 500;
                color: #0b0f13;
                font-size: 11px;
            }

            .boxscore-table td:last-child {
                border-right: none;
            }

            .boxscore-table tbody tr:last-child td {
                border-bottom: none;
            }

            .team-name {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .team-logo-boxscore {
                width: 20px;
                height: 20px;
            }

            .total-stats {
                background: rgba(255,106,108,0.2) !important;
                font-weight: 700;
                color: #0b0f13;
            }

            .inning-score {
                font-weight: 500;
                min-width: 25px;
            }

            /* Section Headers */
            .section-title {
                text-align: center;
                margin: 15px 0 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: #0b0f13;
                padding: 5px 0;
                border-bottom: 2px solid #d7827e;
            }

            .teams-row {
                display: column;
                gap: 8px;
                justify-content: space-between;
                margin-bottom: 10px;
            }

            .team-section {
                flex: 1;
                width: 100%;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                background: white;
                margin-bottom: 8px;
            }

            .team-header {
                display: flex;
                align-items: center;
                padding: 10px 12px;
                background: #0b0f13;
                color: white;
                cursor: pointer;
                user-select: none;
                transition: background-color 0.2s;
            }

            .team-header:hover {
                background: #1a2025;
            }

            .team-logo-small {
                width: 18px;
                height: 18px;
                margin-right: 8px;
            }

            .team-name-small {
                flex: 1;
                font-weight: 600;
                font-size: 12px;
            }

            .toggle-icon {
                font-size: 12px;
                transition: transform 0.2s;
                font-weight: bold;
            }

            .toggle-icon.rotated {
                transform: rotate(-90deg);
            }

            .team-content {
                max-height: 380px;
                overflow-y: auto;
                transition: max-height 0.3s ease;
                scrollbar-width: thin;
            }

            .team-content.collapsed {
                max-height: 0;
                overflow: hidden;
            }

            /* Stats Table Wrappers for Scrolling */
            .stats-table-wrapper {
                max-height: 360px;
                overflow-y: auto;
                scrollbar-width: none;
            }

            .section-subtitle {
                background: #f8f9fa;
                padding: 6px 8px;
                font-weight: 600;
                font-size: 10px;
                color: #495057;
                border-bottom: 1px solid #dee2e6;
                margin-top: 8px;
            }

            .section-subtitle:first-child {
                margin-top: 0;
            }

            .stats-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
            }

            .stats-table thead {
                background: #f8f9fa;
                position: sticky;
                top: 0;
                z-index: 1;
            }

            .stats-table th {
                padding: 6px 2px;
                text-align: center;
                font-weight: 600;
                border-bottom: 2px solid #dee2e6;
                font-size: 8px;
                color: #495057;
                white-space: nowrap;
            }

            .stats-table td {
                padding: 4px 2px;
                text-align: center;
                border-bottom: 1px solid #f1f3f4;
                font-weight: 500;
                font-size: 9px;
                white-space: nowrap;
            }

            .stats-table tr:hover {
                background-color: rgba(0,123,255,0.1);
            }

            .player-name-boxscore {
                text-align: left !important;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 10px;
                max-width: 80px;
            }

            /* Stats Table Column Widths */
            .stats-table th:first-child,
            .stats-table td:first-child {
                width: 8%;
                min-width: 20px;
            }

            .stats-table th:nth-child(2),
            .stats-table td:nth-child(2) {
                width: 25%;
                text-align: left;
            }

            .stats-table th:nth-child(3),
            .stats-table td:nth-child(3) {
                width: 8%;
                min-width: 25px;
            }

            .stats-table th:nth-child(n+4),
            .stats-table td:nth-child(n+4) {
                width: 7%;
                min-width: 20px;
            }

            .batting-order {
                font-weight: bold;
                color: #0b0f13;
                background-color: rgba(11,15,19,0.1);
            }

            .position {
                font-weight: 600;
                color: #495057;
            }

            .pitcher-row {
                background-color: rgba(108,117,125,0.1);
                border-top: 2px solid #dee2e6;
            }

            .pitcher-row .batting-order {
                background-color: rgba(108,117,125,0.3);
                font-weight: bold;
                color: #495057;
            }

            .away-team .team-header {
                background:rgb(74, 87, 100);
            }

            .away-team .team-header:hover {
                background: #5a6268;
            }

            .home-team .team-header {
                background: rgb(74, 87, 100);
            }

            .home-team .team-header:hover {
                background: #5a6268;
            }

            @media (max-width: 600px) {
                .teams-row {
                    flex-direction: column;
                }
                
                .team-section {
                    width: 100%;
                }
            }
            </style>
            
            <div class="boxscore-container">
                <table class="boxscore-table">
                    <thead>
                        <tr>
                            <th>Team</th>
                            ${innings.map((_, i) => `<th>${i + 1}</th>`).join('')}
                            <th>R</th><th>H</th><th>E</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="team-name">
                                <img src="https://www.mlbstatic.com/team-logos/${awayTeamId}.svg" alt="${awayAbbr} logo" class="team-logo-boxscore">
                            </td>
                            ${innings.map(inn => `<td class="inning-score">${inn.away?.runs ?? '-'}</td>`).join('')}
                            <td class="total-stats">${linescore.teams.away.runs}</td>
                            <td class="total-stats">${linescore.teams.away.hits}</td>
                            <td class="total-stats">${linescore.teams.away.errors}</td>
                        </tr>
                        <tr>
                            <td class="team-name">
                                <img src="https://www.mlbstatic.com/team-logos/${homeTeamId}.svg" alt="${homeAbbr} logo" class="team-logo-boxscore">
                            </td>
                            ${innings.map(inn => `<td class="inning-score">${inn.home?.runs ?? '-'}</td>`).join('')}
                            <td class="total-stats">${linescore.teams.home.runs}</td>
                            <td class="total-stats">${linescore.teams.home.hits}</td>
                            <td class="total-stats">${linescore.teams.home.errors}</td>
                        </tr>
                    </tbody>
                </table>

                
                <div class="teams-row">
                    ${createTeamSection(awayTeam.name, awayTeam.id, awayLineup, awayStats, false)}
                    ${createTeamSection(homeTeam.name, homeTeam.id, homeLineup, homeStats, true)}
                </div>
            </div>
        `;

        // Insert the HTML first
        boxScoreContainer.innerHTML = fullHTML;
        
        // Now that the DOM elements exist, set up the event listeners
        setupToggleHandlers();
        
    } catch (error) {
        console.error("Error loading box score:", error);
        boxScoreContainer.innerHTML = "<p>Error loading box score data.</p>";
    }
}

// Define the toggle function separately so it can be called after DOM creation
function toggleTeam(contentId, toggleId) {
    const content = document.getElementById(contentId);
    const toggle = document.getElementById(toggleId);

    if (content && toggle) {
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            toggle.textContent = '▼';
            toggle.classList.remove('rotated');
        } else {
            content.classList.add('collapsed');
            toggle.textContent = '▶';
            toggle.classList.add('rotated');
        }
    }
}

// Set up event listeners after DOM is created
// Modified version that initializes collapsed state
function setupToggleHandlers() {
    const teamHeaders = document.querySelectorAll('.team-header');
    teamHeaders.forEach(header => {
        const contentId = header.getAttribute('data-content-id');
        const toggleId = header.getAttribute('data-toggle-id');
        
        // Initialize as collapsed
        const content = document.getElementById(contentId);
        const toggle = document.getElementById(toggleId);
        if (content && toggle) {
            content.classList.add('collapsed');
            toggle.textContent = '▶';
            toggle.classList.add('rotated');
        }
        
        // Set up click handler
        header.addEventListener('click', function() {
            toggleTeam(contentId, toggleId);
        });
    });
}

const allPlaysCSS = `
#all-plays-container {
    width: 100%;
    height: 400px;
    overflow-y: auto;
    padding: 10px;
    background-color: #e5decf;
    border-radius: 8px;
    font-family: Rubik, sans-serif;
    scrollbar-width: thin;
}

.play-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
    padding: 8px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    opacity: 0;
    transform: translateY(-10px);
    animation: slideIn 0.3s ease-out forwards;
    position: relative;
}

@keyframes slideIn {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.inning-indicator {
    position: absolute;
    top: 8px;
    left: 8px;
    background-color: #ff6a6c;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
}

.player-image-container {
    flex-shrink: 0;
    margin-right: 12px;
    margin-left: 55px;
    position: relative;
}

.player-image {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid #d7827e;
    background-color: #e5decf;
    object-fit: cover;
}

.event-icon {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #ff6a6c;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
    border: 2px solid white;
}

.play-details {
    flex: 1;
    margin-top: 5px;
}

.event-name {
    background-color: #d7827e;
    color: black;
    padding: 4px 8px;
    border-radius: 10px;
    font-weight: bold;
    font-size: 12px;
    display: inline-block;
    margin-bottom: 6px;
}

.play-description {
    color: #333;
    font-size: 11px;
    line-height: 1.3;
    margin: 0;
}

.game-start-item {
    background: linear-gradient(135deg, #ff6a6c, #d7827e);
    color: white;
    text-align: center;
    padding: 15px;
    margin-bottom: 15px;
}

.game-start-icon {
    font-size: 24px;
    margin-bottom: 8px;
}
`;

// Add CSS to document if not already added
if (!document.getElementById('all-plays-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'all-plays-styles';
    styleSheet.textContent = allPlaysCSS;
    document.head.appendChild(styleSheet);
}

// Main function to load and render all plays
async function loadAllPlays() {
    console.log('Loading all plays content');
    
    // Create or get the all plays container
    let allPlaysContainer = document.getElementById('all-plays-container');
    if (!allPlaysContainer) {
        allPlaysContainer = document.createElement('div');
        allPlaysContainer.id = 'all-plays-container';
        document.getElementById('popup-container').appendChild(allPlaysContainer);
    }
    
    try {
        // Check if we already have game data, otherwise fetch it
        let gameData;
        if (window.cachedGameData) {
            gameData = window.cachedGameData;
        } else {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            gameData = await response.json();
            window.cachedGameData = gameData; // Cache for future use
        }
        
        // Extract plays data
        const allPlays = gameData.liveData?.plays?.allPlays || [];
        const gameInfo = gameData.gameData;
        
        // Clear existing content
        allPlaysContainer.innerHTML = '';
        
        // Add game start information if available
        if (gameInfo) {
            const gameStartItem = createGameStartItem(gameInfo);
            allPlaysContainer.appendChild(gameStartItem);
        }
        
        // Reverse plays to show newest first
        const sortedPlays = [...allPlays].reverse();
        
        // Create play items with staggered animation
        sortedPlays.forEach((play, index) => {
            setTimeout(() => {
                const playItem = createPlayItem(play, gameData);
                allPlaysContainer.appendChild(playItem);
            }, index * 50); // Stagger animations by 50ms
        });
        
    } catch (error) {
        console.error('Error loading all plays:', error);
        allPlaysContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6a6c;">Error loading plays data</div>';
    }
}

// Function to create game start item
function createGameStartItem(gameInfo) {
    const gameStartDiv = document.createElement('div');
    gameStartDiv.className = 'game-start-item';
    
    const venue = gameInfo.venue?.name || 'Unknown Venue';
    const gameDate = new Date(gameInfo.datetime?.dateTime || gameInfo.gameDate);
    const timeString = gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    gameStartDiv.innerHTML = `
        <div class="game-start-icon"><img width="48" height="48" src="https://img.icons8.com/pulsar-line/48/baseball-ball.png" alt="baseball-ball"/></div>
        <div style="font-weight: bold; margin-bottom: 4px;">First Pitch</div>
        <div style="font-size: 12px;">${timeString} at ${venue}</div>
    `;
    
    return gameStartDiv;
}

// Function to create individual play item
function createPlayItem(play, gameData) {
    const playDiv = document.createElement('div');
    playDiv.className = 'play-item';
    
    const inning = play.about?.inning || 1;
    const isTop = play.about?.isTopInning;
    const inningText = `${isTop ? 'Top' : 'Bottom'} ${inning}`;
    
    // Get player info
    const playerId = play.matchup?.batter?.id;
    const playerName = getPlayerName(playerId, gameData) || 'Unknown Player';
    
    // Create event icon
    const eventIcon = getEventIcon(play.result?.event);
    
    playDiv.innerHTML = `
        <div class="inning-indicator">${inningText}</div>
        <div class="player-image-container">
            <img class="player-image" 
                 src="https://midfield.mlbstatic.com/v1/people/${playerId}/spots/60" 
                 alt="${playerName}"
            <div class="event-icon">${eventIcon}</div>
        </div>
        <div class="play-details">
            <div class="event-name">${play.result?.event || 'Unknown Event'}</div>
            <p class="play-description">${play.result?.description || 'No description available'}</p>
        </div>
    `;
    
    return playDiv;
}

// Helper function to get player name from game data
function getPlayerName(playerId, gameData) {
    if (!playerId || !gameData.gameData?.players) return null;
    
    const player = gameData.gameData.players[`ID${playerId}`];
    return player ? `${player.firstName} ${player.lastName}` : null;
}

// Function to get appropriate icon for different events
function getEventIcon(eventType) {
    const eventIcons = {
        'Strikeout': '<img width="20" height="20" src="assets/icons/k.png" alt="circled-k"/>',
        'Home Run': '<img width="30" height="30" src="assets/icons/baseball-field.png" alt="baseball-field"/>',
        'Single': '<img width="20" height="20" src="assets/icons/one.png" alt="1-circle-c"/>',
        'Double': '<img width="20" height="20" src="assets/icons/two.png" alt="2-circle-c"/>',
        'Triple': '<img width="20" height="20" src="assets/icons/three.png" alt="3-circle"/>',
        'Walk': '<img width="20" height="20" src="assets/icons/running.png" alt="walking--v1"/>',
        'Hit By Pitch': '<img width="25" height="25" src="assets/icons/hbp.png" alt="explosion"/>',
        'Stolen Base': '<img width="30" height="30" src="assets/icons/running.png" alt="exercise"/>',
        'Wild Pitch': '<img width="30" height="30" src="assets/icons/running.png" alt="exercise"/>',
        'Passed Ball': '<img width="30" height="30" src="assets/icons/running.png" alt="exercise"/>',
        'Groundout': '<img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/circled-down-2.png" alt="circled-down-2"/>',
        'Flyout': '<img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/send-letter.png" alt="send-letter"/>',
        'Pop Out': '<img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/send-letter.png" alt="send-letter"/>',
        'Lineout': '<img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/circled-right.png" alt="circled-right"/>',
        'Balk': '<img width="30" height="30" src="https://img.icons8.com/fluency-systems-regular/30/police-badge.png" alt="police-badge"/>',
        'Pickoff': '<img width="30" height="30" src="https://img.icons8.com/parakeet-line/30/pickaxe.png" alt="pickaxe"/>',
        'Defensive Sub': '<img width="30" height="30" src="https://img.icons8.com/pulsar-line/30/data-in-both-directions.png" alt="data-in-both-directions"/>',
        'Offensive Sub': '<img width="30" height="30" src="https://img.icons8.com/pulsar-line/30/data-in-both-directions.png" alt="data-in-both-directions"/>',
        'Pitching Substitution': '<img width="30" height="30" src="https://img.icons8.com/pulsar-line/30/data-in-both-directions.png" alt="data-in-both-directions"/>',
        'Error': 'https://img.icons8.com/?size=100&id=59754&format=png&color=000000',
        'Fielders Choice': '<img width="30" height="30" src="assets/icons/baseball-glove.png" alt="softball-mitt"/>',
        'Force Out': '<img width="30" height="30" src="assets/icons/baseball-glove.png" alt="softball-mitt"/>',
        'Sacrifice Fly': '<img width="30" height="30" src="assets/icons/baseball-glove.png" alt="softball-mitt"/>',
        'Sacrifice Bunt': '<img width="30" height="30" src="assets/icons/baseball-glove.png" alt="softball-mitt"/>',
        'Grounded Into DP': '<img width="30" height="30" src="assets/icons/baseball-glove.png" alt="softball-mitt"/>'
    };
    
    return eventIcons[eventType] || '<img width="25" height="25" src="https://img.icons8.com/material-rounded/25/baseball-ball.png" alt="baseball-ball"/>';
}

// refresher when All Plays tab is active
setInterval(() => {
    if (!gamePk) return;
    
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab && activeTab.id === 'all-plays-tab') {
        // Clear cached data to force fresh fetch
        delete window.cachedGameData;
        loadAllPlays();
    }
}, 30000); // 30 seconds
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             