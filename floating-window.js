// Updated floating-window.js - Enhanced with responsive layouts

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
                await chrome.windows.update(this.windowId, { focused: true });
                return;
            }

            const displays = await chrome.system.display.getInfo();
            const primaryDisplay = displays[0];
            
            const left = Math.round(
                primaryDisplay.bounds.left + 
                (primaryDisplay.bounds.width - this.defaultWidth) / 2
            );
            const top = Math.round(
                primaryDisplay.bounds.top + 
                (primaryDisplay.bounds.height - this.defaultHeight) / 2
            );

            const windowOptions = {
                url: 'floating-window.html',
                type: 'popup',
                width: this.defaultWidth,
                height: this.defaultHeight,
                left: left,
                top: top,
                focused: true,
                alwaysOnTop: true,
            };

            const window = await chrome.windows.create(windowOptions);
            this.windowId = window.id;
            this.isOpen = true;

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
}

const floatingWindowManager = new FloatingWindowManager();

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
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
    return true;
});

// Utility function to check if we're in compact mode
function isCompactMode() {
    return window.innerWidth <= 400;
}

// Create compact bases/outs SVG for floating window
function createCompactBasesOutsSVG(basesStatus = {}, outsCount = 0) {
    const bases = {
        first: basesStatus.first || false,
        second: basesStatus.second || false,
        third: basesStatus.third || false
    };
    
    return `
        <svg class="compact-bases-outs" width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Outs dots -->
            <circle cx="20" cy="52" r="6" fill="${outsCount >= 1 ? '#bf0d3d' : '#f7fafc'}" stroke="#bf0d3d" stroke-width="2" opacity="0.9"/>
            <circle cx="40" cy="52" r="6" fill="${outsCount >= 2 ? '#bf0d3d' : '#f7fafc'}" stroke="#bf0d3d" stroke-width="2" opacity="0.9"/>
            <circle cx="60" cy="52" r="6" fill="${outsCount >= 3 ? '#bf0d3d' : '#f7fafc'}" stroke="#bf0d3d" stroke-width="2" opacity="0.9"/>
            
            <!-- Diamond bases -->
            <rect x="34" y="7" width="12" height="12" transform="rotate(45 40 14)" fill="${bases.second ? '#0252bb' : '#ECEFF8'}" stroke="#0252bb" stroke-width="2" opacity="0.6"/>
            <rect x="54" y="20" width="12" height="12" transform="rotate(45 60 26)" fill="${bases.first ? '#0252bb' : '#ECEFF8'}" stroke="#0252bb" stroke-width="2" opacity="0.6"/>
            <rect x="14" y="20" width="12" height="12" transform="rotate(45 20 26)" fill="${bases.third ? '#0252bb' : '#ECEFF8'}" stroke="#0252bb" stroke-width="2" opacity="0.6"/>
        </svg>
        `;
    }


