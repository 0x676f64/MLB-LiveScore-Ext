document.addEventListener("DOMContentLoaded", async () => {
    const gamesContainer = document.getElementById("games-container");

    // Add header section
    const headerContainer = document.createElement("div");
    headerContainer.classList.add("header-container");
    headerContainer.innerHTML = `
        <img src="assets/Group 1.png" alt="MLB Icon" class="header-logo">
        
    `;
    document.body.prepend(headerContainer);

    const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    const apiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1`;

    function formatGameTime(gameDate) {
        const dateTime = new Date(gameDate);
        const hours = dateTime.getHours();
        const minutes = dateTime.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        return `${(hours % 12) || 12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    }

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

    async function fetchGameDetails(gamePk) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const data = await response.json();

            if (data && data.liveData) {
                const linescore = data.liveData.linescore;
                const inningHalf = linescore.inningHalf ? (linescore.inningHalf === "Top" ? "TOP" : "BOT") : "";
                const currentInning = linescore.currentInning || "";
                return `${inningHalf} ${currentInning}`;
            }
        } catch (error) {
            console.error("Error fetching game details:", error);
        }
        return "In Progress";
    }

    async function refreshGames() {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            gamesContainer.innerHTML = ""; // Clear container before adding new data

            if (!data.dates.length) {
                gamesContainer.innerHTML = "<p>No games found for today...</p>";
                return;
            }

            const gameBoxes = await Promise.all(data.dates[0].games.map(async (game) => {
                const gameBox = document.createElement("div");
                gameBox.classList.add("game-box");

                const homeTeam = game.teams.home.team.name;
                const awayTeam = game.teams.away.team.name;
                const homeScore = game.teams.home.score || 0;
                const awayScore = game.teams.away.score || 0;
                let status = game.status.detailedState;
                const homeTeamId = game.teams.home.team.id;
                const awayTeamId = game.teams.away.team.id;

                const homeAbbr = await fetchAbbreviation(homeTeamId);
                const awayAbbr = await fetchAbbreviation(awayTeamId);

                if (status === "Final" || status === "Game Over" || status === "Completed Early") {
                    status = "FINAL";
                } else if (status === "Pre-Game" || status === "Scheduled") {
                    status = formatGameTime(game.gameDate);
                } else if (status === "In Progress") {
                    status = await fetchGameDetails(game.gamePk);
                }

                gameBox.innerHTML = `
                    <div class="game-status">${status}</div>
                    <div class="team-row">
                        <img src="https://www.mlbstatic.com/team-logos/${awayTeamId}.svg" alt="${awayAbbr} logo" class="team-logo">
                        <p class="team-abbr">${awayAbbr}</p>
                        <p class="team-score">${awayScore}</p>
                    </div>
                    <div class="team-row">
                        <img src="https://www.mlbstatic.com/team-logos/${homeTeamId}.svg" alt="${homeAbbr} logo" class="team-logo">
                        <p class="team-abbr">${homeAbbr}</p>
                        <p class="team-score">${homeScore}</p>
                    </div>
                `;

                gameBox.addEventListener("click", () => {
                    window.location.href = `popup.html?gamePk=${game.gamePk}`;
                });

                return { gameBox, gameStatus: status, gameDate: new Date(game.gameDate) };
            }));

            // Sort games: Live on top, then Scheduled by time, then Final
            gameBoxes.sort((a, b) => {
                if (a.gameStatus === "In Progress" && b.gameStatus !== "In Progress") return -1;
                if (b.gameStatus === "In Progress" && a.gameStatus !== "In Progress") return 1;
                if (a.gameStatus === "FINAL" && b.gameStatus !== "FINAL") return 1;
                if (b.gameStatus === "FINAL" && a.gameStatus !== "FINAL") return -1;
                return a.gameDate - b.gameDate;
            });

            gameBoxes.forEach(({ gameBox }) => gamesContainer.appendChild(gameBox));
        } catch (error) {
            console.error("Error fetching game data:", error);
            gamesContainer.innerHTML = "<p>Failed to load games.</p>";
        }
    }

    // Initial fetch of games
    await refreshGames();

    // Set up interval to refresh games every 10 seconds
    setInterval(refreshGames, 10000);
});

// In the script where users click on game boxes
function onGameClick(gameId) {
    // Save the current view state
    chrome.storage.local.set({
        'currentView': 'game',
        'currentGameId': gameId
    }, function() {
        // Navigate to the game view
        window.location.href = 'popup.html';
    });
}
