 class MLBLeaderboard {
            constructor() {
                this.currentCategory = 'hitting';
                this.currentYear = '2025';
                this.currentTeam = '';
                this.allData = [];
                this.currentPage = 0;
                this.itemsPerPage = 50;
                this.sortColumn = null;
                this.sortDirection = 'desc';
                
                this.statConfigs = {
                    hitting: {
                        columns: [
                            { key: 'avg', label: 'AVG', format: 'decimal', sortKey: 'avg' },
                            { key: 'homeRuns', label: 'HR', format: 'number', sortKey: 'homeRuns' },
                            { key: 'rbi', label: 'RBI', format: 'number', sortKey: 'rbi' },
                            { key: 'runs', label: 'R', format: 'number', sortKey: 'runs' },
                            { key: 'hits', label: 'H', format: 'number', sortKey: 'hits' },
                            { key: 'obp', label: 'OBP', format: 'decimal', sortKey: 'onBasePercentage' },
                            { key: 'slg', label: 'SLG', format: 'decimal', sortKey: 'sluggingPercentage' },
                            { key: 'ops', label: 'OPS', format: 'decimal', sortKey: 'ops' }
                        ]
                    },
                    pitching: {
                        columns: [
                            { key: 'era', label: 'ERA', format: 'decimal', reverse: true, sortKey: 'era' },
                            { key: 'wins', label: 'W', format: 'number', sortKey: 'wins' },
                            { key: 'strikeOuts', label: 'K', format: 'number', sortKey: 'strikeOuts' },
                            { key: 'saves', label: 'SV', format: 'number', sortKey: 'saves' },
                            { key: 'whip', label: 'WHIP', format: 'decimal', reverse: true, sortKey: 'whip' },
                            { key: 'inningsPitched', label: 'IP', format: 'decimal', sortKey: 'inningsPitched' },
                            { key: 'holds', label: 'HLD', format: 'number', sortKey: 'holds' }
                        ]
                    },
                    fielding: {
                        columns: [
                            { key: 'fielding', label: 'FLD%', format: 'decimal', sortKey: 'fieldingPercentage' },
                            { key: 'assists', label: 'A', format: 'number', sortKey: 'assists' },
                            { key: 'putOuts', label: 'PO', format: 'number', sortKey: 'putOuts' },
                            { key: 'errors', label: 'E', format: 'number', reverse: true, sortKey: 'errors' },
                            { key: 'doublePlays', label: 'DP', format: 'number', sortKey: 'doublePlays' }
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

                // Year and team selectors
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

            async fetchFieldingStats() {
                const teamParam = this.currentTeam ? `&teamId=${this.currentTeam}` : '';
                const url = `https://statsapi.mlb.com/api/v1/stats?stats=season&season=${this.currentYear}&sportId=1&group=fielding&limit=200${teamParam}`;
                
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
                    
                    const teamAbbr = player.team?.abbreviation || 'N/A';
                    
                    row.innerHTML = `
                        <td class="rank">${startRank + index + 1}</td>
                        <td class="player-name">${player.person.fullName}</td>
                        <td class="team">${teamAbbr}</td>
                    `;
                    
                    config.columns.forEach(col => {
                        const td = document.createElement('td');
                        td.className = 'stat-value';
                        const value = player.stats[col.sortKey || col.key];
                        
                        if (value !== undefined && value !== null) {
                            if (col.format === 'decimal') {
                                td.textContent = parseFloat(value).toFixed(3);
                            } else {
                                td.textContent = value;
                            }
                        } else {
                            td.textContent = '-';
                        }
                        
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