// Fetch detailed game data including line score and pitcher info
async function fetchDetailedGameData(gamePk) {
    try {
        const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
        const data = await response.json();

        if (data && data.liveData && data.gameData) {
            const linescore = data.liveData.linescore;
            const boxscore = data.liveData.boxscore;
            
            // Inning info
            const inningHalf = linescore.inningHalf === "Top" ? "TOP" : "BOT";
            const currentInning = linescore.currentInning || "";
            
            // Bases and outs
            const basesStatus = {
                first: linescore.offense?.first || false,
                second: linescore.offense?.second || false,
                third: linescore.offense?.third || false
            };
            const outsCount = linescore.outs || 0;
            
            // Line score by inning
            const innings = linescore.innings || [];
            
            // Pitcher info
            const awayTeamId = data.gameData.teams.away.id;
            const homeTeamId = data.gameData.teams.home.id;
            
            let awayPitcher = null;
            let homePitcher = null;
            
            // Get pitcher info from boxscore
            if (boxscore.teams) {
                const awayPitchers = boxscore.teams.away.pitchers || [];
                const homePitchers = boxscore.teams.home.pitchers || [];
                const awayPlayers = boxscore.teams.away.players || {};
                const homePlayers = boxscore.teams.home.players || {};
                
                // Find current/last pitcher
                if (linescore.defense) {
                    const currentPitcherId = linescore.defense.pitcher?.id;
                    if (currentPitcherId) {
                        const pitcherKey = `ID${currentPitcherId}`;
                        const pitcher = awayPlayers[pitcherKey] || homePlayers[pitcherKey];
                        if (pitcher) {
                            const isAway = awayPlayers[pitcherKey] !== undefined;
                            const pitcherData = {
                                name: pitcher.person.fullName,
                                record: pitcher.seasonStats?.pitching ? 
                                    `${pitcher.seasonStats.pitching.wins}-${pitcher.seasonStats.pitching.losses}` : '0-0',
                                era: pitcher.seasonStats?.pitching?.era || '0.00',
                                saves: pitcher.seasonStats?.pitching?.saves || 0
                            };
                            if (isAway) awayPitcher = pitcherData;
                            else homePitcher = pitcherData;
                        }
                    }
                }
                
                // Get probable pitchers for pre-game
                if (data.gameData.probablePitchers) {
                    if (data.gameData.probablePitchers.away && !awayPitcher) {
                        const probableAway = data.gameData.probablePitchers.away;
                        awayPitcher = {
                            name: probableAway.fullName,
                            record: `${probableAway.wins || 0}-${probableAway.losses || 0}`,
                            era: probableAway.era || '0.00'
                        };
                    }
                    if (data.gameData.probablePitchers.home && !homePitcher) {
                        const probableHome = data.gameData.probablePitchers.home;
                        homePitcher = {
                            name: probableHome.fullName,
                            record: `${probableHome.wins || 0}-${probableHome.losses || 0}`,
                            era: probableHome.era || '0.00'
                        };
                    }
                }
            }
            
            // Game status
            const gameStatus = data.gameData?.status?.statusCode;
            const isLive = gameStatus === 'I' || gameStatus === 'IP' || gameStatus === 'IS' || gameStatus === 'IR' || gameStatus === 'MC';
            const isFinal = gameStatus === 'F' || gameStatus === 'FR' || gameStatus === 'FT' || gameStatus === 'O';
            const isPreGame = gameStatus === 'P' || gameStatus === 'S' || gameStatus === 'PR' || gameStatus === 'P' || gameStatus === 'PW';
            
            // Totals
            const awayRuns = linescore.teams?.away?.runs || 0;
            const homeRuns = linescore.teams?.home?.runs || 0;
            const awayHits = linescore.teams?.away?.hits || 0;
            const homeHits = linescore.teams?.home?.hits || 0;
            const awayErrors = linescore.teams?.away?.errors || 0;
            const homeErrors = linescore.teams?.home?.errors || 0;
            
            return {
                inningHalf,
                currentInning,
                basesStatus,
                outsCount,
                innings,
                awayPitcher,
                homePitcher,
                isLive,
                isFinal,
                isPreGame,
                awayRuns,
                homeRuns,
                awayHits,
                homeHits,
                awayErrors,
                homeErrors,
                venue: data.gameData.venue?.name || '',
                detailedState: data.gameData.status.detailedState
            };
        }
    } catch (error) {
        console.error("Error fetching detailed game data:", error);
    }
    
    return null;
}

// Format pitcher name (last name only for compact view)
function formatPitcherName(fullName, compact = false) {
    if (!fullName) return 'TBD';
    if (compact) {
        const parts = fullName.split(' ');
        return parts[parts.length - 1];
    }
    return fullName;
}

