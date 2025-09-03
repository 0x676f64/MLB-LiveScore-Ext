/**
 * MLB Advanced Statistics Formulas
 * Calculates FIP, ERA+, OPS+, and other advanced metrics
 * Requires MLBLeagueStats for league-wide context
 */

class MLBAdvancedStats {
    constructor(leagueStats) {
        this.leagueStats = leagueStats;
        this.fipConstant = null;
        this.leagueAverages = null;
        this.initializeLeagueContext();
    }

    /**
     * Initialize league context for calculations
     */
    async initializeLeagueContext() {
        try {
            const fipData = this.leagueStats.calculateFIPConstant();
            this.fipConstant = fipData.fipConstant;
            this.leagueAverages = this.leagueStats.getLeagueAverages();
            
            // Calculate additional league averages needed for normalized stats
            const allStats = this.leagueStats.getAllLeagueStats();
            this.leagueERA = allStats.earnedRuns / (allStats.innings / 9);
            this.leagueOPS = await this.calculateLeagueOPS();
            
            console.log('Advanced stats context initialized');
            console.log('FIP Constant:', this.fipConstant);
            console.log('League ERA:', this.leagueERA?.toFixed(3));
        } catch (error) {
            console.error('Error initializing league context:', error);
        }
    }

    /**
     * Calculate Fielding Independent Pitching (FIP)
     * FIP = ((13×HR)+(3×(BB+HBP))-(2×K))/IP + FIP Constant
     */
    calculateFIP(pitcherStats) {
        const { homeRuns, walks, hitByPitch, strikeouts, inningsPitched } = pitcherStats;
        
        if (!inningsPitched || inningsPitched === 0) {
            return null;
        }

        if (this.fipConstant === null) {
            console.warn('FIP Constant not available. Using default value of 3.200');
            this.fipConstant = 3.200;
        }

        const fipCore = (
            (13 * (homeRuns || 0)) +
            (3 * ((walks || 0) + (hitByPitch || 0))) -
            (2 * (strikeouts || 0))
        ) / inningsPitched;

        return parseFloat((fipCore + this.fipConstant).toFixed(2));
    }

    /**
     * Calculate ERA+ (ERA adjusted for league and park)
     * ERA+ = (lgERA / ERA) × 100
     * Note: This is simplified without park factors
     */
    calculateERAPlus(pitcherStats) {
        const { earnedRuns, inningsPitched } = pitcherStats;
        
        if (!inningsPitched || inningsPitched === 0 || !earnedRuns) {
            return null;
        }

        const era = (earnedRuns * 9) / inningsPitched;
        
        if (era === 0 || !this.leagueERA) {
            return null;
        }

        return Math.round((this.leagueERA / era) * 100);
    }

    /**
     * Calculate xFIP (Expected Fielding Independent Pitching)
     * xFIP = ((13×lgHR/9×FB)+(3×(BB+HBP))-(2×K))/IP + FIP Constant
     * Simplified version using league HR/9 rate
     */
    calculateXFIP(pitcherStats) {
        const { walks, hitByPitch, strikeouts, inningsPitched, flyBalls } = pitcherStats;
        
        if (!inningsPitched || inningsPitched === 0) {
            return null;
        }

        // Use league HR/FB rate if fly balls available, otherwise use simplified version
        let expectedHR;
        if (flyBalls && flyBalls > 0) {
            const leagueHRperFB = this.getLeagueHRperFB(); // You'd need to calculate this
            expectedHR = flyBalls * leagueHRperFB;
        } else {
            // Simplified: use league HR/9 rate
            const leagueHRper9 = this.leagueStats.getLeagueStat('homeRuns') / 
                                (this.leagueStats.getLeagueStat('innings') / 9);
            expectedHR = (inningsPitched / 9) * leagueHRper9;
        }

        const xfipCore = (
            (13 * expectedHR) +
            (3 * ((walks || 0) + (hitByPitch || 0))) -
            (2 * (strikeouts || 0))
        ) / inningsPitched;

        return parseFloat((xfipCore + this.fipConstant).toFixed(2));
    }

