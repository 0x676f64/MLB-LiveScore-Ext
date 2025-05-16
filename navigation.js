document.addEventListener("DOMContentLoaded", () => {
    // Select navigation buttons
    const homeBtn = document.getElementById("home-btn");
    const standingsBtn = document.getElementById("standings-btn");
    const statsBtn = document.getElementById("stats-btn");
    const playerBtn = document.getElementById("player-btn");

    // Navigation function
    const navigateTo = (page) => {
        window.location.href = page;
    };

    // Add navigation event listeners
    if (homeBtn) {
        homeBtn.addEventListener("click", () => {
            navigateTo("default.html");
        });
    }

    if (standingsBtn) {
        standingsBtn.addEventListener("click", () => {
            navigateTo("standings.html");
        });
    }

    if (statsBtn) {
        statsBtn.addEventListener("click", () => {
            navigateTo("stats.html");
        });
    }

    if (playerBtn) {
        playerBtn.addEventListener("click", () => {
            navigateTo("player-stats.html");
        });
    }
});