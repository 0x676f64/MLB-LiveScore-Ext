// MLB Scoreboard Manager - Improved Version

// Constants
const CONFIG = {
    defaultWidth: 610,
    defaultHeight: 600,
    minWidth: 610,
    minHeight: 500,
    compactMaxWidth: 400,
    autoRefreshInterval: 30000,
    resizeDebounce: 300,
    maxInningsDisplay: 9
};

const GAME_STATUS = {
    LIVE: ['I', 'IP', 'IS', 'IR', 'MC', 'MA'],
    FINAL: ['F', 'FR', 'FT', 'O'],
    PRE_GAME: ['P', 'S', 'PR', 'PW']
};

const API = {
    schedule: (date) => `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`,
    gameFeed: (gamePk) => `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`,
    team: (teamId) => `https://statsapi.mlb.com/api/v1/teams/${teamId}`,
    headshot: (playerId) => `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`,
    teamLogo: (teamId, isDark) => isDark 
        ? `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${teamId}.svg`
        : `https://www.mlbstatic.com/team-logos/${teamId}.svg`
};

// Floating Window Manager
class FloatingWindowManager {
    constructor() {
        this.windowId = null;
        this.isOpen = false;
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
                (primaryDisplay.bounds.width - CONFIG.defaultWidth) / 2
            );
            const top = Math.round(
                primaryDisplay.bounds.top + 
                (primaryDisplay.bounds.height - CONFIG.defaultHeight) / 2
            );

            const window = await chrome.windows.create({
                url: 'floating-window.html',
                type: 'popup',
                width: CONFIG.defaultWidth,
                height: CONFIG.defaultHeight,
                left,
                top,
                focused: true,
                alwaysOnTop: true,
            });

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

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const actions = {
        openFloatingWindow: () => floatingWindowManager.openFloatingWindow(),
        closeFloatingWindow: () => floatingWindowManager.closeFloatingWindow(),
        toggleFloatingWindow: () => floatingWindowManager.toggleFloatingWindow()
    };

    if (actions[request.action]) {
        actions[request.action]();
        sendResponse({ success: true });
    } else {
        sendResponse({ success: false, error: 'Unknown action' });
    }
    return true;
});

// Utility Functions
const isCompactMode = () => window.innerWidth <= CONFIG.compactMaxWidth;

const isDarkMode = () => document.body.classList.contains("dark-mode");

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
    return new Date(gameDate).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatPitcherName(fullName, compact = false) {
    if (!fullName) return 'TBD';
    if (compact) {
        const parts = fullName.split(' ');
        return parts[parts.length - 1];
    }
    return fullName;
}

function getGameStatus(statusCode) {
    if (GAME_STATUS.LIVE.includes(statusCode)) return 'live';
    if (GAME_STATUS.FINAL.includes(statusCode)) return 'final';
    if (GAME_STATUS.PRE_GAME.includes(statusCode)) return 'preGame';
    return 'unknown';
}

// API Functions
async function fetchAbbreviation(teamId) {
    try {
        const response = await fetch(API.team(teamId));
        const data = await response.json();
        return data.teams[0].abbreviation || "N/A";
    } catch (error) {
        console.error("Error fetching abbreviation:", error);
        return "N/A";
    }
}

