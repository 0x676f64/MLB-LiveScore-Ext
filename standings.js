document.addEventListener("DOMContentLoaded", async () => {
    const standingsContainer = document.getElementById("standings-container");
    const alTab = document.getElementById("al-tab");
    const nlTab = document.getElementById("nl-tab");

    if (!standingsContainer || !alTab || !nlTab) {
        console.error("Error: Required elements not found!");
        return;
    }

    // Add header section
    const headerContainer = document.createElement("div");
    headerContainer.classList.add("header-container");
    headerContainer.innerHTML = `
        <img src="assets/Group 1.png" alt="MLB Icon" class="header-logo">
        
    `;
    document.body.prepend(headerContainer);

    function getDivisionName(divisionId) {
        switch (divisionId) {
            case 201: return "AL EAST";
            case 202: return "AL CENTRAL";
            case 200: return "AL WEST";
            case 204: return "NL EAST";
            case 205: return "NL CENTRAL";
            case 203: return "NL WEST";
            default: return "Unknown Division";
        }
    }

    function calculateGamesBack(teams) {
        if (teams.length === 0) return [];

        // Sort teams by winning percentage
        const sortedTeams = teams.sort((a, b) => 
            parseFloat(b.winningPercentage) - parseFloat(a.winningPercentage)
        );

        const leadTeam = sortedTeams[0];
        
        return sortedTeams.map(team => {
            if (team === leadTeam) return '—'; // Leader is 0 GB

            // Calculate Games Back
            const winDiff = leadTeam.wins - team.wins;
            const lossDiff = team.losses - leadTeam.losses;
            const gamesBack = ((winDiff + lossDiff) / 2).toFixed(1);

            return gamesBack;
        });
    }

    async function loadStandings(league) {
        try {
            // Loading message
            standingsContainer.innerHTML = `<p>Loading ${league} Standings...</p>`;

            const response = await fetch("https://statsapi.mlb.com/api/v1/standings?leagueId=103,104");
            const data = await response.json();

            // Clear previous standings
            standingsContainer.innerHTML = "";

            // Filter and display standings based on league
            data.records.filter(record =>
                (league === "AL" && [201, 202, 200].includes(record.division.id)) ||
                (league === "NL" && [204, 205, 203].includes(record.division.id))
            ).forEach(record => {
                const divisionContainer = document.createElement("div");
                divisionContainer.classList.add("division-container");

                const divisionTitle = document.createElement("h2");
                divisionTitle.textContent = getDivisionName(record.division.id);
                divisionContainer.appendChild(divisionTitle);

                // Sort teams by winning percentage
                const sortedTeams = record.teamRecords.sort((a, b) => 
                    parseFloat(b.winningPercentage) - parseFloat(a.winningPercentage)
                );

                // Calculate Games Back
                const gamesBackArray = calculateGamesBack(sortedTeams);

                // Add header row
                const headerRow = document.createElement("div");
                headerRow.classList.add("team-row");
                headerRow.innerHTML = `
                    <span>Team</span>
                    <span>Wins</span>
                    <span>Losses</span>
                    <span>GB</span>
                    <span>Pct</span>
                `;
                divisionContainer.appendChild(headerRow);

                // Create team rows
                sortedTeams.forEach((team, index) => {
                    const teamRow = document.createElement("div");
                    teamRow.classList.add("team-row");
                    teamRow.innerHTML = `
                        <span>${team.team.name}</span>
                        <span>${team.wins}</span>
                        <span>${team.losses}</span>
                        <span>${gamesBackArray[index]}</span>
                        <span>${parseFloat(team.winningPercentage).toFixed(3)}</span>
                    `;
                    divisionContainer.appendChild(teamRow);
                });

                standingsContainer.appendChild(divisionContainer);
            });

            // Update active tab styling
            alTab.classList.toggle("active", league === "AL");
            nlTab.classList.toggle("active", league === "NL");

        } catch (error) {
            console.error("Error loading standings:", error);
            standingsContainer.innerHTML = "<p>Failed to load standings. Please try again later.</p>";
        }
    }

    // Tab click event listeners
    alTab.addEventListener("click", () => loadStandings("AL"));
    nlTab.addEventListener("click", () => loadStandings("NL"));

    // Load AL Standings by default
    loadStandings("AL");
});