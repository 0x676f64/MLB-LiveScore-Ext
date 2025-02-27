document.addEventListener("DOMContentLoaded", async () => {
    const gamesContainer = document.getElementById("games-container");
    
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const apiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1`;
    // statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today} is another good link, however
    // date={today} makes it so game-boxes change the second it turns 12am ET. Therefore users
    // recapping late at night, or after a West Coast game, will not see scores for the day 
    
    const teamAbbreviations = {
        "Arizona Diamondbacks": "ARI", "Atlanta Braves": "ATL", "Baltimore Orioles": "BAL", "Boston Red Sox": "BOS",
        "Chicago White Sox": "CWS", "Chicago Cubs": "CHC", "Cincinnati Reds": "CIN", "Cleveland Guardians": "CLE",
        "Colorado Rockies": "COL", "Detroit Tigers": "DET", "Houston Astros": "HOU", "Kansas City Royals": "KC",
        "Los Angeles Angels": "LAA", "Los Angeles Dodgers": "LAD", "Miami Marlins": "MIA", "Milwaukee Brewers": "MIL",
        "Minnesota Twins": "MIN", "New York Yankees": "NYY", "New York Mets": "NYM", "Athletics": "OAK",
        "Philadelphia Phillies": "PHI", "Pittsburgh Pirates": "PIT", "San Diego Padres": "SD", "San Francisco Giants": "SF",
        "Seattle Mariners": "SEA", "St. Louis Cardinals": "STL", "Tampa Bay Rays": "TB", "Texas Rangers": "TEX",
        "Toronto Blue Jays": "TOR", "Washington Nationals": "WSH"
    };
    
    async function fetchGameDetails(gamePk) {
        try {
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            const data = await response.json();
            
            if (data && data.liveData) {
                const linescore = data.liveData.linescore;
                const inningHalf = linescore.inningHalf ? (linescore.inningHalf === "Top" ? "TOP" : "BOT") : '';
                const currentInning = linescore.currentInning || '';
                return `${inningHalf} ${currentInning}`;
            }
        } catch (error) {
            console.error('Error fetching game details:', error);
        }
        return 'In Progress';
    }
    
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
            
            const homeAbbr = teamAbbreviations[homeTeam] || homeTeam;
            const awayAbbr = teamAbbreviations[awayTeam] || awayTeam;
            
            if (status === "In Progress") {
                status = await fetchGameDetails(game.gamePk);
            }
            
            gameBox.innerHTML = `
                <div class="game-status">${status}</div>
                <div class="team-row">
                    <img src="assets/${awayTeamId}.svg" alt="${awayAbbr} logo" class="team-logo">
                    <p class="team-abbr">${awayAbbr}</p>
                    <p class="team-score">${awayScore}</p>
                </div>
                <div class="team-row">
                    <img src="assets/${homeTeamId}.svg" alt="${homeAbbr} logo" class="team-logo">
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
});
