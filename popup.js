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
function toggleContainers(showDynamic, isBoxscoreTab = false, isScoringPlaysTab = false, isAllPlaysTab = false) {
    const gameInfoContainer = document.getElementById('game-info');
    const gameplayInfoContainer = document.getElementById('gameplay-info-container');
    const topPerformer = document.getElementById('top-performers');
    const pitchDataSection = document.getElementById('pitch-data-section');
    const boxScoreContainer = document.getElementById('boxscore-content');
    const scoringPlaysContainer = document.getElementById('scoring-plays-container');
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

    // Handle scoring plays container
    if (scoringPlaysContainer) {
        scoringPlaysContainer.style.display = isScoringPlaysTab ? 'block' : 'none'; 
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

function loadBoxScore() {  
    console.log(`Loading dynamic content for ${tabType}`); 
}

function loadScoringPlays() {
    console.log(`Loading dynamic content for ${tabType}`);
}

function loadAllPlays() {
    console.log(`Loading dynamic content for ${tabType}`);
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
    toggleContainers(false, false, true, false); // hide dynamic & boxscore
    openGameDetailsPage('scoring-plays');
});

allPlaysTab.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    allPlaysTab.classList.add('active');
    toggleContainers(false, false, false, true); // hide dynamic, hide boxscore, show all-plays
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
                ${generatedSVGField(count, onBase)}
                <div class="balls-strikes" id="count" style="color: #2f4858;">
                    ${count.balls} - ${count.strikes}
                </div>
            </div>
        `;
    }
    

function renderLivePitchData(data) {
    const gameState = data.gameData.status.abstractGameState;
    if (gameState !== "Live" && gameState !== "In Progress") return;

    // Get or create the main container
    let pitchDataSection = document.getElementById("pitch-data-section");
    if (!pitchDataSection) {
        pitchDataSection = document.createElement("div");
        pitchDataSection.id = "pitch-data-section";
        
        const gameplayInfoContainer = document.getElementById("gameplay-info-container");
        if (gameplayInfoContainer) {
            gameplayInfoContainer.parentNode.insertBefore(pitchDataSection, gameplayInfoContainer.nextSibling);
        }
    }

    // Get or create pitch data container
    let pitchDataContainer = document.getElementById("pitch-data-container");
    if (!pitchDataContainer) {
        pitchDataContainer = document.createElement("div");
        pitchDataContainer.id = "pitch-data-container";
        pitchDataSection.appendChild(pitchDataContainer);
    }

    const allPlays = data.liveData.plays.allPlays;
    const currentPlay = data.liveData.plays.currentPlay;
    const lastPlay = allPlays[allPlays.length - 1];

    // Hide the section if no pitch data is available
    if (!lastPlay?.pitchIndex?.length) {
        if (pitchDataSection) {
            pitchDataSection.style.display = 'none';
        }
        return;
    }

    // Show the section since we have pitch data
    pitchDataSection.style.display = 'block';

    const lastPitchIndex = lastPlay.pitchIndex[lastPlay.pitchIndex.length - 1];
    const pitchDetails = lastPlay.playEvents[lastPitchIndex];
    const pitcher = currentPlay.matchup.pitcher;
    const batter = currentPlay.matchup.batter;

    const pitcherName = `${pitcher.fullName.split(" ")[0][0]}. ${pitcher.fullName.split(" ")[1]}`;
    const pitchType = pitchDetails?.details?.type?.description || "Unknown";
    const pitchVelocity = pitchDetails?.pitchData?.startSpeed ? `${pitchDetails.pitchData.startSpeed.toFixed(1)} MPH` : "N/A";
    const spinRate = pitchDetails?.pitchData?.breaks?.spinRate ? `${pitchDetails.pitchData.breaks.spinRate} RPM` : "N/A";

    // Update pitch data container content
    pitchDataContainer.innerHTML = `
        <span class="pitch-info"><strong>Pitcher:</strong> ${pitcherName}</span>
        <span class="pitch-info pitch-type"><strong>Pitch:</strong> ${pitchType}</span>
        <span class="pitch-info pitch-velo"><strong>Velocity:</strong> ${pitchVelocity}</span>
        <span class="pitch-info"><strong>Spin:</strong> ${spinRate}</span>
    `;

    // --- Get Play Result: Event & Description ---
    let event = currentPlay?.result?.event || null;
    let description = currentPlay?.result?.description || null;

    // Fallback if missing
    if (!description) {
        const fallbackEvent = [...(currentPlay?.playEvents || [])].reverse().find(e =>
            e?.details?.description
        );
        description = fallbackEvent?.details?.description || null;
    }

    if (!event && !description) {
        const mostRecentPlay = allPlays[allPlays.length - 1];
        event = mostRecentPlay?.result?.event || null;
        description = mostRecentPlay?.result?.description || "No play data available";
    }

 // Define result categories and their shared styles
const resultCategories = {
    strike: {
        results: ['Strike', 'Swinging Strike', 'Called Strike', 'Strikeout', 'Flyout'],
        style: {
            background: '#dc3545',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-block',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderLeft: '3px solid #333',
            borderBottom: '1px solid #333'
        }
    },
    ball: {
        results: ['Ball', 'Ball In Dirt', 'Pitch Out', 'Intentional Ball', 'Walk'],
        style: {
            background: '#28a745',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-block',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderLeft: '3px solid #333',
            borderBottom: '1px solid #333'
        }
    },
    foul: {
        results: ['Foul', 'Foul Tip', 'Foul Bunt', 'Foul Ball'],
        style: {
            background: '#6f42c1',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-block',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderLeft: '3px solid #333',
            borderBottom: '1px solid #333'
        }
    }
};

// Function to style specific pitch descriptions
const styleDescription = (desc) => {
    if (!desc) return desc;
    
    // Find which category this description belongs to
    for (const [categoryName, category] of Object.entries(resultCategories)) {
        if (category.results.includes(desc.trim())) {
            // Convert style object to CSS string
            const styleString = Object.entries(category.style)
                .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
                .join('; ');
            return `<span style="${styleString}">${desc}</span>`;
        }
    }
    
    // Return original description if no match
    return desc;
};

    // Get or create pitch description container
    let pitchDescriptionContainer = document.getElementById("pitch-description-container");
    if (!pitchDescriptionContainer) {
        pitchDescriptionContainer = document.createElement("div");
        pitchDescriptionContainer.id = "pitch-description-container";
        pitchDataSection.appendChild(pitchDescriptionContainer);
    }

    // Get or create play result container
    let playResultContainer = pitchDescriptionContainer.querySelector(".play-result-container");
    if (!playResultContainer) {
        playResultContainer = document.createElement("div");
        playResultContainer.className = "play-result-container";
        playResultContainer.style.display = "flex";
        playResultContainer.style.alignItems = "flex-start";
        playResultContainer.style.marginTop = "10px";
        playResultContainer.style.position = "relative";
        pitchDescriptionContainer.appendChild(playResultContainer);
    }

    const playDescription = playResultContainer.querySelector(".pitch-description");
    if (playDescription) {
    const descriptionLength = playDescription.textContent.length;
    if (descriptionLength <= 30) { // Adjust threshold as needed
        playResultContainer.classList.add("short-play");
    } else {
        playResultContainer.classList.remove("short-play");
    }
}

    // Get or create player image container
    let playerImageContainer = playResultContainer.querySelector(".player-image-container");
    if (!playerImageContainer) {
        playerImageContainer = document.createElement("div");
        playerImageContainer.className = "player-image-container";
        playResultContainer.appendChild(playerImageContainer);
    }

    const batterName = batter?.fullName || "Unknown";
    const batterId = batter?.id || "";
    
    // Get or create player image (preserve existing image to prevent blinking)
    let playerImage = playerImageContainer.querySelector(".player-image");
    if (!playerImage) {
        playerImage = document.createElement("img");
        playerImage.className = "player-image";
        playerImage.alt = batterName;
        playerImageContainer.appendChild(playerImage);
    }

    // Only update image src if batter changed
    const expectedSrc = `https://midfield.mlbstatic.com/v1/people/${batterId}/spots/60`;
    if (playerImage.src !== expectedSrc) {
        playerImage.src = expectedSrc;
        playerImage.alt = batterName;
    }

    // Simple event icon mapping
    const getEventIcon = (eventType) => {
        if (!eventType) return null;
        
        if (eventType.includes('Home Run')) return 'HR';
        else if (eventType.includes('Triple')) return '3B';
        else if (eventType.includes('Double')) return '2B';
        else if (eventType.includes('Single')) return '1B';
        else if (eventType.includes('Sac')) return 'SAC';
        else if (eventType.includes('Error')) return 'E';
        else if (eventType.includes('Walk')) return 'BB';
        else if (eventType.includes('Hit By Pitch')) return 'HBP';
        else if (eventType.includes('Forceout')) return 'OUT';
        else if (eventType.includes('Sac Bunt')) return 'SAC';
        else if (eventType.includes('Grounded Into DP')) return 'DP';
        else if (eventType.includes('Field Error')) return 'E';
        else if (eventType.includes('Fielders Choice')) return 'FC';
        else if (eventType.includes('Double Play')) return 'OUT';
        else if (eventType.includes('Catcher Interference')) return 'E2';
        else if (eventType.includes('Groundout')) return 'OUT';
        else if (eventType.includes('Strikeout')) return 'K';
        else return null;
    };

    const eventIcon = getEventIcon(event);

    // Get or create event icon div
    let eventIconDiv = playerImageContainer.querySelector(".event-icon");
    if (eventIcon) {
        if (!eventIconDiv) {
            eventIconDiv = document.createElement("div");
            eventIconDiv.className = "event-icon";
            eventIconDiv.style.cssText = `
                position: absolute;
                bottom: -5px;
                right: -5px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background-color: #ff6a6c;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                color: white;
                border: 2px solid white;
            `;
            playerImageContainer.appendChild(eventIconDiv);
        }
        eventIconDiv.textContent = eventIcon;
    } else if (eventIconDiv) {
        // Remove event icon if no event
        eventIconDiv.remove();
    }

    // Get or create content wrapper
    let contentWrapper = playResultContainer.querySelector(".content-wrapper");
    if (!contentWrapper) {
        contentWrapper = document.createElement("div");
        contentWrapper.className = "content-wrapper";
        playResultContainer.appendChild(contentWrapper);
    }

    // Get or create play details container
    let playDetailsContainer = contentWrapper.querySelector(".play-details");
    if (!playDetailsContainer) {
        playDetailsContainer = document.createElement("div");
        playDetailsContainer.className = "play-details";
        contentWrapper.appendChild(playDetailsContainer);
    }

    const formattedEvent = event ? `<div class="pitch-event">${event}</div>` : "";
    const formattedDescription = description ? `<div class="pitch-description">${styleDescription(description)}</div>` : "";
    let pitchResultHTML = formattedEvent + formattedDescription;

    // --- Statcast Hit Data - ALWAYS display ---
    const getHitData = (play) => {
        return (
            play?.playEvents?.find(e => e.hitData)?.hitData ||
            play?.hitData ||
            null
        );
    };
    const hitData = getHitData(currentPlay) || getHitData(lastPlay);

    // Always display hit data section, using actual data if available, otherwise '--'
    const launchSpeed = hitData?.launchSpeed ? `${hitData.launchSpeed.toFixed(1)} MPH` : "--";
    const launchAngle = hitData?.launchAngle ? `${Math.round(hitData.launchAngle)}°` : "--";
    const totalDistance = hitData?.totalDistance ? `${hitData.totalDistance} ft` : "--";

    pitchResultHTML += `
    <div class="hit-data">
        <div>
            <span style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">EXIT VELO:</span>
            <span style="font-size: 14px; font-weight: bold; color: #333;">${launchSpeed}</span>
        </div>
        <div>
            <span style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">LAUNCH ANGLE:</span>
            <span style="font-size: 14px; font-weight: bold; color: #333;">${launchAngle}</span>
        </div>
        <div>
            <span style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">DISTANCE:</span>
            <span style="font-size: 14px; font-weight: bold; color: #333;">${totalDistance}</span>
        </div>
    </div>
    `;

    // Update play details content
    playDetailsContainer.innerHTML = pitchResultHTML;
}

