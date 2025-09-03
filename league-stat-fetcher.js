/**
 * MLB League-Wide Stats Fetcher
 * Fetches comprehensive team statistics from MLB Stats API for all 30 teams
 * Used for calculating advanced metrics like FIP constant
 */

const leagueStats = await initializeLeagueStats();
const calculator = await createAdvancedStatsCalculator(leagueStats); 

class MLBLeagueStats {
    constructor() {
        this.baseURL = 'https://statsapi.mlb.com/api/v1';
        this.currentSeason = new Date().getFullYear();
        this.teams = [];
        this.leagueStats = {
            homeRuns: 0,
            walks: 0,
            hitByPitch: 0,
            innings: 0,
            strikeouts: 0,
            runs: 0,
            earnedRuns: 0,
            games: 0,
            teams: []
        };
    }

    /**
     * Fetch all MLB teams
     */
    async fetchTeams() {
        try {
            const response = await fetch(`${this.baseURL}/teams?leagueIds=103,104&season=${this.currentSeason}`);
            const data = await response.json();
            this.teams = data.teams.map(team => ({
                id: team.id,
                name: team.name,
                abbreviation: team.abbreviation,
                league: team.league.name,
                division: team.division.name
            }));
            console.log(`Fetched ${this.teams.length} teams for ${this.currentSeason} season`);
            return this.teams;
        } catch (error) {
            console.error('Error fetching teams:', error);
            throw error;
        }
    }

    /**
     * Fetch team statistics for a specific team
     */
    async fetchTeamStats(teamId) {
        try {
            const response = await fetch(
                `${this.baseURL}/teams/${teamId}/stats?stats=season&season=${this.currentSeason}&group=hitting,pitching`
            );
            const data = await response.json();
            
            const stats = {
                teamId,
                hitting: {},
                pitching: {}
            };

            // Process hitting stats
            const hittingStats = data.stats.find(s => s.group.displayName === 'hitting');
            if (hittingStats && hittingStats.splits.length > 0) {
                const hitting = hittingStats.splits[0].stat;
                stats.hitting = {
                    homeRuns: parseInt(hitting.homeRuns) || 0,
                    walks: parseInt(hitting.baseOnBalls) || 0,
                    hitByPitch: parseInt(hitting.hitByPitch) || 0,
                    runs: parseInt(hitting.runs) || 0,
                    games: parseInt(hitting.gamesPlayed) || 0
                };
            }

            // Process pitching stats
            const pitchingStats = data.stats.find(s => s.group.displayName === 'pitching');
            if (pitchingStats && pitchingStats.splits.length > 0) {
                const pitching = pitchingStats.splits[0].stat;
                stats.pitching = {
                    strikeouts: parseInt(pitching.strikeOuts) || 0,
                    walks: parseInt(pitching.baseOnBalls) || 0,
                    hitByPitch: parseInt(pitching.hitByPitch) || 0,
                    homeRuns: parseInt(pitching.homeRuns) || 0,
                    innings: parseFloat(pitching.inningsPitched) || 0,
                    earnedRuns: parseInt(pitching.earnedRuns) || 0,
                    runs: parseInt(pitching.runs) || 0,
                    games: parseInt(pitching.gamesPlayed) || 0
                };
            }

            return stats;
        } catch (error) {
            console.error(`Error fetching stats for team ${teamId}:`, error);
            return null;
        }
    }

    /**
     * Fetch all league-wide statistics
     */
    async fetchAllLeagueStats() {
        try {
            console.log('Fetching teams...');
            await this.fetchTeams();

            console.log('Fetching team statistics...');
            const teamStatsPromises = this.teams.map(team => this.fetchTeamStats(team.id));
            const teamStats = await Promise.all(teamStatsPromises);

            // Reset league totals
            this.leagueStats = {
                homeRuns: 0,
                walks: 0,
                hitByPitch: 0,
                innings: 0,
                strikeouts: 0,
                runs: 0,
                earnedRuns: 0,
                games: 0,
                teams: []
            };

            // Aggregate all team stats
            teamStats.forEach((stats, index) => {
                if (!stats) return;

                const team = this.teams[index];
                const teamData = {
                    ...team,
                    hitting: stats.hitting,
                    pitching: stats.pitching
                };

                this.leagueStats.teams.push(teamData);

                // Add to league totals (using offensive stats for league-wide offensive numbers)
                this.leagueStats.homeRuns += stats.hitting.homeRuns || 0;
                this.leagueStats.walks += stats.hitting.walks || 0;
                this.leagueStats.hitByPitch += stats.hitting.hitByPitch || 0;
                this.leagueStats.runs += stats.hitting.runs || 0;

                // Use pitching stats for defensive numbers
                this.leagueStats.strikeouts += stats.pitching.strikeouts || 0;
                this.leagueStats.innings += stats.pitching.innings || 0;
                this.leagueStats.earnedRuns += stats.pitching.earnedRuns || 0;
                
                // Games played
                this.leagueStats.games += stats.hitting.games || 0;
            });

            console.log('League stats aggregation complete');
            return this.leagueStats;

        } catch (error) {
            console.error('Error fetching league stats:', error);
            throw error;
        }
    }

