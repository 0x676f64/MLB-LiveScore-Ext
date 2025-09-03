class MLBLeaderboard {
    constructor() {
        this.currentCategory = 'hitting';
        this.currentYear = '2025';
        this.currentTeam = '';
        this.currentLeague = ''; // New league filter
        this.allData = [];
        this.currentPage = 0;
        this.itemsPerPage = 50;
        this.sortColumn = null;
        this.sortDirection = 'desc';
        
        // League configurations for filtering
        this.leagueTeams = {
            'AL': [108, 110, 111, 114, 116, 117, 118, 133, 136, 139, 140, 141, 142, 145, 147], // American League team IDs
            'NL': [109, 112, 113, 115, 119, 120, 121, 134, 135, 137, 138, 143, 144, 146, 158] // National League team IDs
        };
        
        this.statConfigs = {
        hitting: {
            columns: [
                { key: 'gamesPlayed', label: 'G', format: 'number', sortKey: 'gamesPlayed' },
                { key: 'plateAppearances', label: 'PA', format: 'number', sortKey: 'plateAppearances'},
                { key: 'atBats', label: 'AB', format: 'number', sortKey: 'atBats' },
                { key: 'avg', label: 'AVG', format: 'decimal', decimals: 3, sortKey: 'avg' },
                { key: 'homeRuns', label: 'HR', format: 'number', sortKey: 'homeRuns' },
                { key: 'rbi', label: 'RBI', format: 'number', sortKey: 'rbi' },
                { key: 'runs', label: 'R', format: 'number', sortKey: 'runs' },
                { key: 'hits', label: 'H', format: 'number', sortKey: 'hits' },
                { key: 'obp', label: 'OBP', format: 'decimal', decimals: 3, sortKey: 'obp' },
                { key: 'slg', label: 'SLG', format: 'decimal', decimals: 3, sortKey: 'slg' },
                { key: 'ops', label: 'OPS', format: 'decimal', decimals: 3, sortKey: 'ops' },
                { key: 'baseOnBalls', label: 'BB', format: 'number', sortKey: 'baseOnBalls' },
                { key: 'doubles', label: '2B', format: 'number', sortKey: 'doubles' },
                { key: 'triples', label: '3B', format: 'number', sortKey: 'triples' },
                { key: 'stolenBases', label: 'SB', format: 'number', sortKey: 'stolenBases' },
                { key: 'caughtSteling', label: 'CS', format: 'number', sortKey: 'caughtStealing' },
                { key: 'strikeOuts', label: 'SO', format: 'number', sortKey: 'strikeOuts' },
                { key: 'totalBases', label: 'TB', formnat: 'number', sortKey: 'totalBases' },
                { key: 'babip', label: 'BABIP', format: 'decimal', decimals: 3, sortKey: 'babip' },
                { key: 'hitByPitch', label: 'HBP', format: 'number', sortKey: 'hitByPitch' },
                { key: 'sacFlies', label: 'SF', formnat: 'number', sortKey: 'sacFlies' },
                { key: 'intentionalWalks', label: 'IBB', format: 'number', sortKey: 'intentionalWalks' },
            ]
        },
        pitching: {
            columns: [
                { key: 'era', label: 'ERA', format: 'decimal', decimals: 2, reverse: true, sortKey: 'era' },
                { key: 'wins', label: 'W', format: 'number', sortKey: 'wins' },
                { key: 'losses', label: 'L', format: 'number', sortKey: 'losses' },
                { key: 'gamesPlayed', label: 'G', format: 'number', sortKey: 'gamesPlayed' },
                { key: 'gamesStarted', label: 'GS', format: 'number', sortKey: 'gamesStarted' },
                { key: 'strikeOuts', label: 'K', format: 'number', sortKey: 'strikeOuts' },
                { key: 'inningsPitched', label: 'IP', format: 'innings', sortKey: 'inningsPitched' },
                { key: 'whip', label: 'WHIP', format: 'decimal', decimals: 2, reverse: true, sortKey: 'whip' },
                { key: 'hits', label: 'H', format: 'number', reverse: true, sortKey: 'hits' },
                { key: 'runs', label: 'R', format: 'number', reverse: true, sortKey: 'runs' },
                { key: 'earnedRuns', label: 'ER', format: 'number', reverse: true, sortKey: 'earnedRuns' },
                { key: 'homeRuns', label: 'HR', format: 'number', reverse: true, sortKey: 'homeRuns' },
                { key: 'baseOnBalls', label: 'BB', format: 'number', reverse: true, sortKey: 'baseOnBalls' },
                { key: 'hitBatsmen', label: 'HBP', format: 'number', reverse: true, sortKey: 'hitBatsmen' },
                { key: 'wildPitches', label: 'WP', format: 'number', reverse: true, sortKey: 'wildPitches' },
                { key: 'avg', label: 'BA', format: 'decimal', decimals: 3, reverse: true, sortKey: 'avg' },
                { key: 'strikeoutsPer9Inn', label: 'K9', format: 'decimal', decimals: 1, sortKey: 'strikeoutsPer9Inn' },
                { key: 'walksPer9Inn', label: 'BB9', format: 'decimal', decimals: 1, reverse: true, sortKey: 'walksPer9Inn' },
            ]
        }
    };
        this.initializeEventListeners();
        this.loadTeams();
        this.loadLeaderboard();
    }

    initializeEventListeners() {
        // Category buttons
        document.querySelectorAll('.stat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                document.querySelectorAll('.stat-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.currentPage = 0;
                this.loadLeaderboard();
            });
        });

        // Year, team, and league selectors
        document.getElementById('yearSelect').addEventListener('change', (e) => {
            this.currentYear = e.target.value;
            this.currentPage = 0;
            this.loadLeaderboard();
        });

        document.getElementById('teamSelect').addEventListener('change', (e) => {
            this.currentTeam = e.target.value;
            this.currentPage = 0;
            this.loadLeaderboard();
        });

        // New league selector
        document.getElementById('leagueSelect').addEventListener('change', (e) => {
            this.currentLeague = e.target.value;
            this.currentTeam = ''; // Reset team selection when league changes
            document.getElementById('teamSelect').value = '';
            this.currentPage = 0;
            this.loadLeaderboard();
        });

        // Pagination buttons
        document.getElementById('prevBtn').addEventListener('click', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.renderCurrentPage();
            }
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            const maxPage = Math.ceil(this.allData.length / this.itemsPerPage) - 1;
            if (this.currentPage < maxPage) {
                this.currentPage++;
                this.renderCurrentPage();
            }
        });
    }

    async loadTeams() {
        try {
            const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
            const data = await response.json();
            
            const teamSelect = document.getElementById('teamSelect');
            // Clear existing options except "All Teams"
            teamSelect.innerHTML = '<option value="">All Teams</option>';
            
            if (data.teams) {
                data.teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team.id;
                    option.textContent = team.name;
                    teamSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    }

    async loadLeaderboard() {
        this.showLoading();
        
        try {
            // Load more comprehensive data by fetching multiple stat types
            let allPlayers = [];
            
            if (this.currentCategory === 'hitting') {
                allPlayers = await this.fetchHittingStats();
            } else if (this.currentCategory === 'pitching') {
                allPlayers = await this.fetchPitchingStats();
            } else if (this.currentCategory === 'fielding') {
                allPlayers = await this.fetchFieldingStats();
            }
            
            // Apply league filtering if selected
            if (this.currentLeague && this.leagueTeams[this.currentLeague]) {
                allPlayers = allPlayers.filter(player => 
                    this.leagueTeams[this.currentLeague].includes(player.team?.id)
                );
            }
            
            this.allData = allPlayers;
            this.currentPage = 0;
            this.renderCurrentPage();
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showError('Failed to load leaderboard data. Please check your connection and try again.');
        }
    }

    async fetchHittingStats() {
        const teamParam = this.currentTeam ? `&teamId=${this.currentTeam}` : '';
        const url = `https://statsapi.mlb.com/api/v1/stats?stats=season&season=${this.currentYear}&sportId=1&group=hitting&limit=200${teamParam}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.stats && data.stats.length > 0 && data.stats[0].splits) {
            return data.stats[0].splits.map(split => ({
                person: split.player,
                team: split.team,
                stats: split.stat
            }));
        }
        return [];
    }

    async fetchPitchingStats() {
        const teamParam = this.currentTeam ? `&teamId=${this.currentTeam}` : '';
        const url = `https://statsapi.mlb.com/api/v1/stats?stats=season&season=${this.currentYear}&sportId=1&group=pitching&limit=200${teamParam}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.stats && data.stats.length > 0 && data.stats[0].splits) {
            return data.stats[0].splits.map(split => ({
                person: split.player,
                team: split.team,
                stats: split.stat
            }));
        }
        return [];
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error').style.display = 'none';
        document.getElementById('tableContainer').style.display = 'none';
    }

    showError(message) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = message;
        document.getElementById('tableContainer').style.display = 'none';
    }

    renderCurrentPage() {
        if (!this.allData || this.allData.length === 0) {
            this.showError('No data available for the selected criteria.');
            return;
        }

        const config = this.statConfigs[this.currentCategory];
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.allData.length);
        const currentData = this.allData.slice(startIndex, endIndex);

        this.renderTable(currentData, startIndex);
        this.updatePaginationControls();

        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';
        document.getElementById('tableContainer').style.display = 'block';
    }

    // Stat format modifier 
