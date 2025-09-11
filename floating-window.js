// Updated floating-window
// floating-window.js - Enhanced floating window management

class FloatingWindowManager {
    constructor() {
        this.windowId = null;
        this.isOpen = false;
        this.defaultWidth = 610;
        this.defaultHeight = 600; 
        this.minWidth = 610;       
        this.minHeight = 500;     
    }

    async openFloatingWindow() {
        try {
            if (this.windowId) {
                // If window exists, focus it
                await chrome.windows.update(this.windowId, { focused: true });
                return;
            }

            // Get current screen dimensions
            const displays = await chrome.system.display.getInfo();
            const primaryDisplay = displays[0];
            
            // Calculate center position
            const left = Math.round(
                primaryDisplay.bounds.left + 
                (primaryDisplay.bounds.width - this.defaultWidth) / 2
            );
            const top = Math.round(
                primaryDisplay.bounds.top + 
                (primaryDisplay.bounds.height - this.defaultHeight) / 2
            );

            const windowOptions = {
                url: 'floating-window.html', // Your HTML file
                type: 'popup',
                width: this.defaultWidth,
                height: this.defaultHeight,
                left: left,
                top: top,
                focused: true,
                alwaysOnTop: true, // Set to true if you want it always on top
            };

            const window = await chrome.windows.create(windowOptions);
            this.windowId = window.id;
            this.isOpen = true;

            // Listen for window close
            chrome.windows.onRemoved.addListener((closedWindowId) => {
                if (closedWindowId === this.windowId) {
                    this.windowId = null;
                    this.isOpen = false;
                }
            });

        } catch (error) {
            console.error('Error opening floating window:', error);
        }
    }

    async closeFloatingWindow() {
        if (this.windowId) {
            try {
                await chrome.windows.remove(this.windowId);
                this.windowId = null;
                this.isOpen = false;
            } catch (error) {
                console.error('Error closing floating window:', error);
            }
        }
    }

    async toggleFloatingWindow() {
        if (this.isOpen) {
            await this.closeFloatingWindow();
        } else {
            await this.openFloatingWindow();
        }
    }

    async resizeWindow(width, height) {
        if (this.windowId) {
            try {
                const updateInfo = {
                    width: Math.max(width, this.minWidth),
                    height: Math.max(height, this.minHeight)
                };
                await chrome.windows.update(this.windowId, updateInfo);
            } catch (error) {
                console.error('Error resizing window:', error);
            }
        }
    }

    async centerWindow() {
        if (this.windowId) {
            try {
                const displays = await chrome.system.display.getInfo();
                const primaryDisplay = displays[0];
                const window = await chrome.windows.get(this.windowId);
                
                const left = Math.round(
                    primaryDisplay.bounds.left + 
                    (primaryDisplay.bounds.width - window.width) / 2
                );
                const top = Math.round(
                    primaryDisplay.bounds.top + 
                    (primaryDisplay.bounds.height - window.height) / 2
                );

                await chrome.windows.update(this.windowId, { left, top });
            } catch (error) {
                console.error('Error centering window:', error);
            }
        }
    }
}

// Create global instance
const floatingWindowManager = new FloatingWindowManager();

// Message listener for communication with popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'openFloatingWindow':
            floatingWindowManager.openFloatingWindow();
            sendResponse({ success: true });
            break;
            
        case 'closeFloatingWindow':
            floatingWindowManager.closeFloatingWindow();
            sendResponse({ success: true });
            break;
            
        case 'toggleFloatingWindow':
            floatingWindowManager.toggleFloatingWindow();
            sendResponse({ success: true });
            break;
            
        case 'resizeFloatingWindow':
            floatingWindowManager.resizeWindow(request.width, request.height);
            sendResponse({ success: true });
            break;
            
        case 'centerFloatingWindow':
            floatingWindowManager.centerWindow();
            sendResponse({ success: true });
            break;
            
        case 'getFloatingWindowStatus':
            sendResponse({ 
                isOpen: floatingWindowManager.isOpen,
                windowId: floatingWindowManager.windowId 
            });
            break;
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FloatingWindowManager;
}

document.addEventListener('DOMContentLoaded', async () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (darkModeToggle) {
        // Set initial state
        const isDark = await window.darkModeManager.isDarkModeEnabled();
        if (isDark) {
            darkModeToggle.classList.add('active');
        }

        // Toggle dark mode when clicked
        darkModeToggle.addEventListener('click', async () => {
            await window.darkModeManager.toggle();
        });
    }

    // Listen for dark mode changes (useful if you have multiple toggles)
    document.addEventListener('darkModeChanged', (event) => {
        console.log('Dark mode changed:', event.detail.isDark);
        // You can add additional logic here if needed
    });
});

       // Enhanced MLB games functionality with datepicker
