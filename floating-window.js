// Updated floating-window
// floating-window.js - Enhanced floating window management with fixed scorebug

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

// Fixed Baseball Bases/Outs SVG Functions
function createBasesOutsSVG(basesStatus = {}, outsCount = 0) {
    // Default empty bases status if not provided
    const bases = {
        first: basesStatus.first || false,
        second: basesStatus.second || false,
        third: basesStatus.third || false
    };
    
    return `
        <svg class="svg-scorebug" width="200" height="200" viewBox="0 0 58 79" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px;">
            <!-- Outs circles -->
            <circle class="out-circle" cx="13" cy="61" r="6" fill="${outsCount >= 1 ? '#bf0d3e' : '#e2e8f0'}" stroke="#bf0d3e" stroke-width="1" opacity="0.8"/>
            <circle class="out-circle" cx="30" cy="61" r="6" fill="${outsCount >= 2 ? '#bf0d3e' : '#e2e8f0'}" stroke="#bf0d3e" stroke-width="1" opacity="0.8"/>
            <circle class="out-circle" cx="47" cy="61" r="6" fill="${outsCount >= 3 ? '#bf0d3e' : '#e2e8f0'}" stroke="#bf0d3e" stroke-width="1" opacity="0.8"/>
            
            <!-- Bases (diamond shaped) -->
            <rect id="third-base" x="17.6066" y="29.7071" width="14" height="14" transform="rotate(45 17.6066 29.7071)" fill="${bases.third ? '#bf0d3e' : '#e2e8f0'}" stroke="#bf0d3e" stroke-width="1" opacity="0.8"/>
            <rect id="second-base" x="29.364" y="17.7071" width="14" height="14" transform="rotate(45 29.364 17.7071)" fill="${bases.second ? '#bf0d3e' : '#e2e8f0'}" stroke="#bf0d3e" stroke-width="1" opacity="0.8"/>
            <rect id="first-base" x="41.6066" y="29.7071" width="14" height="14" transform="rotate(45 41.6066 29.7071)" fill="${bases.first ? '#bf0d3e' : '#e2e8f0'}" stroke="#bf0d3e" stroke-width="1" opacity="0.8"/>
        </svg>
    `;
}

function updateBasesOutsSVG(svg, basesStatus, outsCount) {
    if (!svg) return;
    
    const bases = {
        first: svg.querySelector('#first-base'),
        second: svg.querySelector('#second-base'),
        third: svg.querySelector('#third-base')
    };
    
    // Update bases status
    if (bases.first) {
        bases.first.setAttribute('fill', basesStatus?.first ? '#bf0d3e' : '#e2e8f0');
    }
    if (bases.second) {
        bases.second.setAttribute('fill', basesStatus?.second ? '#bf0d3e' : '#e2e8f0');
    }
    if (bases.third) {
        bases.third.setAttribute('fill', basesStatus?.third ? '#bf0d3e' : '#e2e8f0');
    }
    
    // Update outs status
    const outCircles = svg.querySelectorAll('.out-circle');
    outCircles.forEach((circle, index) => {
        const fillColor = index < outsCount ? '#bf0d3e' : '#e2e8f0';
        circle.setAttribute('fill', fillColor);
    });
}

// Enhanced function to get live game data including bases/outs
async function fetchLiveGameData(gamePk) {
    try {
        const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
        const data = await response.json();

        if (data && data.liveData) {
            const linescore = data.liveData.linescore;
            
            // Get inning info
            const inningHalf = linescore.inningHalf ? 
                (linescore.inningHalf === "Top" ? "TOP" : "BOT") : "";
            const currentInning = linescore.currentInning || "";
            const inningDisplay = `${inningHalf} ${currentInning}`;
            
            // Get bases status - handle different possible data structures
            const basesStatus = {
                first: linescore.offense?.first || linescore.offense?.runner1 || false,
                second: linescore.offense?.second || linescore.offense?.runner2 || false,
                third: linescore.offense?.third || linescore.offense?.runner3 || false
            };
            
            // Get outs count
            const outsCount = linescore.outs || 0;
            
            // Check if game is actually live
            const gameStatus = data.gameData?.status?.statusCode;
            const isLive = gameStatus === 'I' || gameStatus === 'IP'; // In progress
            
            return {
                inningDisplay,
                basesStatus,
                outsCount,
                isLive,
                gameStatus: data.gameData?.status?.detailedState || 'Unknown'
            };
        }
    } catch (error) {
        console.error("Error fetching live game data:", error);
    }
    
    return {
        inningDisplay: "In Progress",
        basesStatus: { first: false, second: false, third: false },
        outsCount: 0,
        isLive: false,
        gameStatus: 'Error'
    };
}