function generatedSVGField(count, onBase) {
    const out1Fill = count.outs >= 1 ? '#000' : '#e5decf';
    const out2Fill = count.outs >= 2 ? '#000' : '#e5decf';
    const out3Fill = count.outs >= 3 ? '#000' : '#e5decf';

    const firstBaseFill = onBase.first ? '#000' : '#e5decf';
    const secondBaseFill = onBase.second ? '#000' : '#e5decf';
    const thirdBaseFill = onBase.third ? '#000' : '#e5decf';

    return `
        <svg id="field" width="110" height="110" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg" style="background: #e5decf;">
            <circle id="out-1" cx="13" cy="61" r="6" fill="${out1Fill}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <circle id="out-2" cx="30" cy="61" r="6" fill="${out2Fill}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <circle id="out-3" cx="47" cy="61" r="6" fill="${out3Fill}" stroke="#000" stroke-width="1" opacity="0.8"/>
            
            <rect id="third-base" x="17.6066" y="29.7071" width="14" height="14" transform="rotate(45 17.6066 29.7071)" fill="${thirdBaseFill}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <rect id="second-base" x="29.364" y="17.7071" width="14" height="14" transform="rotate(45 29.364 17.7071)" fill="${secondBaseFill}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <rect id="first-base" x="41.6066" y="29.7071" width="14" height="14" transform="rotate(45 41.6066 29.7071)" fill="${firstBaseFill}" stroke="#000" stroke-width="1" opacity="0.8"/>
        </svg>
    `;
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
                color: black;
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
                font-family: 'Rubik';
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
                background: #eee;
            }

            .away-team .team-header:hover {
                background: #b9b9b9;
            }

            .home-team .team-header {
                background: #eee;
            }

            .home-team .team-header:hover {
                background: #b9b9b9;
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

// Main function to load and render all plays
// Global variables for refresh management
let refreshInterval;
let lastPlayCount = 0;
let isRefreshActive = false;

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
        
        // Extract plays data and game status
        const allPlays = gameData.liveData?.plays?.allPlays || [];
        const gameInfo = gameData.gameData;
        const gameStatus = gameData.gameData?.status?.detailedState;
        
        // Update play count for change detection
        const currentPlayCount = allPlays.length;
        const hasNewPlays = currentPlayCount > lastPlayCount;
        lastPlayCount = currentPlayCount;
        
        // Only update UI if there are new plays or this is the initial load
        if (hasNewPlays || allPlaysContainer.children.length === 0) {
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
        }
        
        // Manage auto-refresh based on game status
        manageAutoRefresh(gameStatus);
        
    } catch (error) {
        console.error('Error loading all plays:', error);
        allPlaysContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6a6c;">Error loading plays data</div>';
        // Stop refreshing on error
        stopAutoRefresh();
    }
}

