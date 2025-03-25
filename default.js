document.addEventListener("DOMContentLoaded", async () => {
    const gamesContainer = document.getElementById("games-container");

    // Add header section
    const headerContainer = document.createElement("div");
    headerContainer.classList.add("header-container");
    headerContainer.innerHTML = `
        <img src="assets/Group 1.png" alt="MLB Icon" class="header-logo">
        
    `;
    document.body.prepend(headerContainer);

     // Add bottom navigation
     const navContainer = document.createElement("div");
     navContainer.classList.add("nav-container");
     navContainer.innerHTML = `
         <button onclick="window.location.href='default.html'" title="Home"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M224-288q45-35 70.5-85T320-480q0-57-25.5-107T224-672q-31 42-47.5 91T160-480q0 52 16.5 101t47.5 91Zm256 128q55 0 106.5-17.5T680-230q-57-46-88.5-111.5T560-480q0-73 31.5-138.5T680-730q-42-35-93.5-52.5T480-800q-55 0-106.5 17.5T280-730q57 46 88.5 111.5T400-480q0 73-31.5 138.5T280-230q42 35 93.5 52.5T480-160Zm256-128q31-42 47.5-91T800-480q0-52-16.5-101T736-672q-45 35-70.5 85T640-480q0 57 25.5 107t70.5 85ZM480-480Zm0 400q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg></button>
         <button onclick="window.location.href='standings.html'" title="Standings"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M120-80v-60h100v-30h-60v-60h60v-30H120v-60h120q17 0 28.5 11.5T280-280v40q0 17-11.5 28.5T240-200q17 0 28.5 11.5T280-160v40q0 17-11.5 28.5T240-80H120Zm0-280v-110q0-17 11.5-28.5T160-510h60v-30H120v-60h120q17 0 28.5 11.5T280-560v70q0 17-11.5 28.5T240-450h-60v30h100v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180 440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z"/></svg></button>
         <button onclick="window.location.href='stats.html'" title="Stats"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M120-120v-80l80-80v160h-80Zm160 0v-240l80-80v320h-80Zm160 0v-320l80 81v239h-80Zm160 0v-239l80-80v319h-80Zm160 0v-400l80-80v480h-80ZM120-327v-113l280-280 160 160 280-280v113L560-447 400-607 120-327Z"/></svg></button>
     `;
     document.body.appendChild(navContainer);

     const style = document.createElement('style');
    style.textContent = `
        .nav-container {
            display: flex;
            justify-content: space-around;
            background-color: #e5decf;
            padding: 10px;
            position: relative;
            align-items: center;
            height: 50px;
            bottom: 0;
            width: 160%;
            align-items: center;
            margin-right: auto;
            margin-left: auto;
            margin-top: 10px;
            
        }
        .nav-container button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 10px;
        }
        .nav-container svg {
            height: 28px;
            width: 28px;
            fill:rgb(59, 59, 59);
            transition: fill 0.4s; 
        }

        .nav-container svg:hover {
            fill: #D7827E;
            background-color: #e5decf;
        }
    `;
    document.head.appendChild(style);

    const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    const apiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`;

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
                gamesContainer.innerHTML = "<p>No games found for today.</p>";
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