    /**
     * Calculate OPS+ (On-base Plus Slugging adjusted for league and park)
     * OPS+ = 100 × (OBP/lgOBP + SLG/lgSLG - 1)
     * Simplified version without park factors
     */
    calculateOPSPlus(hitterStats) {
        const ops = this.calculateOPS(hitterStats);
        
        if (!ops || !this.leagueOPS) {
            return null;
        }

        // Split OPS into OBP and SLG components for proper calculation
        const obp = this.calculateOBP(hitterStats);
        const slg = this.calculateSLG(hitterStats);
        
        if (!obp || !slg) return null;

        // Would need league OBP and SLG separately for accurate calculation
        // Simplified version using overall OPS ratio
        return Math.round((ops / this.leagueOPS) * 100);
    }

    /**
     * Calculate OPS (On-base Plus Slugging)
     */
    calculateOPS(hitterStats) {
        const obp = this.calculateOBP(hitterStats);
        const slg = this.calculateSLG(hitterStats);
        
        if (obp === null || slg === null) return null;
        
        return parseFloat((obp + slg).toFixed(3));
    }

    /**
     * Calculate On-Base Percentage (OBP)
     * OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
     */
    calculateOBP(hitterStats) {
        const { hits, walks, hitByPitch, atBats, sacrificeFlies } = hitterStats;
        
        const numerator = (hits || 0) + (walks || 0) + (hitByPitch || 0);
        const denominator = (atBats || 0) + (walks || 0) + (hitByPitch || 0) + (sacrificeFlies || 0);
        
        if (denominator === 0) return null;
        
        return parseFloat((numerator / denominator).toFixed(3));
    }

    /**
     * Calculate Slugging Percentage (SLG)
     * SLG = Total Bases / At Bats
     */
    calculateSLG(hitterStats) {
        const { atBats, hits, doubles, triples, homeRuns } = hitterStats;
        
        if (!atBats || atBats === 0) return null;
        
        const singles = (hits || 0) - (doubles || 0) - (triples || 0) - (homeRuns || 0);
        const totalBases = singles + (2 * (doubles || 0)) + (3 * (triples || 0)) + (4 * (homeRuns || 0));
        
        return parseFloat((totalBases / atBats).toFixed(3));
    }

    /**
     * Calculate wOBA (Weighted On-Base Average)
     * Using 2023 linear weights as example - these should be updated annually
     */
    calculateWOBA(hitterStats) {
        const weights = {
            walk: 0.692,
            hitByPitch: 0.723,
            single: 0.895,
            double: 1.232,
            triple: 1.588,
            homeRun: 2.101
        };

        const { walks, hitByPitch, hits, doubles, triples, homeRuns, atBats, sacrificeFlies } = hitterStats;
        
        const singles = (hits || 0) - (doubles || 0) - (triples || 0) - (homeRuns || 0);
        
        const numerator = 
            (weights.walk * (walks || 0)) +
            (weights.hitByPitch * (hitByPitch || 0)) +
            (weights.single * singles) +
            (weights.double * (doubles || 0)) +
            (weights.triple * (triples || 0)) +
            (weights.homeRun * (homeRuns || 0));
            
        const denominator = (atBats || 0) + (walks || 0) + (hitByPitch || 0) + (sacrificeFlies || 0);
        
        if (denominator === 0) return null;
        
        return parseFloat((numerator / denominator).toFixed(3));
    }

    /**
     * Calculate WHIP (Walks + Hits per Inning Pitched)
     */
    calculateWHIP(pitcherStats) {
        const { walks, hits, inningsPitched } = pitcherStats;
        
        if (!inningsPitched || inningsPitched === 0) return null;
        
        return parseFloat(((walks || 0) + (hits || 0)) / inningsPitched).toFixed(2);
    }