// Function to create game start item
function createGameStartItem(gameInfo) {
    const gameStartDiv = document.createElement('div');
    gameStartDiv.className = 'game-start-item';
    
    const venue = gameInfo.venue?.name || 'Unknown Venue';
    const gameDate = new Date(gameInfo.datetime?.dateTime || gameInfo.gameDate);
    const timeString = gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const city = gameInfo.venue.location.city || 'Unknown';
    const state = gameInfo.venue.location.state || 'Unknown';
    
    gameStartDiv.innerHTML = `
        <div style="font-weight: 400; margin-bottom: 4px; font-family: 'Rubik';">First Pitch</div>
        <div style="font-size: 20px; font-weight: 500; font-family: 'Rubik';">${timeString} &#8226; ${venue}</div>
        <div style="font-weight: 400; font-family: 'Rubik';">${city} &#8226; ${state}</div>
    `;
    
    return gameStartDiv;
}

// Function to create individual play item
function createPlayItem(play, gameData) {
    const playDiv = document.createElement('div');
    playDiv.className = 'play-item';

    const inning = play.about?.inning || 1;
    const isTop = play.about?.isTopInning;
    const inningText = `${isTop ? 'Top' : 'Bot'} ${inning}`;

    // Get player info
    const playerId = play.matchup?.batter?.id;
    const playerName = getPlayerName(playerId, gameData) || 'Unknown Player';

    // Create event icon
    const eventIcon = getEventIcon(play.result?.event);

    // Determine baserunners AFTER the play using 'postOn' fields
    const baserunners = {
        first: !!play.matchup?.postOnFirst, // true if not null, false if null
        second: !!play.matchup?.postOnSecond, // true if not null, false if null
        third: !!play.matchup?.postOnThird // true if not null, false if null
    };

    // Get outs after the play
    const outs = play.count?.outs || 0;

    // Inside the render loop
    const count = {
        balls: play.count?.balls || 0,
        strikes: play.count?.strikes || 0,
        outs: play.count?.outs || 0
    };

    // Try to find the first playEvent that contains hitData
    const statcastEvent = play.playEvents?.find(event => event?.hitData) || {};
    const statcastData = statcastEvent.hitData || {};

    // Try multiple possible data locations and log for debugging
    console.log('Play object:', play);
    console.log('Hit data:', statcastData);
    
    const exitVelo = statcastData.launchSpeed ? `${Math.round(statcastData.launchSpeed)} mph` : 
                     statcastData.exitVelocity ? `${Math.round(statcastData.exitVelocity)} mph` : '--';
    const launchAngle = statcastData.launchAngle ? `${Math.round(statcastData.launchAngle)}°` : '--';
    const distance = statcastData.totalDistance ? `${Math.round(statcastData.totalDistance)} ft` : 
                     statcastData.distance ? `${Math.round(statcastData.distance)} ft` : '--';

    const statcastStats = `
      <div class="statcast-stats" style="
        display: flex;
        gap: 16px;
        margin-top: 8px;
        padding: 8px;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-radius: 6px;
        border-left: 4px solid #ff6a6c;
        border-bottom: 1px solid #d7827e;
    ">
        <div class="stat-item" style="text-align: center; flex: 1;">
            <div style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">Exit Velo</div>
            <div style="font-size: 14px; font-weight: bold; color: #333;">${exitVelo}</div>
        </div>
        <div class="stat-item" style="text-align: center; flex: 1;">
            <div style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">Launch Angle</div>
            <div style="font-size: 14px; font-weight: bold; color: #333;">${launchAngle}</div>
        </div>
        <div class="stat-item" style="text-align: center; flex: 1;">
            <div style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">Distance</div>
            <div style="font-size: 14px; font-weight: bold; color: #333;">${distance}</div>
        </div>
    </div>
    `;

    // Updated innerHTML code block with SVG integration
    playDiv.innerHTML = `
        <div class="inning-indicator" style="
            position: absolute;
            top: 8px;
            left: 8px;
            background-color: #ff6a6c;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
        ">${inningText}</div>
        <div class="player-image-container" style="
            flex-shrink: 0;
            margin-right: 12px;
            margin-left: 55px;
            position: relative;
        ">
            <img class="player-image" style="
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: 2px solid #d7827e;
                background-color: #e5decf;
                object-fit: cover;
            " src="https://midfield.mlbstatic.com/v1/people/${playerId}/spots/60" alt="${playerName}">
            <div class="event-icon" style="
                position: absolute;
                bottom: -5px;
                right: -5px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background-color: #ff6a6c;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                color: white;
                border: 2px solid white;
            ">${eventIcon}</div>
        </div>
        <div class="content-wrapper" style="display: flex; flex: 1; align-items: flex-start; gap: 16px;">
            <div class="play-details" style="flex: 1; margin-top: 5px;">
                <div class="event-name" style="
                    border: 3px solid #2a283e;
                    color: black;
                    padding: 4px 8px;
                    border-radius: 10rem;
                    font-weight: bold;
                    font-size: 16px;
                    display: inline-block;
                    margin-bottom: 6px;
                ">${play.result?.event || 'Unknown Event'}</div>
                <p class="play-description" style="
                    color: #333;
                    font-size: 15px;
                    line-height: 1.3;
                    margin: 0 0 8px 0;
                    font-weight: 400;
                ">${play.result?.description || 'No description available'}</p>
                ${statcastStats}
            </div>
            <div class="game-situation" style="
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 8px;
                background: #e5decf;
                border-radius: 6px;
                margin-top: 5px;
                min-width: 90px;
            ">
                <div class="count-info" style="
                    font-size: 12px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 8px;
                    text-align: center;
                ">
                    <div> ${count.balls}-${count.strikes}</div>
                </div>
                <div class="field-display">
                    ${generateSVGField(count, baserunners)}
                </div>
            </div>
        </div>
    `;

    return playDiv;
}

