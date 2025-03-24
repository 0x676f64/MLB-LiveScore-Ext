document.addEventListener("DOMContentLoaded", async () => {
    const gamesContainer = document.getElementById("games-container");

    const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    const apiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1`;

    function formatGameTime(gameDate) {
        const dateTime = new Date(gameDate);
        const hours = dateTime.getHours();
        const minutes = dateTime.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        return `${(hours % 12) || 12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    }

    function getDefaultAbbr(teamName) {
        // Create a simple default abbreviation if no specific abbreviation is found
        return teamName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3);
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
                gamesContainer.innerHTML = "<p>No games found for today.</p>";
                return;
            }

            data.dates[0].games.forEach(async (game) => {
                const gameBox = document.createElement("div");
                gameBox.classList.add("game-box");

                const homeTeam = game.teams.home.team.name;
                const awayTeam = game.teams.away.team.name;
                const homeScore = game.teams.home.score || 0;
                const awayScore = game.teams.away.score || 0;
                let status = game.status.detailedState;
                const homeTeamId = game.teams.home.team.id;
                const awayTeamId = game.teams.away.team.id;

                // Fetch game details to get abbreviations
                const gameDetails = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live`)
                .then(response => response.json())
                .catch(error => {
                    console.error("Error fetching game details:", error);
                    return null;
                });

                // Get abbreviations from the game details
                const homeAbbr = gameDetails?.gameData?.teams?.home?.abbreviation || getDefaultAbbr(homeTeam);
                const awayAbbr = gameDetails?.gameData?.teams?.away?.abbreviation || getDefaultAbbr(awayTeam);

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

                gamesContainer.appendChild(gameBox);
            });
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