async function fetchDetailedGameData(gamePk) {
    try {
        const response = await fetch(API.gameFeed(gamePk));
        const data = await response.json();

        if (!data?.liveData || !data?.gameData) return null;

        const { liveData, gameData } = data;
        const { linescore, boxscore, decisions, plays } = liveData;
        const { currentPlay } = plays;
        const inningState = linescore.inningHalf;
        
        // Extract basic game state
        const gameState = {
            inningHalf: linescore.inningHalf === "Top" ? "TOP" : "BOT",
            currentInning: linescore.currentInning || "",
            basesStatus: {
                first: linescore.offense?.first || false,
                second: linescore.offense?.second || false,
                third: linescore.offense?.third || false
            },
            outsCount: linescore.outs || 0,
            innings: linescore.innings || [],
            awayRuns: linescore.teams?.away?.runs || 0,
            homeRuns: linescore.teams?.home?.runs || 0,
            awayHits: linescore.teams?.away?.hits || 0,
            homeHits: linescore.teams?.home?.hits || 0,
            awayErrors: linescore.teams?.away?.errors || 0,
            homeErrors: linescore.teams?.home?.errors || 0,
            venue: gameData.venue?.name || '',
            detailedState: gameData.status.detailedState
        };

        const statusCode = gameData.status.statusCode;
        gameState.isLive = GAME_STATUS.LIVE.includes(statusCode);
        gameState.isFinal = GAME_STATUS.FINAL.includes(statusCode);
        gameState.isPreGame = GAME_STATUS.PRE_GAME.includes(statusCode);

        // Get probable pitchers for pre-game
        if (gameData.probablePitchers) {
            const { away, home } = gameData.probablePitchers;
            
            if (away) {
                gameState.awayPitcher = {
                    id: away.id,
                    name: away.fullName,
                    record: `${away.wins || 0}-${away.losses || 0}`,
                    era: away.era || '0.00'
                };
            }
            
            if (home) {
                gameState.homePitcher = {
                    id: home.id,
                    name: home.fullName,
                    record: `${home.wins || 0}-${home.losses || 0}`,
                    era: home.era || '0.00'
                };
            }
        }

        // Get current pitcher and batter for live games
        if (currentPlay?.matchup && gameState.isLive) {
            const { batter, pitcher } = currentPlay.matchup;
            
            // Clear probable pitchers for live games
            gameState.awayPitcher = null;
            gameState.homePitcher = null;
            
            const getPlayerStats = (playerId, teamKey, statType) => {
                const player = boxscore.teams[teamKey].players[`ID${playerId}`];
                return player?.seasonStats?.[statType] || null;
            };

            if (inningState === "Top") {
                // Away team batting, home team pitching
                if (batter) {
                    const stats = getPlayerStats(batter.id, 'away', 'batting');
                    gameState.awayBatter = {
                        id: batter.id,
                        name: batter.fullName,
                        avg: stats?.avg || 'N/A',
                        ops: stats?.ops || 'N/A',
                        homeRuns: stats?.homeRuns || 'N/A'
                    };
                }

                if (pitcher) {
                    const stats = getPlayerStats(pitcher.id, 'home', 'pitching');
                    gameState.homePitcher = {
                        id: pitcher.id,
                        name: pitcher.fullName,
                        era: stats?.era || 'N/A',
                        inningsPitched: stats?.inningsPitched || 'N/A',
                        strikeOuts: stats?.strikeOuts || 'N/A'
                    };
                }
            } else if (inningState === "Bottom") {
                // Home team batting, away team pitching
                if (pitcher) {
                    const stats = getPlayerStats(pitcher.id, 'away', 'pitching');
                    gameState.awayPitcher = {
                        id: pitcher.id,
                        name: pitcher.fullName,
                        era: stats?.era || 'N/A',
                        inningsPitched: stats?.inningsPitched || 'N/A',
                        strikeOuts: stats?.strikeOuts || 'N/A'
                    };
                }

                if (batter) {
                    const stats = getPlayerStats(batter.id, 'home', 'batting');
                    gameState.homeBatter = {
                        id: batter.id,
                        name: batter.fullName,
                        avg: stats?.avg || 'N/A',
                        ops: stats?.ops || 'N/A',
                        homeRuns: stats?.homeRuns || 'N/A'
                    };
                }
            }
        }

        // Get decision pitchers for final games
        if (decisions && gameState.isFinal) {
            const getDecisionPitcher = (decision, label) => {
                if (!decision) return null;
                
                const playerKey = `ID${decision.id}`;
                const awayPlayers = boxscore.teams.away.players || {};
                const homePlayers = boxscore.teams.home.players || {};
                const player = awayPlayers[playerKey] || homePlayers[playerKey];
                const stats = player?.seasonStats?.pitching;
                
                const result = {
                    id: decision.id,
                    name: decision.fullName,
                    era: stats?.era || '0.00'
                };

                if (label === 'save') {
                    result.saves = stats?.saves || 0;
                } else {
                    result.record = stats ? `${stats.wins}-${stats.losses}` : '0-0';
                }

                return result;
            };

            gameState.winningPitcher = getDecisionPitcher(decisions.winner, 'win');
            gameState.losingPitcher = getDecisionPitcher(decisions.loser, 'loss');
            gameState.savePitcher = getDecisionPitcher(decisions.save, 'save');
        }

        return gameState;
    } catch (error) {
        console.error("Error fetching detailed game data:", error);
        return null;
    }
}

// SVG Generator
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