// Helper function to get event icons
function getEventIcon(eventType) {
    const iconMap = {
        'Single': '1B',
        'Double': '2B',
        'Triple': '3B',
        'Home Run': 'HR',
        'Strikeout': 'K',
        'Groundout': 'OUT',
        'Flyout': 'OUT',
        'Walk': 'BB',
        'Hit By Pitch': 'HBP',
        'Lineout': 'OUT',
        'Sac Fly': 'SAC',
        'Pop Out': 'OUT',
        'Forceout': 'OUT',
        'Sac Bunt': 'OUT',
        'Bunt Pop Out': 'OUT',
        'Strikeout Double Play': 'OUT',
        'Grounded Into DP': 'DP',
        'Caught Stealing 2B': 'OUT',
        'Caught Stealing 3B': 'OUT',
        'Field Error': 'E',
        'Fielders Choice': 'FC',
        'Fielders Choice Out': 'OUT',
        'Double Play': 'OUT',
        'Catcher Interference': 'E2',
        'Pickoff Caught Stealing 2B': 'OUT',
        'Pickoff Caught Stealing 3B': 'OUT',
        'Pitching Substitution': '<img src="assets/icons/swap.png" alt="Pitching Substitution" class="event-icon" width="20" height="20">',
        'Intent Walk': 'BB',
        'Defensive Switch': '<img src="assets/icons/swap.png" alt="Pitching Substitution" class="event-icon" width="20" height="20">',
        'Offensive Switch': '<img src="assets/icons/swap.png" alt="Pitching Substitution" class="event-icon" width="20" height="20">',
        'Offensive Substitution': '<img src="assets/icons/swap.png" alt="Pitching Substitution" class="event-icon" width="20" height="20">'
    };
    
    return iconMap[eventType] || '?';
}

