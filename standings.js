document.addEventListener("DOMContentLoaded", async () => {
    const standingsContainer = document.getElementById("standings-container");
    const alTab = document.getElementById("al-tab");
    const nlTab = document.getElementById("nl-tab");
    const wildcardTab = document.getElementById("wildcard-tab");

    if (!standingsContainer || !alTab || !nlTab || !wildcardTab) {
        console.error("Error: Required elements not found!");
        return;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const body = document.body;
        const html = document.documentElement;
      
        // Calculate the actual content height
        const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        
        // Resize the popup to fit content
        chrome.runtime.sendMessage({ action: "resizePopup", height });
      });

      function adjustBodyHeight() {
        const body = document.body;
        const html = document.documentElement;

        // Calculate the total height of the content
        const totalHeight = Math.max(
            body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight
        );

        // Set the body's height to the total content height
        body.style.height = totalHeight + 'px';
    }

    // Call the function when the page loads and when the content changes
    window.onload = adjustBodyHeight;
    // If you dynamically add content, call adjustBodyHeight() after adding it.
      

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

            if (league === "WC") {
            const alWildcardTeams = [];
            const nlWildcardTeams = [];

            data.records.forEach(record => {
                record.teamRecords.forEach(team => {
                    if (team.wildCardRank) {
                        if (record.league.id === 103 && parseInt(team.wildCardRank) <= 5) {
                            alWildcardTeams.push(team);
                        } else if (record.league.id === 104 && parseInt(team.wildCardRank) <= 5) {
                            nlWildcardTeams.push(team);
                        }
                    }
                });
            });

            // Sort Wild Card teams by their wildCardRank
            const sortAlWildcardTeams = alWildcardTeams.sort((a, b) => parseInt(a.wildCardRank) - parseInt(b.wildCardRank));
            const sortNlWildcardTeams = nlWildcardTeams.sort((a, b) => parseInt(a.wildCardRank) - parseInt(b.wildCardRank));

            // Create Wild Card containers
            const createWildcardStandings = (wildcardTeams, leagueName) => {
                const wildcardContainer = document.createElement("div");
                wildcardContainer.classList.add("wildcard-container");

                const wildcardTitle = document.createElement("h2");
                wildcardTitle.textContent = `${leagueName} WILD CARD`;
                wildcardContainer.appendChild(wildcardTitle);

                // Add header row
                const headerRow = document.createElement("div");
                headerRow.classList.add("team-row");
                headerRow.innerHTML = `
                    <span>Team</span>
                    <span>W</span>
                    <span>L</span>
                    <span>Rank</span>
                    <span>Pct</span>
                `;
                wildcardContainer.appendChild(headerRow);

               // Create team rows
                wildcardTeams.forEach((team, index) => {
                    const teamRow = document.createElement("div");
                    teamRow.classList.add("team-row", "wildcard-team-row");
                    
                    // Add class for first non-playoff team (4th place)
                    if (parseInt(team.wildCardRank) === 4) {
                        teamRow.classList.add("playoff-cutoff");
                    }
                    // Creates red line for all non-playoff wildcard teams (after 3rd place ... 4th place)
                    teamRow.innerHTML = `
                        <span><img src="https://www.mlbstatic.com/team-logos/${team.team.id}.svg" alt="${team.team.name} Logo" class="team-logo-standing"></span>
                        <span>${team.wins}</span>
                        <span>${team.losses}</span>
                        <span>${team.wildCardRank}</span>
                        <span>${parseFloat(team.winningPercentage).toFixed(3)}</span>
                    `;
                    wildcardContainer.appendChild(teamRow);
                });

                return wildcardContainer;
            };

            // Create and append Wild Card standings
            const alWildcardStandings = createWildcardStandings(sortAlWildcardTeams, "AL");
            const nlWildcardStandings = createWildcardStandings(sortNlWildcardTeams, "NL");

            standingsContainer.appendChild(alWildcardStandings);
            standingsContainer.appendChild(nlWildcardStandings);

        } else {
            // Existing division standings logic (remains the same)
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
                    <span>W</span>
                    <span>L</span>
                    <span>GB</span>
                    <span>Pct</span>
                `;
                divisionContainer.appendChild(headerRow);

                // Create team rows
                sortedTeams.forEach((team, index) => {
                    const teamRow = document.createElement("div");
                    teamRow.classList.add("team-row");
                    teamRow.innerHTML = `
                        <span><img src="https://www.mlbstatic.com/team-logos/${team.team.id}.svg" alt="${team.team.name} Logo" class="team-logo-standing"></span>
                        <span>${team.wins}</span>
                        <span>${team.losses}</span>
                        <span>${gamesBackArray[index]}</span>
                        <span>${parseFloat(team.winningPercentage).toFixed(3)}</span>
                    `;
                    divisionContainer.appendChild(teamRow);
                });

                standingsContainer.appendChild(divisionContainer);
            });
        }

        // Update active tab styling
        alTab.classList.toggle("active", league === "AL");
        nlTab.classList.toggle("active", league === "NL");
        wildcardTab.classList.toggle("active", league === "WC");

    } catch (error) {
        console.error("Error loading standings:", error);
        standingsContainer.innerHTML = "<p>Failed to load standings. Please try again later.</p>";
    }
}

    // Tab click event listeners
    alTab.addEventListener("click", () => loadStandings("AL"));
    nlTab.addEventListener("click", () => loadStandings("NL"));
    wildcardTab.addEventListener("click", () => loadStandings("WC"));

    // Load AL Standings by default
    loadStandings("AL");
});