// Line Score Generator
function createLineScore(detailedData, awayTeamAbbr, homeTeamAbbr) {
    const maxInnings = Math.min(detailedData.innings.length, CONFIG.maxInningsDisplay);
    
    let html = '<div class="line-score-compact"><table><thead><tr><th></th>';
    
    for (let i = 0; i < maxInnings; i++) {
        html += `<th>${i + 1}</th>`;
    }
    html += '<th>R</th><th>H</th><th>E</th></tr></thead><tbody>';
    
    // Away team row
    html += `<tr><td class="team-cell">${awayTeamAbbr}</td>`;
    for (let i = 0; i < maxInnings; i++) {
        const runs = detailedData.innings[i]?.away?.runs ?? '-';
        html += `<td>${runs}</td>`;
    }
    html += `<td class="total">${detailedData.awayRuns}</td>`;
    html += `<td>${detailedData.awayHits}</td>`;
    html += `<td>${detailedData.awayErrors}</td></tr>`;
    
    // Home team row
    html += `<tr><td class="team-cell">${homeTeamAbbr}</td>`;
    for (let i = 0; i < maxInnings; i++) {
        const runs = detailedData.innings[i]?.home?.runs ?? '-';
        html += `<td>${runs}</td>`;
    }
    html += `<td class="total">${detailedData.homeRuns}</td>`;
    html += `<td>${detailedData.homeHits}</td>`;
    html += `<td>${detailedData.homeErrors}</td></tr>`;
    
    html += '</tbody></table></div>';
    return html;
}

// Player Card Generator
function createPlayerCard(player, position) {
    if (!player) return '';
    
    const statsMap = {
        pitcher: ['ERA ', 'K ', 'IP '],
        batter: ['AVG ', 'HR ', 'OPS ']
    };
    
    const statsData = position === 'Pitcher' 
        ? [player.era, player.strikeOuts, player.inningsPitched]
        : [player.avg, player.homeRuns, player.ops];
    
    const stats = statsMap[position.toLowerCase()];
    const statsHTML = stats.map((label, i) => 
        `<span>${label}: ${statsData[i]}</span>`
    ).join('');
    
    return `
        <div class="player-card">
            <img src="https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_40,h_40,c_fill/v1/people/${player.id}/headshot/67/current" 
                 alt="${player.name}" 
                 class="player-image">
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-position">${position}</div>
                <div class="player-stats">${statsHTML}</div>
            </div>
        </div>
    `;
}

// Game Box Layouts
async function createPreGameLayout(game, detailedData, awayTeamAbbr, homeTeamAbbr, awayRecord, homeRecord, awayLogoSrc, homeLogoSrc) {
    const gameTime = formatGameTime(game.gameDate);
    
    const createPitcherSection = (pitcher, side) => {
        if (!pitcher) return '';
        return `
            <div class="pitcher ${side}">
                ${pitcher.id ? `<img src="${API.headshot(pitcher.id)}" alt="${pitcher.name}" class="pitcher-headshot">` : ''}
                <div class="pitcher-info">
                    <div class="pitcher-label">PROBABLE</div>
                    <div class="pitcher-name">${formatPitcherName(pitcher.name, true)}</div>
                    <div class="pitcher-stats">${pitcher.record} | ${pitcher.era} ERA</div>
                </div>
            </div>
        `;
    };
    
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
                ${createPitcherSection(detailedData.awayPitcher, 'away')}
                <div class="vs-divider">VS</div>
                ${createPitcherSection(detailedData.homePitcher, 'home')}
            </div>
            <div class="venue-info">
                <img src="https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg" alt="Home Team Logo" class="team-logo-venue"/>
                ${detailedData.venue}
            </div>
        </div>
    `;
}

async function createLiveGameLayout(game, detailedData, awayTeamAbbr, homeTeamAbbr, awayRecord, homeRecord, awayScore, homeScore, awayLogoSrc, homeLogoSrc) {
    const inningDisplay = `${detailedData.inningHalf} ${detailedData.currentInning}`;
    const lineScore = createLineScore(detailedData, awayTeamAbbr, homeTeamAbbr);
    
    const playerMatchup = [
        detailedData.awayPitcher && createPlayerCard(detailedData.awayPitcher, 'Pitcher'),
        detailedData.awayBatter && createPlayerCard(detailedData.awayBatter, 'Batter'),
        detailedData.homePitcher && createPlayerCard(detailedData.homePitcher, 'Pitcher'),
        detailedData.homeBatter && createPlayerCard(detailedData.homeBatter, 'Batter')
    ].filter(Boolean).join('');
    
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
            ${lineScore}
            <div class="player-matchup-container">${playerMatchup}</div>
            <div class="venue-info">
                <img src="https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg" alt="Home Team Logo" class="team-logo-venue"/>
                ${detailedData.venue}
            </div>
        </div>
    `;
}