// Create compact game box for floating window (max-width: 400px)
async function createCompactGameBox(game, detailedData) {
    const awayTeamAbbr = await fetchAbbreviation(game.teams.away.team.id);
    const homeTeamAbbr = await fetchAbbreviation(game.teams.home.team.id);
    const awayScore = game.teams.away.score || 0;
    const homeScore = game.teams.home.score || 0;
    const awayRecord = game.teams.away.leagueRecord ? 
        `${game.teams.away.leagueRecord.wins}-${game.teams.away.leagueRecord.losses}` : '0-0';
    const homeRecord = game.teams.home.leagueRecord ? 
        `${game.teams.home.leagueRecord.wins}-${game.teams.home.leagueRecord.losses}` : '0-0';
    
    const isDarkMode = document.body.classList.contains("dark-mode");
    const awayLogoSrc = isDarkMode
        ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${game.teams.away.team.id}.svg`
        : `https://www.mlbstatic.com/team-logos/${game.teams.away.team.id}.svg`;
    const homeLogoSrc = isDarkMode
        ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${game.teams.home.team.id}.svg`
        : `https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg`;
    
    // PRE-GAME LAYOUT
    if (detailedData && detailedData.isPreGame) {
        const gameTime = formatGameTime(game.gameDate);
        return `
            <div class="compact-game-box pre-game" data-game-pk="${game.gamePk}">
                <div class="compact-header">
                    <div class="team-info away">
                        <img src="${awayLogoSrc}" alt="${awayTeamAbbr}" class="team-logo-sm">
                        <span class="team-abbr">${awayTeamAbbr}</span>
                        <span class="team-record">${awayRecord}</span>
                    </div>
                    <div class="game-time">${gameTime}</div>
                    <div class="team-info home">
                        <span class="team-record">${homeRecord}</span>
                        <span class="team-abbr">${homeTeamAbbr}</span>
                        <img src="${homeLogoSrc}" alt="${homeTeamAbbr}" class="team-logo-sm">
                    </div>
                </div>
                <div class="pitchers-row">
                    <div class="pitcher away">
                        ${detailedData.awayPitcher?.id ? `<https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/${detailedData.awayPitcher.id}/headshot/67/current" alt="${detailedData.awayPitcher.name}" class="pitcher-headshot">` : ''}
                        <div class="pitcher-info">
                            <div class="pitcher-label">PROBABLE</div>
                            <div class="pitcher-name">${formatPitcherName(detailedData.awayPitcher?.name, true)}</div>
                        </div>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="pitcher home">
                        ${detailedData.homePitcher?.id ? `<img src="https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${detailedData.homePitcher.id}/headshot/67/current" alt="${detailedData.homePitcher.name}" class="pitcher-headshot">` : ''}
                        <div class="pitcher-info">
                            <div class="pitcher-label">PROBABLE</div>
                            <div class="pitcher-name">${formatPitcherName(detailedData.homePitcher?.name, true)}</div>
                        </div>
                    </div>
                </div>
                <div class="venue-info"><img src="https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg" alt="Home Team Logo" class="team-logo-venue"/>${detailedData.venue}</div>
            </div>
        `;
    }
    
    // LIVE GAME LAYOUT
    if (detailedData && detailedData.isLive) {
        const inningDisplay = `${detailedData.inningHalf} ${detailedData.currentInning}`;
        
        // Build line score HTML
        let lineScoreHTML = '<div class="line-score-compact">';
        lineScoreHTML += '<table><thead><tr><th></th>';
        
        // Inning headers
        for (let i = 0; i < Math.min(detailedData.innings.length, 9); i++) {
            lineScoreHTML += `<th>${i + 1}</th>`;
        }
        lineScoreHTML += '<th>R</th><th>H</th><th>E</th></tr></thead><tbody>';
        
        // Away team row
        lineScoreHTML += `<tr><td class="team-cell">${awayTeamAbbr}</td>`;
        for (let i = 0; i < Math.min(detailedData.innings.length, 9); i++) {
            const runs = detailedData.innings[i]?.away?.runs ?? '-';
            lineScoreHTML += `<td>${runs}</td>`;
        }
        lineScoreHTML += `<td class="total">${detailedData.awayRuns}</td>`;
        lineScoreHTML += `<td>${detailedData.awayHits}</td>`;
        lineScoreHTML += `<td>${detailedData.awayErrors}</td></tr>`;
        
        // Home team row
        lineScoreHTML += `<tr><td class="team-cell">${homeTeamAbbr}</td>`;
        for (let i = 0; i < Math.min(detailedData.innings.length, 9); i++) {
            const runs = detailedData.innings[i]?.home?.runs ?? '-';
            lineScoreHTML += `<td>${runs}</td>`;
        }
        lineScoreHTML += `<td class="total">${detailedData.homeRuns}</td>`;
        lineScoreHTML += `<td>${detailedData.homeHits}</td>`;
        lineScoreHTML += `<td>${detailedData.homeErrors}</td></tr>`;
        
        lineScoreHTML += '</tbody></table></div>';
        
        return `
            <div class="compact-game-box live-game" data-game-pk="${game.gamePk}">
                <div class="live-header">
                    <div class="team-score-row away">
                        <img src="${awayLogoSrc}" alt="${awayTeamAbbr}" class="team-logo-md">
                        <span class="team-abbr-large">${awayTeamAbbr}</span>
                        <span class="team-record-sm">${awayRecord}</span>
                        <span class="score-large">${awayScore}</span>
                    </div>
                    <div class="inning-indicator">
                        <div class="inning-text">${inningDisplay}</div>
                        ${createCompactBasesOutsSVG(detailedData.basesStatus, detailedData.outsCount)}
                    </div>
                    <div class="team-score-row home">
                        <span class="score-large">${homeScore}</span>
                        <span class="team-record-sm">${homeRecord}</span>
                        <span class="team-abbr-large">${homeTeamAbbr}</span>
                        <img src="${homeLogoSrc}" alt="${homeTeamAbbr}" class="team-logo-md">
                    </div>
                </div>
                ${lineScoreHTML}
                <div class="venue-info"><img src="https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg" alt="Home Team Logo" class="team-logo-venue"/>${detailedData.venue}</div>
            </div>
        `;
    }
    
    // FINAL GAME LAYOUT
    if (detailedData && detailedData.isFinal) {
        // Build line score
        let lineScoreHTML = '<div class="line-score-compact">';
        lineScoreHTML += '<table><thead><tr><th></th>';
        
        for (let i = 0; i < Math.min(detailedData.innings.length, 9); i++) {
            lineScoreHTML += `<th>${i + 1}</th>`;
        }
        lineScoreHTML += '<th>R</th><th>H</th><th>E</th></tr></thead><tbody>';
        
        // Away team
        lineScoreHTML += `<tr><td class="team-cell">${awayTeamAbbr}</td>`;
        for (let i = 0; i < Math.min(detailedData.innings.length, 9); i++) {
            const runs = detailedData.innings[i]?.away?.runs ?? '0';
            lineScoreHTML += `<td>${runs}</td>`;
        }
        lineScoreHTML += `<td class="total">${detailedData.awayRuns}</td>`;
        lineScoreHTML += `<td>${detailedData.awayHits}</td>`;
        lineScoreHTML += `<td>${detailedData.awayErrors}</td></tr>`;
        
        // Home team
        lineScoreHTML += `<tr><td class="team-cell">${homeTeamAbbr}</td>`;
        for (let i = 0; i < Math.min(detailedData.innings.length, 9); i++) {
            const runs = detailedData.innings[i]?.home?.runs ?? '0';
            lineScoreHTML += `<td>${runs}</td>`;
        }
        lineScoreHTML += `<td class="total">${detailedData.homeRuns}</td>`;
        lineScoreHTML += `<td>${detailedData.homeHits}</td>`;
        lineScoreHTML += `<td>${detailedData.homeErrors}</td></tr>`;
        
        lineScoreHTML += '</tbody></table></div>';
        
        return `
            <div class="compact-game-box final-game" data-game-pk="${game.gamePk}">
                <div class="final-header">
                    <div class="team-final-row">
                        <img src="${awayLogoSrc}" alt="${awayTeamAbbr}" class="team-logo-sm">
                        <span class="team-abbr">${awayTeamAbbr}</span>
                        <span class="team-record">${awayRecord}</span>
                        <span class="final-label">Final</span>
                        <span class="score-md">${awayScore}</span>
                    </div>
                    <div class="team-final-row">
                        <img src="${homeLogoSrc}" alt="${homeTeamAbbr}" class="team-logo-sm">
                        <span class="team-abbr">${homeTeamAbbr}</span>
                        <span class="team-record">${homeRecord}</span>
                        <span class="final-label"></span>
                        <span class="score-md">${homeScore}</span>
                    </div>
                </div>
                ${lineScoreHTML}
                ${detailedData.awayPitcher || detailedData.homePitcher ? `
                <div class="pitchers-final">
                    ${detailedData.awayPitcher ? `
                    <div class="pitcher-final">
                        <span class="pitcher-result">W: ${formatPitcherName(detailedData.awayPitcher.name)}</span>
                        <span class="pitcher-stats">${detailedData.awayPitcher.record} | ${detailedData.awayPitcher.era} ERA</span>
                    </div>` : ''}
                    ${detailedData.homePitcher ? `
                    <div class="pitcher-final">
                        <span class="pitcher-result">L: ${formatPitcherName(detailedData.homePitcher.name)}</span>
                        <span class="pitcher-stats">${detailedData.homePitcher.record} | ${detailedData.homePitcher.era} ERA</span>
                    </div>` : ''}
                </div>` : ''}
                <div class="venue-info"><img src="https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg" alt="Home Team Logo" class="team-logo-venue"/>${detailedData.venue}</div>
            </div>
        `;
    }
    
    // Fallback for unknown status
    return `
        <div class="compact-game-box" data-game-pk="${game.gamePk}">
            <div class="compact-header">
                <div class="team-info">
                    <img src="${awayLogoSrc}" alt="${awayTeamAbbr}" class="team-logo-sm">
                    <span>${awayTeamAbbr}</span>
                    <span>${awayScore}</span>
                </div>
                <div class="game-status">${game.status.detailedState}</div>
                <div class="team-info">
                    <span>${homeScore}</span>
                    <span>${homeTeamAbbr}</span>
                    <img src="${homeLogoSrc}" alt="${homeTeamAbbr}" class="team-logo-sm">
                </div>
            </div>
        </div>
    `;
}

// Get current baseball date
function getCurrentBaseballDate() {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < 9) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return formatDateForAPI(yesterday);
    }
    
    return formatDateForAPI(now);
}

function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatGameTime(gameDate) {
    const dateTime = new Date(gameDate);
    return dateTime.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
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

// Main fetch and display function
async function fetchGameData(selectedDate) {
    const apiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${selectedDate}`;
    const gamesContainer = document.getElementById("games-container");
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        gamesContainer.innerHTML = "";

        if (!data.dates.length || !data.dates[0].games.length) {
            gamesContainer.innerHTML = `<p class="no-games">No games scheduled for ${selectedDate}</p>`;
            return;
        }

        const isCompact = isCompactMode();
        
        const gameBoxes = await Promise.all(data.dates[0].games.map(async (game) => {
            let gameBoxHTML;
            
            if (isCompact) {
                // Fetch detailed data for compact layout
                const detailedData = await fetchDetailedGameData(game.gamePk);
                gameBoxHTML = await createCompactGameBox(game, detailedData);
            } else {
                // Original layout for wider screens
                gameBoxHTML = await createStandardGameBox(game);
            }
            
            const gameBox = document.createElement("div");
            gameBox.innerHTML = gameBoxHTML;
            const content = gameBox.firstElementChild;
            
            content.addEventListener("click", () => {
                window.location.href = `floating-pop.html?gamePk=${game.gamePk}`;
            });
            
            return {
                element: content,
                isLive: game.status.statusCode === 'I' || game.status.statusCode === 'IP',
                isFinal: game.status.statusCode === 'F' || game.status.statusCode === 'FR',
                gameDate: new Date(game.gameDate)
            };
        }));

        // Sort: Live first, then scheduled, then final
        gameBoxes.sort((a, b) => {
            if (a.isLive && !b.isLive) return -1;
            if (b.isLive && !a.isLive) return 1;
            if (a.isFinal && !b.isFinal) return 1;
            if (b.isFinal && !a.isFinal) return -1;
            return a.gameDate - b.gameDate;
        });

        gameBoxes.forEach(({ element }) => gamesContainer.appendChild(element));
    } catch (error) {
        console.error("Error fetching game data:", error);
        gamesContainer.innerHTML = "<p class='error'>Failed to load games.</p>";
    }
}