document.addEventListener("DOMContentLoaded", async () => {
    const gamesContainer = document.getElementById("games-container");
    const dateInput = document.getElementById("date-input");
    const applyButton = document.querySelector('.apply');
    const datepickerContainer = document.querySelector('.datepicker');
    
    // Get the current "baseball date" - if before 9am, use previous day
    function getCurrentBaseballDate() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // If it's before 9am, use previous day's games
        if (currentHour < 9) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return formatDateForAPI(yesterday);
        }
        
        return formatDateForAPI(now);
    }
    
    // Format date for API (YYYY-MM-DD)
    function formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Format game time to local time
    function formatGameTime(gameDate) {
        const dateTime = new Date(gameDate);
        return dateTime.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
    }

    // Fetch team abbreviation
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

    // Fetch live game details for in-progress games
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

    // Main function to fetch and display games for a specific date
    async function fetchGameData(selectedDate) {
        const apiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${selectedDate}`;
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            gamesContainer.innerHTML = "";

            if (!data.dates.length || !data.dates[0].games.length) {
                gamesContainer.innerHTML = `<p>No games found for ${selectedDate}...</p>`;
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

                // Format status based on game state
                if (status === "Final" || status === "Game Over" || status === "Completed Early") {
                    status = "FINAL";
                } else if (status === "Pre-Game" || status === "Scheduled") {
                    status = formatGameTime(game.gameDate);
                } else if (status === "In Progress") {
                    status = await fetchGameDetails(game.gamePk);
                }

                const isDarkMode = document.body.classList.contains("dark-mode");

                const homeLogoSrc = isDarkMode
                    ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${homeTeamId}.svg`
                    : `https://www.mlbstatic.com/team-logos/${homeTeamId}.svg`;

                const awayLogoSrc = isDarkMode
                    ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${awayTeamId}.svg`
                    : `https://www.mlbstatic.com/team-logos/${awayTeamId}.svg`;

                gameBox.innerHTML = `
                    <div class="game-status">${status}</div>
                    <div class="team-row">
                        <img src="${awayLogoSrc}" alt="${awayAbbr} logo" class="team-logo">
                        <p class="team-abbr">${awayAbbr}</p>
                        <p class="team-score">${awayScore}</p>
                    </div>
                    <div class="team-row">
                        <img src="${homeLogoSrc}" alt="${homeAbbr} logo" class="team-logo">
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
                if (a.gameStatus.includes("TOP") || a.gameStatus.includes("BOT")) return -1;
                if (b.gameStatus.includes("TOP") || b.gameStatus.includes("BOT")) return 1;
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

    // Auto-refresh function for live games (only for today's date)
    async function autoRefreshGames() {
        const currentSelectedDate = dateInput.value;
        const todaysBaseballDate = getCurrentBaseballDate();
        
        // Only auto-refresh if we're viewing today's games
        if (currentSelectedDate === todaysBaseballDate) {
            await fetchGameData(currentSelectedDate);
        }
    }

    // Initialize datepicker and load initial data
    function initializeDatepicker() {
        const today = getCurrentBaseballDate();
        dateInput.value = today;
        fetchGameData(today);
        
        // Set min and max dates for the datepicker
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - 15000); // Allow 41 years back
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 15000); // Allow 41 years forward
        
        dateInput.min = formatDateForAPI(minDate);
        dateInput.max = formatDateForAPI(maxDate);
    }

    // Event listeners for datepicker
    applyButton.addEventListener('click', () => {
        const selectedDate = dateInput.value;
        if (selectedDate) {
            fetchGameData(selectedDate);
            datepickerContainer.hidden = true;
        }
    });

    // Optional: Apply date on Enter key press
    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const selectedDate = dateInput.value;
            if (selectedDate) {
                fetchGameData(selectedDate);
                datepickerContainer.hidden = true;
            }
        }
    });

    // Optional: Show/hide datepicker on input focus
    dateInput.addEventListener('focus', () => {
        datepickerContainer.hidden = false;
    });

    // Initialize the extension
    initializeDatepicker();

    // Open floating window
document.getElementById('openFloatingBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openFloatingWindow' });
    window.close(); // Close popup
});

// Toggle floating window  
document.getElementById('toggleFloatingBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'toggleFloatingWindow' });
    window.close(); // Close popup
});

    // Set up interval to refresh games every 30 seconds (only for today's games)
    setInterval(autoRefreshGames, 30000);
    
    // Check every minute if we need to update the "baseball date" at 9am
    setInterval(() => {
        const currentBaseballDate = getCurrentBaseballDate();
        if (dateInput.value !== currentBaseballDate) {
            // If the baseball date has changed (crossed 9am), update to new date
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Only auto-update if it's exactly 9:00am (within the check interval)
            if (currentHour === 9 && currentMinute === 0) {
                dateInput.value = currentBaseballDate;
                fetchGameData(currentBaseballDate);
            }
        }
    }, 60000); // Check every minute
});