async function createFinalGameLayout(game, detailedData, awayTeamAbbr, homeTeamAbbr, awayRecord, homeRecord, awayScore, homeScore, awayLogoSrc, homeLogoSrc) {
    const lineScore = createLineScore(detailedData, awayTeamAbbr, homeTeamAbbr);
    
    const createPitcherDecision = (pitcher, label) => {
        if (!pitcher) return '';
        const stats = label === 'SV' 
            ? `${pitcher.saves} SV | ${pitcher.era} ERA`
            : `${pitcher.record} | ${pitcher.era} ERA`;
        
        return `
            <div class="pitcher-decision">
                ${pitcher.id ? `<img src="${API.headshot(pitcher.id)}" alt="${pitcher.name}" class="pitcher-headshot-small">` : ''}
                <div class="pitcher-decision-info">
                    <span class="pitcher-result">${label}: ${formatPitcherName(pitcher.name)}</span>
                    <span class="pitcher-stats">${stats}</span>
                </div>
            </div>
        `;
    };
    
    const pitchersHTML = [
        detailedData.winningPitcher && createPitcherDecision(detailedData.winningPitcher, 'W'),
        detailedData.losingPitcher && createPitcherDecision(detailedData.losingPitcher, 'L'),
        detailedData.savePitcher && createPitcherDecision(detailedData.savePitcher, 'SV')
    ].filter(Boolean);
    
    const pitchersSection = pitchersHTML.length 
        ? `<div class="pitchers-final">${pitchersHTML.join('')}</div>` 
        : '';
    
    return `
        <div class="compact-game-box final-game" data-game-pk="${game.gamePk}">
            <div class="final-header">
                <div class="team-final-row">
                    <img src="${awayLogoSrc}" alt="${awayTeamAbbr}" class="team-logo-sm">
                    <span class="team-abbr">${awayTeamAbbr}</span>
                    <span class="team-record">${awayRecord}</span>
                    <span class="score-md">${awayScore}</span>
                    <span class="final-label">Final</span>
                </div>
                <div class="team-final-row">
                    <span class="score-md">${homeScore}</span>
                    <span class="team-record">${homeRecord}</span>
                    <span class="team-abbr">${homeTeamAbbr}</span>
                    <img src="${homeLogoSrc}" alt="${homeTeamAbbr}" class="team-logo-sm">
                    <span class="final-label"></span>
                </div>
            </div>
            ${lineScore}
            ${pitchersSection}
            <div class="venue-info">
                <img src="https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg" alt="Home Team Logo" class="team-logo-venue"/>
                ${detailedData.venue}
            </div>
        </div>
    `;
}