    /**
     * Calculate FIP constant for the current season
     * FIP constant = lgERA - (((13*lgHR)+(3*(lgBB+lgHBP))-(2*lgK))/lgIP)
     */
    calculateFIPConstant() {
        if (this.leagueStats.innings === 0) {
            throw new Error('No league stats available. Please fetch stats first.');
        }

        const lgERA = this.leagueStats.earnedRuns / (this.leagueStats.innings / 9);
        const fipComponent = (
            (13 * this.leagueStats.homeRuns) +
            (3 * (this.leagueStats.walks + this.leagueStats.hitByPitch)) -
            (2 * this.leagueStats.strikeouts)
        ) / this.leagueStats.innings;

        const fipConstant = lgERA - fipComponent;

        return {
            fipConstant: parseFloat(fipConstant.toFixed(3)),
            leagueERA: parseFloat(lgERA.toFixed(3)),
            components: {
                homeRuns: this.leagueStats.homeRuns,
                walks: this.leagueStats.walks,
                hitByPitch: this.leagueStats.hitByPitch,
                strikeouts: this.leagueStats.strikeouts,
                innings: this.leagueStats.innings,
                earnedRuns: this.leagueStats.earnedRuns
            }
        };
    }

    /**
     * Get specific league stat
     */
    getLeagueStat(statName) {
        return this.leagueStats[statName] || 0;
    }

    /**
     * Get all league stats
     */
    getAllLeagueStats() {
        return { ...this.leagueStats };
    }

    /**
     * Get team-by-team breakdown
     */
    getTeamStats() {
        return this.leagueStats.teams.map(team => ({
            name: team.name,
            abbreviation: team.abbreviation,
            league: team.league,
            division: team.division,
            hitting: { ...team.hitting },
            pitching: { ...team.pitching }
        }));
    }

    /**
     * Get league averages per team
     */
    getLeagueAverages() {
        const numTeams = this.leagueStats.teams.length;
        if (numTeams === 0) return null;

        return {
            homeRuns: parseFloat((this.leagueStats.homeRuns / numTeams).toFixed(1)),
            walks: parseFloat((this.leagueStats.walks / numTeams).toFixed(1)),
            hitByPitch: parseFloat((this.leagueStats.hitByPitch / numTeams).toFixed(1)),
            strikeouts: parseFloat((this.leagueStats.strikeouts / numTeams).toFixed(1)),
            innings: parseFloat((this.leagueStats.innings / numTeams).toFixed(1)),
            runs: parseFloat((this.leagueStats.runs / numTeams).toFixed(1)),
            earnedRuns: parseFloat((this.leagueStats.earnedRuns / numTeams).toFixed(1)),
            games: parseFloat((this.leagueStats.games / numTeams).toFixed(1))
        };
    }

    /**
     * Save stats to localStorage for caching
     */
    saveToCache() {
        const cacheData = {
            timestamp: Date.now(),
            season: this.currentSeason,
            stats: this.leagueStats
        };
        localStorage.setItem('mlbLeagueStats', JSON.stringify(cacheData));
    }

    /**
     * Load stats from localStorage cache
     * Returns true if loaded successfully, false if cache is invalid/expired
     */
    loadFromCache(maxAgeHours = 24) {
        try {
            const cached = localStorage.getItem('mlbLeagueStats');
            if (!cached) return false;

            const cacheData = JSON.parse(cached);
            const ageHours = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);

            if (ageHours > maxAgeHours || cacheData.season !== this.currentSeason) {
                return false;
            }

            this.leagueStats = cacheData.stats;
            console.log(`Loaded league stats from cache (${ageHours.toFixed(1)} hours old)`);
            return true;
        } catch (error) {
            console.error('Error loading from cache:', error);
            return false;
        }
    }
}

// Usage examples and utility functions
async function initializeLeagueStats() {
    const leagueStats = new MLBLeagueStats();
    
    // Try to load from cache first
    if (!leagueStats.loadFromCache()) {
        console.log('Cache miss or expired. Fetching fresh data...');
        await leagueStats.fetchAllLeagueStats();
        leagueStats.saveToCache();
    }
    
    return leagueStats;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MLBLeagueStats, initializeLeagueStats };
}

// Example usage:
/*
(async () => {
    try {
        const leagueStats = await initializeLeagueStats();
        
        console.log('League Totals:', leagueStats.getAllLeagueStats());
        console.log('FIP Constant:', leagueStats.calculateFIPConstant());
        console.log('League Averages:', leagueStats.getLeagueAverages());
        
        // Get specific stats
        console.log('Total League Home Runs:', leagueStats.getLeagueStat('homeRuns'));
        console.log('Total League Strikeouts:', leagueStats.getLeagueStat('strikeouts'));
        
    } catch (error) {
        console.error('Error:', error);
    }
})();
*/