// Standard game box for wider screens (existing layout)
async function createStandardGameBox(game) {
    const awayTeamAbbr = await fetchAbbreviation(game.teams.away.team.id);
    const homeTeamAbbr = await fetchAbbreviation(game.teams.home.team.id);
    const awayScore = game.teams.away.score || 0;
    const homeScore = game.teams.home.score || 0;
    let status = game.status.detailedState;
    
    if (status === "Final" || status === "Game Over") {
        status = "FINAL";
    } else if (status === "Pre-Game" || status === "Scheduled") {
        status = formatGameTime(game.gameDate);
    } else if (status === "In Progress") {
        const liveData = await fetchDetailedGameData(game.gamePk);
        if (liveData) {
            status = `${liveData.inningHalf} ${liveData.currentInning}`;
        }
    }
    
    const isDarkMode = document.body.classList.contains("dark-mode");
    const awayLogoSrc = isDarkMode
        ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${game.teams.away.team.id}.svg`
        : `https://www.mlbstatic.com/team-logos/${game.teams.away.team.id}.svg`;
    const homeLogoSrc = isDarkMode
        ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${game.teams.home.team.id}.svg`
        : `https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg`;
    
    return `
        <div class="game-box standard" data-game-pk="${game.gamePk}">
            <div class="game-status">${status}</div>
            <div class="team-row">
                <img src="${awayLogoSrc}" alt="${awayTeamAbbr}" class="team-logo">
                <p class="team-abbr">${awayTeamAbbr}</p>
                <p class="team-score">${awayScore}</p>
            </div>
            <div class="team-row">
                <img src="${homeLogoSrc}" alt="${homeTeamAbbr}" class="team-logo">
                <p class="team-abbr">${homeTeamAbbr}</p>
                <p class="team-score">${homeScore}</p>
            </div>
        </div>
    `;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
    const gamesContainer = document.getElementById("games-container");
    const dateInput = document.getElementById("date-input");
    const applyButton = document.querySelector('.apply');
    
    if (dateInput && applyButton) {
        const today = getCurrentBaseballDate();
        dateInput.value = today;
        
        applyButton.addEventListener('click', () => {
            const selectedDate = dateInput.value;
            if (selectedDate) {
                fetchGameData(selectedDate);
            }
        });
        
        dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const selectedDate = dateInput.value;
                if (selectedDate) {
                    fetchGameData(selectedDate);
                }
            }
        });
        
        // Initial load
        fetchGameData(today);
    }
    
    // Handle window resize to switch between layouts
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const selectedDate = dateInput?.value || getCurrentBaseballDate();
            fetchGameData(selectedDate);
        }, 300);
    });
    
    // Auto-refresh live games every 30 seconds
    setInterval(() => {
        const selectedDate = dateInput?.value || getCurrentBaseballDate();
        const todaysDate = getCurrentBaseballDate();
        
        // Only auto-refresh if viewing today's games
        if (selectedDate === todaysDate) {
            fetchGameData(selectedDate);
        }
    }, 30000);
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const isDark = await window.darkModeManager?.isDarkModeEnabled();
        if (isDark) {
            darkModeToggle.classList.add('active');
        }

        darkModeToggle.addEventListener('click', async () => {
            await window.darkModeManager?.toggle();
            // Refresh to update team logos
            const selectedDate = dateInput?.value || getCurrentBaseballDate();
            fetchGameData(selectedDate);
        });
    }

    document.addEventListener('darkModeChanged', (event) => {
        console.log('Dark mode changed:', event.detail.isDark);
        // Refresh to update team logos
        const selectedDate = dateInput?.value || getCurrentBaseballDate();
        fetchGameData(selectedDate);
    });
});