// Function to generate the SVG field
function generateSVGField(count, onBase) {
    return `
        <svg id="field-${Date.now()}" width="60" height="60" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg" style="background: transparent; border-radius: 4px;">
            <circle cx="13" cy="61" r="6" fill="${count.outs >= 1 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <circle cx="30" cy="61" r="6" fill="${count.outs >= 2 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <circle cx="47" cy="61" r="6" fill="${count.outs >= 3 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            
            <rect x="17.6066" y="29.7071" width="14" height="14" transform="rotate(45 17.6066 29.7071)" fill="${onBase.third ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <rect x="29.364" y="17.7071" width="14" height="14" transform="rotate(45 29.364 17.7071)" fill="${onBase.second ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <rect x="41.6066" y="29.7071" width="14" height="14" transform="rotate(45 41.6066 29.7071)" fill="${onBase.first ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
        </svg>
    `;
}

// Helper function to get player name from game data
function getPlayerName(playerId, gameData) {
    if (!playerId || !gameData.gameData?.players) return null;
    
    const player = gameData.gameData.players[`ID${playerId}`];
    return player ? `${player.firstName} ${player.lastName}` : null;
}

// Enhanced game status checker
async function checkGameStatus(gamePk) {
    try {
        const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
        const data = await response.json();
        return {
            detailedState: data.gameData.status.detailedState,
            statusCode: data.gameData.status.statusCode,
            abstractGameState: data.gameData.status.abstractGameState
        };
    } catch (error) {
        console.error('Error fetching game status:', error);
        return null;
    }
}

// Improved function to determine if game should refresh
function shouldRefresh(gameStatus) {
    if (!gameStatus) return false;
    
    // Games that should NOT refresh
    const finishedStates = [
        "Final", 
        "Game Over", 
        "Completed Early", 
        "Suspended",
        "Cancelled",
        "Postponed"
    ];
    
    const preGameStates = [
        "Pre-Game", 
        "Scheduled", 
        "Warmup"
    ];
    
    // Check detailed state first
    if (finishedStates.includes(gameStatus.detailedState || gameStatus)) {
        return false;
    }
    
    // Don't refresh pre-game states unless specifically requested
    if (preGameStates.includes(gameStatus.detailedState || gameStatus)) {
        return false;
    }
    
    // Live games should refresh
    if ((gameStatus.detailedState || gameStatus) === "Live" || 
        (gameStatus.detailedState || gameStatus) === "In Progress" ||
        gameStatus.abstractGameState === "Live") {
        return true;
    }
    
    // Default to not refreshing for unknown states
    return false;
}

// Auto-refresh management
function manageAutoRefresh(gameStatusData) {
    const gameStatus = typeof gameStatusData === 'string' ? 
        { detailedState: gameStatusData } : gameStatusData;
    
    if (shouldRefresh(gameStatus)) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
        console.log(`Game status: ${gameStatus.detailedState || gameStatusData} - Auto-refresh stopped`);
    }
}

// Start auto-refresh
function startAutoRefresh() {
    if (isRefreshActive) return; // Already running
    
    console.log('Starting auto-refresh for live game');
    isRefreshActive = true;
    
    refreshInterval = setInterval(async () => {
        // Only refresh if All Plays tab is active
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab && activeTab.id === 'all-plays-tab') {
            await conditionalRefresh();
        }
    }, 10000); // Refresh every 10 seconds for live games
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        isRefreshActive = false;
        console.log('Auto-refresh stopped');
    }
}