// Function to inject the SVG into a game box for live games
function injectBasesOutsSVG(gameBoxElement, basesStatus, outsCount) {
    // Find or create container for the SVG (to the right of game info)
    let svgContainer = gameBoxElement.querySelector('.score-bug-container');
    
    if (!svgContainer) {
        svgContainer = document.createElement('div');
        svgContainer.className = 'score-bug-container';
        svgContainer.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
        `;
        gameBoxElement.style.position = 'relative'; // Ensure parent is positioned
        gameBoxElement.appendChild(svgContainer);
    }
    
    // Update the SVG content
    svgContainer.innerHTML = createBasesOutsSVG(basesStatus, outsCount);
}

// Function to update live game displays with bases/outs info
async function updateLiveGameDisplays() {
    const gameBoxes = document.querySelectorAll('.game-box[data-game-pk]');
    
    for (const gameBox of gameBoxes) {
        const gamePk = gameBox.getAttribute('data-game-pk');
        if (!gamePk) continue;
        
        const gameData = await fetchLiveGameData(gamePk);
        
        if (gameData.isLive) {
            // Inject the bases/outs SVG
            injectBasesOutsSVG(gameBox, gameData.basesStatus, gameData.outsCount);
            
            // Update inning display if element exists
            const inningElement = gameBox.querySelector('.inning-display');
            if (inningElement) {
                inningElement.textContent = gameData.inningDisplay;
            }
        }
    }
}

function updateGameBox(gameBox, game, awayTeamAbbr, homeTeamAbbr, inningInfo, inningClass, awayRecord = '', homeRecord = '', basesStatus = null, outsCount = 0, showScoreBug = false) {
    
    const newContent = `
        <div class="new-content">
            <a href="/gamefeed?gamePk=${game.gamePk}">
                <div class="schedule game-schedule">
                    <table>
                        <tbody>
                            <tr>
                                <td class="team-logo">
                                    <img src="https://www.mlbstatic.com/team-logos/${game.teams.away.team.id}.svg" 
                                         alt="${game.teams.away.team.name}">
                                </td>
                                <td class="team">${awayTeamAbbr}</td>
                                <td class="record">${awayRecord}</td>
                                <td class="score">${game.teams.away.score !== undefined ? game.teams.away.score : ''}</td>
                                <td rowspan="2" class="${inningClass}">${inningInfo}</td>
                            </tr>
                            <tr>
                                <td class="team-logo">
                                    <img src="https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg" 
                                         alt="${game.teams.home.team.name}">
                                </td>
                                <td class="team">${homeTeamAbbr}</td>
                                <td class="record">${homeRecord}</td>
                                <td class="score">${game.teams.home.score !== undefined ? game.teams.home.score : ''}</td>
                            </tr>
                            ${showScoreBug && inningClass === 'inning' ? 
                                `<tr><td colspan="5" class="score-bug-container">${createBasesOutsSVG(basesStatus, outsCount)}</td></tr>` : 
                                ''}
                        </tbody>
                    </table>
                </div>
            </a>
        </div>
    `;
    
    gameBox.innerHTML = newContent;
    
    // Update SVG if it's shown and game is in progress
    if (showScoreBug && inningClass === 'inning') {
        const svgElement = gameBox.querySelector('svg');
        if (svgElement && basesStatus !== null && outsCount !== undefined) {
            // Small delay to ensure SVG is rendered
            setTimeout(() => {
                updateBasesOutsSVG(svgElement, basesStatus, outsCount);
            }, 100);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (darkModeToggle) {
        // Set initial state
        const isDark = await window.darkModeManager?.isDarkModeEnabled();
        if (isDark) {
            darkModeToggle.classList.add('active');
        }

        // Toggle dark mode when clicked
        darkModeToggle.addEventListener('click', async () => {
            await window.darkModeManager?.toggle();
        });
    }

    // Listen for dark mode changes
    document.addEventListener('darkModeChanged', (event) => {
        console.log('Dark mode changed:', event.detail.isDark);
    });
});

// Enhanced MLB games functionality with fixed scorebug integration
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
                gameBox.setAttribute("data-game-pk", game.gamePk); // Add this for live updates

                const homeTeam = game.teams.home.team.name;
                const awayTeam = game.teams.away.team.name;
                const homeScore = game.teams.home.score || 0;
                const awayScore = game.teams.away.score || 0;
                let status = game.status.detailedState;
                const homeTeamId = game.teams.home.team.id;
                const awayTeamId = game.teams.away.team.id;

                const homeAbbr = await fetchAbbreviation(homeTeamId);
                const awayAbbr = await fetchAbbreviation(awayTeamId);

                // Initialize live game data
                let liveGameData = null;
                let showScoreBug = false;

                // Format status and get live data for in-progress games
                if (status === "Final" || status === "Game Over" || status === "Completed Early") {
                    status = "FINAL";
                } else if (status === "Pre-Game" || status === "Scheduled") {
                    status = formatGameTime(game.gameDate);
                } else if (status === "In Progress") {
                    // Fetch live game data for scorebug
                    liveGameData = await fetchLiveGameData(game.gamePk);
                    status = liveGameData.inningDisplay;
                    showScoreBug = true;
                }

                const isDarkMode = document.body.classList.contains("dark-mode");

                const homeLogoSrc = isDarkMode
                    ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${homeTeamId}.svg`
                    : `https://www.mlbstatic.com/team-logos/${homeTeamId}.svg`;

                const awayLogoSrc = isDarkMode
                    ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${awayTeamId}.svg`
                    : `https://www.mlbstatic.com/team-logos/${awayTeamId}.svg`;

                // Create the game box content with scorebug positioned on the right
                let gameBoxContent = `
                    <div class="game-content-wrapper ${showScoreBug ? 'with-scorebug' : ''}">
                        <div class="game-main-content">
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
                        </div>
                        ${showScoreBug && liveGameData ? `
                            <div class="score-bug-container">
                                ${createBasesOutsSVG(liveGameData.basesStatus, liveGameData.outsCount)}
                            </div>
                        ` : ''}
                    </div>
                `;

                gameBox.innerHTML = gameBoxContent;

                // Update scorebug after content is added
                if (showScoreBug && liveGameData) {
                    setTimeout(() => {
                        const svgElement = gameBox.querySelector('svg');
                        if (svgElement) {
                            updateBasesOutsSVG(svgElement, liveGameData.basesStatus, liveGameData.outsCount);
                        }
                    }, 100);
                }

                gameBox.addEventListener("click", () => {
                    window.location.href = `floating-pop.html?gamePk=${game.gamePk}`;
                });

                return { 
                    gameBox, 
                    gameStatus: status, 
                    gameDate: new Date(game.gameDate),
                    isLive: showScoreBug
                };
            }));

            // Sort games: Live on top, then Scheduled by time, then Final
            gameBoxes.sort((a, b) => {
                if (a.isLive && !b.isLive) return -1;
                if (b.isLive && !a.isLive) return 1;
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
        minDate.setDate(minDate.getDate() - 15000);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 15000);
        
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

    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const selectedDate = dateInput.value;
            if (selectedDate) {
                fetchGameData(selectedDate);
                datepickerContainer.hidden = true;
            }
        }
    });

    dateInput.addEventListener('focus', () => {
        datepickerContainer.hidden = false;
    });

    // Initialize the extension
    initializeDatepicker();

    // Floating window buttons
    const openFloatingBtn = document.getElementById('openFloatingBtn');
    const toggleFloatingBtn = document.getElementById('toggleFloatingBtn');

    if (openFloatingBtn) {
        openFloatingBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openFloatingWindow' });
            window.close();
        });
    }

    if (toggleFloatingBtn) {
        toggleFloatingBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'toggleFloatingWindow' });
            window.close();
        });
    }

    // Set up interval to refresh games every 30 seconds (only for today's games)
    setInterval(autoRefreshGames, 30000);
    
    // Set up interval to update live games every 30 seconds using the new function
    setInterval(updateLiveGameDisplays, 30000);
    
    // Check every minute if we need to update the "baseball date" at 9am
    setInterval(() => {
        const currentBaseballDate = getCurrentBaseballDate();
        if (dateInput.value !== currentBaseballDate) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            if (currentHour === 9 && currentMinute === 0) {
                dateInput.value = currentBaseballDate;
                fetchGameData(currentBaseballDate);
            }
        }
    }, 60000);
});