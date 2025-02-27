document.addEventListener("DOMContentLoaded", async () => {
    const popupContainer = document.createElement("div");
    popupContainer.id = "popup-container";

    const gameInfo = document.createElement("div");
    gameInfo.id = "game-info";

    // Team elements
    const awayLogo = document.createElement("img");
    awayLogo.id = "away-logo";
    awayLogo.classList.add("team-logo");

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

    // Append elements in the correct order
    gameInfo.appendChild(awayLogo);
    gameInfo.appendChild(awayScore);
    gameInfo.appendChild(inningInfo);
    gameInfo.appendChild(homeScore);
    gameInfo.appendChild(homeLogo);

    popupContainer.appendChild(gameInfo);
    document.body.appendChild(popupContainer);

    // Extract gamePk from the URL
    const params = new URLSearchParams(window.location.search);
    const gamePk = params.get("gamePk");

    if (gamePk) {
        fetchGameDetails(gamePk);
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
                } else {
                    const inningHalf = linescore.inningHalf ? (linescore.inningHalf === "Top" ? "TOP" : "BOT") : '';
                    const currentInning = linescore.currentInning || '';
                    inningText = `${inningHalf} ${currentInning}`;
                }

                // Set values to HTML
                awayLogo.src = `assets/${awayTeam.id}.svg`;
                awayLogo.alt = awayTeam.name;
                awayScore.textContent = awayScoreText;

                inningInfo.textContent = inningText;
                inningInfo.style = inningBoxStyle;

                homeScore.textContent = homeScoreText;
                homeLogo.src = `assets/${homeTeam.id}.svg`;
                homeLogo.alt = homeTeam.name;
            } else {
                inningInfo.textContent = "Game data unavailable.";
            }
        } catch (error) {
            console.error("Error fetching game details:", error);
            inningInfo.textContent = "Error loading game details.";
        }
    }
});