formatStatValue(value, column) {
    if (value === undefined || value === null || value === '') {
        return '-';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        return '-';
    }

    switch (column.format) {
        case 'decimal':
            const decimals = column.decimals || 3;
            let formatted = numValue.toFixed(decimals);

             // Special case: always show whole number for 'whip'
            if (column.key === 'whip') {
                return formatted;
            }
            
            // Remove leading zero for values less than 1
            // e.g., 0.251 -> .251, but keep 1.100 as 1.100
            if (numValue < 1 && numValue > 0 && formatted.startsWith('0.')) {
                formatted = formatted.substring(1); // Remove the '0'
            } else if (numValue < 0 && numValue > -1 && formatted.startsWith('-0.')) {
                formatted = '-' + formatted.substring(2); // Remove the '0' but keep the '-'
            }
            
            return formatted;
            
        case 'number':
            // For whole numbers, show as integer
            return Math.round(numValue).toString();
            
        case 'innings':
            // Special formatting for innings pitched
            // Convert decimal to innings.outs format (e.g., 162.333 -> 162.1)
            const wholeInnings = Math.floor(numValue);
            const outs = Math.round((numValue - wholeInnings) * 3);
            
            if (outs === 0) {
                return wholeInnings.toString();
            } else {
                return `${wholeInnings}.${outs}`;
            }
            
        case 'percentage':
            // For percentages (if needed later)
            return `${(numValue * 100).toFixed(1)}%`;
            
        default:
            return numValue.toString();
    }
}

   renderTable(data, startRank = 0) {
    const config = this.statConfigs[this.currentCategory];
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th class="rank">#</th>
        <th>Player</th>
        <th class="team">Team</th>
    `;
    
    config.columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        th.className = 'sortable stat-value';
        th.dataset.column = col.sortKey || col.key;
        th.addEventListener('click', () => this.sortTable(col.sortKey || col.key, col.reverse));
        headerRow.appendChild(th);
    });
    
    tableHeader.innerHTML = '';
    tableHeader.appendChild(headerRow);
    
    // Create body
    tableBody.innerHTML = '';
    data.forEach((player, index) => {
        const row = document.createElement('tr');
        
        const teamId = player.team?.id;
        const teamAbbr = player.team?.abbreviation || 'N/A';
        const teamName = player.team?.name || 'Unknown';
        
        // Create team cell with logo
        const teamCell = document.createElement('td');
        teamCell.className = 'team';
        
        if (teamId) {
            // Create team logo container with fallback
            teamCell.innerHTML = `
                <div class="team-logo-container" title="${teamName}">
                    <img 
                        src="https://www.mlbstatic.com/team-logos/${teamId}.svg" 
                        alt="${teamAbbr}" 
                        class="team-logo"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"
                    >
                    <span class="team-abbr-fallback" style="display: none;">${teamAbbr}</span>
                </div>
            `;
        } else {
            // Fallback for missing team data
            teamCell.innerHTML = `<span class="team-abbr-fallback">${teamAbbr}</span>`;
        }
        
        row.innerHTML = `
            <td class="rank">${startRank + index + 1}</td>
            <td class="player-name">${player.person.fullName}</td>
        `;
        
        // Add the team cell
        row.appendChild(teamCell);
        
       config.columns.forEach(col => {
    const td = document.createElement('td');
    td.className = 'stat-value';
    const value = player.stats[col.sortKey || col.key];
    
    // Use the new formatting method
    td.textContent = this.formatStatValue(value, col);
    
    row.appendChild(td);
});
        
        tableBody.appendChild(row);
    });
}

    updatePaginationControls() {
        const totalPages = Math.ceil(this.allData.length / this.itemsPerPage);
        const startRange = this.currentPage * this.itemsPerPage + 1;
        const endRange = Math.min((this.currentPage + 1) * this.itemsPerPage, this.allData.length);
        
        document.getElementById('currentRange').textContent = `${startRange}-${endRange}`;
        document.getElementById('totalPlayers').textContent = this.allData.length;
        
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        prevBtn.disabled = this.currentPage === 0;
        nextBtn.disabled = this.currentPage >= totalPages - 1;
    }

    sortTable(columnKey, reverse = false) {
        if (this.sortColumn === columnKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortDirection = reverse ? 'asc' : 'desc';
        }
        
        this.sortColumn = columnKey;
        
        this.allData.sort((a, b) => {
            const aVal = parseFloat(a.stats[columnKey]) || 0;
            const bVal = parseFloat(b.stats[columnKey]) || 0;
            
            if (this.sortDirection === 'asc') {
                return aVal - bVal;
            } else {
                return bVal - aVal;
            }
        });
        
        this.currentPage = 0; // Reset to first page after sorting
        this.renderCurrentPage();
        this.updateSortIndicators();
    }

    updateSortIndicators() {
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.column === this.sortColumn) {
                th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }
}

// Initialize the leaderboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MLBLeaderboard();
});