// Main Compact Game Box Creator
async function createCompactGameBox(game, detailedData) {
    const [awayTeamAbbr, homeTeamAbbr] = await Promise.all([
        fetchAbbreviation(game.teams.away.team.id),
        fetchAbbreviation(game.teams.home.team.id)
    ]);
    
    const awayScore = game.teams.away.score || 0;
    const homeScore = game.teams.home.score || 0;
    const awayRecord = game.teams.away.leagueRecord 
        ? `${game.teams.away.leagueRecord.wins}-${game.teams.away.leagueRecord.losses}` 
        : '0-0';
    const homeRecord = game.teams.home.leagueRecord 
        ? `${game.teams.home.leagueRecord.wins}-${game.teams.home.leagueRecord.losses}` 
        : '0-0';
    
    const dark = isDarkMode();
    const awayLogoSrc = API.teamLogo(game.teams.away.team.id, dark);
    const homeLogoSrc = API.teamLogo(game.teams.home.team.id, dark);
    
    const layoutParams = {
        game, detailedData, awayTeamAbbr, homeTeamAbbr, 
        awayRecord, homeRecord, awayScore, homeScore, 
        awayLogoSrc, homeLogoSrc
    };
    
    if (detailedData?.isPreGame) {
        return createPreGameLayout(layoutParams.game, layoutParams.detailedData, layoutParams.awayTeamAbbr, layoutParams.homeTeamAbbr, layoutParams.awayRecord, layoutParams.homeRecord, layoutParams.awayLogoSrc, layoutParams.homeLogoSrc);
    }
    
    if (detailedData?.isLive) {
        return createLiveGameLayout(layoutParams.game, layoutParams.detailedData, layoutParams.awayTeamAbbr, layoutParams.homeTeamAbbr, layoutParams.awayRecord, layoutParams.homeRecord, layoutParams.awayScore, layoutParams.homeScore, layoutParams.awayLogoSrc, layoutParams.homeLogoSrc);
    }
    
    if (detailedData?.isFinal) {
        return createFinalGameLayout(layoutParams.game, layoutParams.detailedData, layoutParams.awayTeamAbbr, layoutParams.homeTeamAbbr, layoutParams.awayRecord, layoutParams.homeRecord, layoutParams.awayScore, layoutParams.homeScore, layoutParams.awayLogoSrc, layoutParams.homeLogoSrc);
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

// Placeholder for standard game box (not shown in original but referenced)
async function createStandardGameBox(game) {
    // Implementation would go here for wider screens
    // Left as placeholder since full implementation wasn't in original
    return '';
}

// Main Fetch and Display Function
async function fetchGameData(selectedDate) {
    const gamesContainer = document.getElementById("games-container");
    
    if (!gamesContainer) return;
    
    try {
        const response = await fetch(API.schedule(selectedDate));
        const data = await response.json();

        gamesContainer.innerHTML = "";

        if (!data.dates?.length || !data.dates[0].games?.length) {
            gamesContainer.innerHTML = `<p class="no-games">No games scheduled for ${selectedDate}</p>`;
            return;
        }

        const isCompact = isCompactMode();
        const seenGamePks = new Set();
        
        const gameBoxes = await Promise.all(
            data.dates[0].games
                .filter(game => {
                    if (seenGamePks.has(game.gamePk)) return false;
                    seenGamePks.add(game.gamePk);
                    return true;
                })
                .map(async (game) => {
                    const detailedData = isCompact ? await fetchDetailedGameData(game.gamePk) : null;
                    const gameBoxHTML = isCompact 
                        ? await createCompactGameBox(game, detailedData)
                        : await createStandardGameBox(game);
                    
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = gameBoxHTML.trim();
                    const element = tempDiv.firstElementChild;
                    
                    element.addEventListener("click", () => {
                        window.location.href = `floating-pop.html?gamePk=${game.gamePk}`;
                    });
                    
                    const statusCode = game.status.statusCode;
                    return {
                        element,
                        isLive: GAME_STATUS.LIVE.includes(statusCode),
                        isFinal: GAME_STATUS.FINAL.includes(statusCode),
                        gameDate: new Date(game.gameDate)
                    };
                })
        );

        // Sort: Live first, then scheduled, then final
        gameBoxes.sort((a, b) => {
            if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
            if (a.isFinal !== b.isFinal) return a.isFinal ? 1 : -1;
            return a.gameDate - b.gameDate;
        });

        gameBoxes.forEach(({ element }) => gamesContainer.appendChild(element));
    } catch (error) {
        console.error("Error fetching game data:", error);
        gamesContainer.innerHTML = "<p class='error'>Failed to load games.</p>";
    }
}

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    const gamesContainer = document.getElementById("games-container");
    const dateInput = document.getElementById("date-input");
    const applyButton = document.querySelector('.apply');
    
    if (!dateInput || !applyButton) return;
    
    const today = getCurrentBaseballDate();
    dateInput.value = today;
    
    const handleDateChange = () => {
        const selectedDate = dateInput.value;
        if (selectedDate) fetchGameData(selectedDate);
    };
    
    applyButton.addEventListener('click', handleDateChange);
    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleDateChange();
    });
    
    // Initial load
    fetchGameData(today);
    
    // Handle window resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const selectedDate = dateInput.value || getCurrentBaseballDate();
            fetchGameData(selectedDate);
        }, CONFIG.resizeDebounce);
    });
    
    // Auto-refresh live games
    setInterval(() => {
        const selectedDate = dateInput.value || getCurrentBaseballDate();
        const todaysDate = getCurrentBaseballDate();
        
        if (selectedDate === todaysDate) {
            fetchGameData(selectedDate);
        }
    }, CONFIG.autoRefreshInterval);
});