// Enhanced conditional refresh function
async function conditionalRefresh() {
    if (!gamePk) return;
    
    try {
        const gameStatus = await checkGameStatus(gamePk);
        
        if (gameStatus && shouldRefresh(gameStatus)) {
            console.log(`Game status: ${gameStatus.detailedState} - Refreshing...`);
            
            // Clear cached data to force fresh fetch
            delete window.cachedGameData;
            
            // Reload plays
            await loadAllPlays();
        } else if (gameStatus) {
            console.log(`Game status: ${gameStatus.detailedState} - Not refreshing`);
            stopAutoRefresh();
        }
    } catch (error) {
        console.error('Error in conditional refresh:', error);
        stopAutoRefresh();
    }
}

// Tab change handler - call this when switching tabs
function onTabChange(tabId) {
    if (tabId === 'all-plays-tab') {
        // When switching to All Plays tab, load data and potentially start refresh
        loadAllPlays();
    } else {
        // When switching away from All Plays tab, stop refreshing to save resources
        stopAutoRefresh();
    }
}

// Enhanced initialization
async function initializeAllPlays(gameId) {
    window.gamePk = gameId;
    
    // Reset state
    lastPlayCount = 0;
    stopAutoRefresh();
    
    // Load initial data
    await loadAllPlays();
}

// Cleanup function - call when extension is closed or game changes
function cleanup() {
    stopAutoRefresh();
    delete window.cachedGameData;
    lastPlayCount = 0;
}

// Function to inject CSS if not already added
function injectCSS() {
    if (!document.getElementById('game-situation-styles')) {
        const style = document.createElement('style');
        style.id = 'game-situation-styles';
        style.textContent = gamesituationCSS;
        document.head.appendChild(style);
    }
}

// Initialize function to call when your extension loads
async function initializePlayDisplay(gamePk, plays) {
    // Inject CSS
    injectCSS();
    
    // Load and display plays
    await loadAndDisplayPlays(gamePk, plays);
}

// Function to get baserunners from play data
function getBaserunners(play) {
    const baserunners = {
        first: false,
        second: false,
        third: false
    };
    
    // Use matchup.postOnFirst, postOnSecond, postOnThird to determine baserunners
    // These fields contain player info if someone is on base, null if empty
    if (play.matchup?.postOnFirst) {
        baserunners.first = true;
    }
    if (play.matchup?.postOnSecond) {
        baserunners.second = true;
    }
    if (play.matchup?.postOnThird) {
        baserunners.third = true;
    }
    
    return baserunners;
}

// Function to load and display plays
async function loadAndDisplayPlays(gamePk, plays) {
    try {
        const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
        const gameData = await response.json();
        
        const allPlays = gameData.liveData?.plays?.allPlays || [];
        const container = document.getElementById('plays-container') || document.body;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create and append play displays
        allPlays.forEach((play, index) => {
            const playDisplay = createPlayDisplay(play, allPlays, index);
            container.appendChild(playDisplay);
        });
        
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

// Add event listener for tab visibility changes (optional enhancement)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, stop refreshing to save resources
        stopAutoRefresh();
    } else {
        // Page is visible again, check if we need to resume refreshing
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab && activeTab.id === 'all-plays-tab') {
            loadAllPlays(); // This will restart refresh if needed
        }
    }
});

// Export functions for use in your extension
window.allPlaysManager = {
    initializeAllPlays,
    loadAllPlays,
    onTabChange,
    cleanup,
    startAutoRefresh,
    stopAutoRefresh
};

// Global variable to track refresh interval
let scoringPlaysRefreshInterval = null;