    /**
     * Calculate K/9 (Strikeouts per 9 innings)
     */
    calculateKper9(pitcherStats) {
        const { strikeouts, inningsPitched } = pitcherStats;
        
        if (!inningsPitched || inningsPitched === 0) return null;
        
        return parseFloat(((strikeouts || 0) * 9) / inningsPitched).toFixed(1);
    }

    /**
     * Calculate BB/9 (Walks per 9 innings)
     */
    calculateBBper9(pitcherStats) {
        const { walks, inningsPitched } = pitcherStats;
        
        if (!inningsPitched || inningsPitched === 0) return null;
        
        return parseFloat(((walks || 0) * 9) / inningsPitched).toFixed(1);
    }

    /**
     * Calculate HR/9 (Home Runs per 9 innings)
     */
    calculateHRper9(pitcherStats) {
        const { homeRuns, inningsPitched } = pitcherStats;
        
        if (!inningsPitched || inningsPitched === 0) return null;
        
        return parseFloat(((homeRuns || 0) * 9) / inningsPitched).toFixed(1);
    }

    /**
     * Helper method to calculate league OPS (simplified)
     */
    async calculateLeagueOPS() {
        // This would need to be calculated from team hitting stats
        // For now, return a typical league OPS value
        return 0.750; // You'd calculate this from actual league data
    }

    /**
     * Get league HR/FB rate (helper for xFIP)
     */
    getLeagueHRperFB() {
        // Typical MLB HR/FB rate is around 10-15%
        return 0.13; // You'd calculate this from actual data if available
    }

    /**
     * Calculate all available advanced stats for a player
     */
    calculateAllStats(playerStats, statType = 'pitcher') {
        const results = {};
        
        if (statType === 'pitcher' || statType === 'both') {
            results.fip = this.calculateFIP(playerStats);
            results.xfip = this.calculateXFIP(playerStats);
            results.eraPlus = this.calculateERAPlus(playerStats);
            results.whip = this.calculateWHIP(playerStats);
            results.kPer9 = this.calculateKper9(playerStats);
            results.bbPer9 = this.calculateBBper9(playerStats);
            results.hrPer9 = this.calculateHRper9(playerStats);
        }
        
        if (statType === 'hitter' || statType === 'both') {
            results.ops = this.calculateOPS(playerStats);
            results.opsPlus = this.calculateOPSPlus(playerStats);
            results.obp = this.calculateOBP(playerStats);
            results.slg = this.calculateSLG(playerStats);
            results.woba = this.calculateWOBA(playerStats);
        }
        
        return results;
    }
}

// Utility function to create calculator with league stats
async function createAdvancedStatsCalculator(leagueStatsInstance) {
    const calculator = new MLBAdvancedStats(leagueStatsInstance);
    await calculator.initializeLeagueContext();
    return calculator;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MLBAdvancedStats, createAdvancedStatsCalculator };
}

// Example usage:
/*
// Assuming you have your league stats instance
const leagueStats = await initializeLeagueStats();
const calculator = await createAdvancedStatsCalculator(leagueStats);

// Calculate FIP for a pitcher
const pitcherStats = {
    homeRuns: 25,
    walks: 45,
    hitByPitch: 8,
    strikeouts: 180,
    inningsPitched: 200.1,
    earnedRuns: 75
};

const fip = calculator.calculateFIP(pitcherStats);
console.log('FIP:', fip);

// Calculate all pitcher stats
const allPitcherStats = calculator.calculateAllStats(pitcherStats, 'pitcher');
console.log('All pitcher stats:', allPitcherStats);

// Calculate OPS+ for a hitter
const hitterStats = {
    hits: 150,
    walks: 60,
    hitByPitch: 5,
    atBats: 500,
    doubles: 30,
    triples: 3,
    homeRuns: 25,
    sacrificeFlies: 8
};

const opsPlus = calculator.calculateOPSPlus(hitterStats);
console.log('OPS+:', opsPlus);
*/