async function loadScoringPlays() {
    console.log('Loading scoring plays content');
    
    // Create or get all scoring plays 
    let scoringPlaysContainer = document.getElementById('scoring-plays-container');
    if (!scoringPlaysContainer) {
        scoringPlaysContainer = document.createElement('div');
        scoringPlaysContainer.id = 'scoring-plays-container';
        scoringPlaysContainer.style.cssText = `
            width: 100%;
            height: 400px;
            overflow-y: auto;
            padding: 10px;
            background-color: #e5decf;
            border-radius: 8px;
            font-family: Rubik, sans-serif;
            scrollbar-width: thin;
        `;
        document.getElementById('popup-container').appendChild(scoringPlaysContainer);
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

        // Get game state to determine if we should refresh
        const gameDetailedState = gameData.gameData?.status?.detailedState || '';
        const isLiveGame = gameDetailedState === 'Live';
        const isGameOver = gameDetailedState === 'Game Over' || gameDetailedState === 'Final';

        console.log('Game state:', gameDetailedState, 'Is live:', isLiveGame, 'Is over:', isGameOver);

        // Clear any existing refresh interval
        if (scoringPlaysRefreshInterval) {
            clearInterval(scoringPlaysRefreshInterval);
            scoringPlaysRefreshInterval = null;
        }

        // Set up auto-refresh for live games only
        if (isLiveGame) {
            scoringPlaysRefreshInterval = setInterval(async () => {
                console.log('Auto-refreshing scoring plays for live game');
                // Clear cache to force fresh data
                window.cachedGameData = null;
                await loadScoringPlays();
            }, 30000); // Refresh every 30 seconds for live games
        }

        // Extract plays data
        const scoringPlays = gameData.liveData?.plays?.scoringPlays || [];
        const allPlays = gameData.liveData?.plays?.allPlays || [];
        const gameInfo = gameData.gameData;

        // Clear existing content
        scoringPlaysContainer.innerHTML = '';

        // Add game status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            text-align: center;
            padding: 8px;
            margin-bottom: 10px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 14px;
            ${isLiveGame ? 'background-color: #28a745; color: white;' : 'background-color: #6c757d; color: white;'}
        `;
        statusIndicator.textContent = isLiveGame ? 
            `🔴 LIVE - Auto-refreshing every 30 seconds` : 
            `Game Status: ${gameDetailedState}`;
        scoringPlaysContainer.appendChild(statusIndicator);

        // Check if there are any scoring plays
        if (scoringPlays.length === 0) {
            const noPlaysMessage = document.createElement('p');
            noPlaysMessage.style.cssText = 'text-align: center; color: #666; margin-top: 20px;';
            noPlaysMessage.textContent = 'No scoring plays in this game.';
            scoringPlaysContainer.appendChild(noPlaysMessage);
            return;
        }

        // Get detailed play information for each scoring play
        scoringPlays.forEach((playIndex, index) => {
            // Find the corresponding play in allPlays array
            const play = allPlays[playIndex];
            
            if (play) {
                const playDiv = createScoringPlayItem(play, gameInfo, index);
                scoringPlaysContainer.appendChild(playDiv);
            }
        });

    } catch (error) {
        console.error('Error loading scoring plays:', error);
        
        // Clear any existing refresh interval on error
        if (scoringPlaysRefreshInterval) {
            clearInterval(scoringPlaysRefreshInterval);
            scoringPlaysRefreshInterval = null;
        }
        
        scoringPlaysContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 20px;">Error loading scoring plays. Please try again.</p>';
    }
}

// Helper function to create individual scoring play items
function createScoringPlayItem(play, gameInfo, index) {
    const playDiv = document.createElement('div');
    playDiv.className = 'play-item';
    playDiv.style.cssText = `
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;
        padding: 8px;
        background-color: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        opacity: 0;
        transform: translateY(-10px);
        animation: slideIn 0.3s ease-out forwards;
        animation-delay: ${index * 0.1}s;
        position: relative;
    `;

    // Get player information
    const batter = play.matchup?.batter;
    const playerId = batter?.id || '';
    const playerName = batter?.fullName || 'Unknown Player';

    // Get inning information
    const inningHalf = play.about?.halfInning === 'top' ? 'Top' : 'Bot';
    const inning = play.about?.inning || 1;
    const inningText = `${inningHalf} ${inning}`;

    // Get event icon based on play result
    const eventType = play.result?.event || '';
    let eventIcon = '⚾';
    if (eventType.includes('Home Run')) eventIcon = 'HR';
    else if (eventType.includes('Triple')) eventIcon = '3B';
    else if (eventType.includes('Double')) eventIcon = '2B';
    else if (eventType.includes('Single')) eventIcon = '1B';
    else if (eventType.includes('Sac')) eventIcon = 'SAC';
    else if (eventType.includes('Error')) eventIcon = 'E';
    else if (eventType.includes('Walk')) eventIcon = 'BB';
    else if (eventType.includes('Hit By Pitch')) eventIcon = 'HBP';
    else if (eventType.includes('Forceout')) eventIcon = 'OUT';
    else if (eventType.includes('Sac Bunt')) eventIcon = 'SAC';
    else if (eventType.includes('Grounded Into DP')) eventIcon = 'DP';
    else if (eventType.includes('Field Error')) eventIcon = 'E';
    else if (eventType.includes('Fielders Choice')) eventIcon = 'FC';
    else if (eventType.includes('Double Play')) eventIcon = 'OUT';
    else if (eventType.includes('Catcher Interference')) eventIcon = 'E2';
    else if (eventType.includes('Groundout')) eventIcon = 'OUT';

    // Get baserunners (pre-play state for visual context)
    const baserunners = getBaserunners(play);

    // Get count and outs
    const count = {
        balls: play.count?.balls || 0,
        strikes: play.count?.strikes || 0,
        outs: play.count?.outs || 0
    };

    // Create score and RBI info
    let scoreRbiInfo = '';
    if (play.result?.homeScore !== undefined && play.result?.awayScore !== undefined) {
        const awayTeam = gameInfo.teams?.away?.abbreviation || 'Away';
        const homeTeam = gameInfo.teams?.home?.abbreviation || 'Home';
        scoreRbiInfo += `<div style="color: #007bff; font-weight: bold; font-size: 13px; margin-top: 4px;">Score: ${awayTeam} ${play.result.awayScore} - ${homeTeam} ${play.result.homeScore}</div>`;
    }
    if (play.result?.rbi && play.result.rbi > 0) {
        scoreRbiInfo += `<div style="color: #28a745; font-weight: bold; font-size: 13px;">RBI: ${play.result.rbi}</div>`;
    }

    // Try to find the first playEvent that contains hitData
    const statcastEvent = play.playEvents?.find(event => event?.hitData) || {};
    const statcastData = statcastEvent.hitData || {};

    
    // Try multiple possible data locations and log for debugging
    console.log('Play object:', play);
    console.log('Hit data:', statcastData);
    
    const exitVelo = statcastData.launchSpeed ? `${Math.round(statcastData.launchSpeed)} mph` : 
                     statcastData.exitVelocity ? `${Math.round(statcastData.exitVelocity)} mph` : '--';
    const launchAngle = statcastData.launchAngle ? `${Math.round(statcastData.launchAngle)}°` : '--';
    const distance = statcastData.totalDistance ? `${Math.round(statcastData.totalDistance)} ft` : 
                     statcastData.distance ? `${Math.round(statcastData.distance)} ft` : '--';
    
    const statcastStats = `
        <div class="statcast-stats" style="
            display: flex;
            gap: 16px;
            margin-top: 8px;
            padding: 8px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 6px;
            border-left: 4px solid #ff6a6c;
            border-bottom: 1px solid #d7827e;
        ">
            <div class="stat-item" style="text-align: center; flex: 1;">
                <div style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">Exit Velo</div>
                <div style="font-size: 14px; font-weight: bold; color: #333;">${exitVelo}</div>
            </div>
            <div class="stat-item" style="text-align: center; flex: 1;">
                <div style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">Launch Angle</div>
                <div style="font-size: 14px; font-weight: bold; color: #333;">${launchAngle}</div>
            </div>
            <div class="stat-item" style="text-align: center; flex: 1;">
                <div style="font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase;">Distance</div>
                <div style="font-size: 14px; font-weight: bold; color: #333;">${distance}</div>
            </div>
        </div>
    `;

    playDiv.innerHTML = `
        <div class="inning-indicator" style="
            position: absolute;
            top: 8px;
            left: 8px;
            background-color: #ff6a6c;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
        ">${inningText}</div>
        <div class="player-image-container" style="
            flex-shrink: 0;
            margin-right: 12px;
            margin-left: 55px;
            position: relative;
        ">
            <img class="player-image" style="
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: 2px solid #d7827e;
                background-color: #e5decf;
                object-fit: cover;
            " src="https://midfield.mlbstatic.com/v1/people/${playerId}/spots/60" alt="${playerName}">
            <div class="event-icon" style="
                position: absolute;
                bottom: -5px;
                right: -5px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background-color: #ff6a6c;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                color: white;
                border: 2px solid white;
            ">${eventIcon}</div>
        </div>
        <div class="content-wrapper" style="display: flex; flex: 1; align-items: flex-start; gap: 16px;">
            <div class="play-details" style="flex: 1; margin-top: 5px;">
                <div class="event-name" style="
                    border: 3px solid #2a283e;
                    color: black;
                    padding: 4px 8px;
                    border-radius: 10rem;
                    font-weight: bold;
                    font-size: 16px;
                    display: inline-block;
                    margin-bottom: 6px;
                ">${play.result?.event || 'Unknown Event'}</div>
                <p class="play-description" style="
                    color: #333;
                    font-size: 15px;
                    line-height: 1.3;
                    margin: 0 0 8px 0;
                    font-weight: 400;
                ">${play.result?.description || 'No description available'}</p>
                ${scoreRbiInfo}
                ${statcastStats}
            </div>
            <div class="game-situation" style="
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 8px;
                background: #e5decf;
                border-radius: 6px;
                margin-top: 5px;
                min-width: 90px;
            ">
                <div class="count-info" style="
                    font-size: 12px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 8px;
                    text-align: center;
                ">
                    <div> ${count.balls}-${count.strikes}</div>
                </div>
                <div class="field-display">
                    ${generateSVGField(count, baserunners)}
                </div>
            </div>
        </div>
    `;

    return playDiv;
}

// Function to get baserunners from play data
function getBaserunners(play) {
    const baserunners = {
        first: false,
        second: false,
        third: false
    };
    
    // Use matchup.postOnFirst, postOnSecond, postOnThird to determine baserunners
    if (play.matchup?.postOnFirst) {
        baserunners.first = true;
    }
    if (play.matchup?.postOnSecond) {
        baserunners.second = true;
    }
    if (play.matchup?.postOnThird) {
        baserunners.third = true;
    }
    
    return baserunners;
}

// Function to generate the SVG field
function generateSVGField(count, onBase) {
    return `
        <svg width="60" height="60" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg" style="background: transparent; border-radius: 4px;">
            <circle cx="13" cy="61" r="6" fill="${count.outs >= 1 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <circle cx="30" cy="61" r="6" fill="${count.outs >= 2 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <circle cx="47" cy="61" r="6" fill="${count.outs >= 3 ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            
            <rect x="17.6066" y="29.7071" width="14" height="14" transform="rotate(45 17.6066 29.7071)" fill="${onBase.third ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <rect x="29.364" y="17.7071" width="14" height="14" transform="rotate(45 29.364 17.7071)" fill="${onBase.second ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
            <rect x="41.6066" y="29.7071" width="14" height="14" transform="rotate(45 41.6066 29.7071)" fill="${onBase.first ? '#000' : '#e5decf'}" stroke="#000" stroke-width="1" opacity="0.8"/>
        </svg>
    `;
}

// Function to clear refresh interval (call this when user switches tabs or closes extension)
function clearScoringPlaysRefresh() {
    if (scoringPlaysRefreshInterval) {
        clearInterval(scoringPlaysRefreshInterval);
        scoringPlaysRefreshInterval = null;
        console.log('Cleared scoring plays refresh interval');
    }
}

// Add slideIn animation keyframes to document if not already present
if (!document.querySelector('#scoring-plays-styles')) {
    const style = document.createElement('style');
    style.id = 'scoring-plays-styles';
    style.textContent = `
        @keyframes slideIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             