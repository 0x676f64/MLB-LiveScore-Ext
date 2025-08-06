// mlb-video-matcher.js
// Enhanced MLB Video Matcher and Player for Chrome Extension
// Handles finding and playing videos for ALL types of scoring plays

class MLBVideoMatcher {
    constructor() {
        this.videoCache = new Map();
        this.gameContentCache = new Map();
        this.rateLimitDelay = 1000; // 1 second between API calls
        this.lastApiCall = 0;
        this.activeVideoPlayers = new Set(); // Track active video players
        this.contentWrapperState = null; // Store original content wrapper state
        
        // Enhanced scoring play detection patterns
        this.scoringPlayPatterns = {
            // Direct scoring hits
            'home_run': {
                keywords: ['homer', 'home run', 'hr', 'grand slam', 'solo shot', 'two-run homer', 'three-run homer'],
                weight: 1.0
            },
            'triple': {
                keywords: ['triple', '3b', 'three-base hit'],
                weight: 0.9
            },
            'double': {
                keywords: ['double', '2b', 'two-base hit', 'rbi double'],
                weight: 0.9
            },
            'single': {
                keywords: ['single', '1b', 'rbi single', 'infield single', 'bloop single'],
                weight: 0.8
            },
            
            // Sacrifice plays
            'sac_fly': {
                keywords: ['sacrifice fly', 'sac fly', 'sf', 'flyout', 'fly ball', 'popup'],
                weight: 0.8
            },
            'sac_bunt': {
                keywords: ['sacrifice bunt', 'sac bunt', 'bunt', 'squeeze play'],
                weight: 0.7
            },
            
            // Fielding plays that score runs
            'groundout': {
                keywords: ['groundout', 'ground out', 'fielder choice', 'rbi groundout', 'go'],
                weight: 0.7
            },
            'double_play': {
                keywords: ['double play', 'dp', 'gidp', 'grounded into dp', 'twin killing'],
                weight: 0.6
            },
            'fielders_choice': {
                keywords: ['fielder choice', 'fc', "fielder's choice"],
                weight: 0.6
            },
            
            // Errors and defensive miscues
            'error': {
                keywords: ['error', 'e', 'throwing error', 'fielding error', 'miscue', 'bobble'],
                weight: 0.7
            },
            'wild_pitch': {
                keywords: ['wild pitch', 'wp', 'passed ball', 'pb'],
                weight: 0.6
            },
            
            // Walks and HBP that score runs
            'walk': {
                keywords: ['walk', 'bb', 'base on balls', 'intentional walk', 'ibb', 'bases loaded walk'],
                weight: 0.5
            },
            'hit_by_pitch': {
                keywords: ['hit by pitch', 'hbp', 'plunked', 'beaned'],
                weight: 0.6
            },
            
            // Stolen bases and advances
            'stolen_base': {
                keywords: ['stolen base', 'sb', 'steal', 'steals', 'swipe'],
                weight: 0.4
            },
            'balk': {
                keywords: ['balk', 'illegal pitch'],
                weight: 0.5
            }
        };
        
        // Enhanced player name variations
        this.nameVariations = new Map();
    }

    // Rate limiting helper
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        if (timeSinceLastCall < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
        }
        this.lastApiCall = Date.now();
    }

    // Enhanced game content fetching with retry logic
    async fetchGameContent(gamePk, maxRetries = 3) {
        if (this.gameContentCache.has(gamePk)) {
            return this.gameContentCache.get(gamePk);
        }

        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.waitForRateLimit();
                const response = await fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/content`, {
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'max-age=300' // 5 minute cache
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const gameContent = await response.json();
                this.gameContentCache.set(gamePk, gameContent);
                console.log(`✅ Fetched game content for ${gamePk} (attempt ${attempt})`);
                return gameContent;
            } catch (error) {
                lastError = error;
                console.warn(`❌ Attempt ${attempt} failed for game ${gamePk}:`, error.message);
                
                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        console.error(`Failed to fetch game content after ${maxRetries} attempts:`, lastError);
        return null;
    }

    // Enhanced video extraction with better filtering
    extractHighlightVideos(gameContent) {
        const videos = [];
        
        try {
            const highlights = gameContent?.highlights?.highlights?.items || [];
            console.log(`Processing ${highlights.length} potential highlights`);
            
            highlights.forEach((highlight, index) => {
                const playbacks = highlight?.playbacks || [];
                const bestPlayback = this.selectBestPlayback(playbacks);
                
                if (bestPlayback && highlight.date) {
                    const video = {
                        id: highlight.guid || highlight.id || `highlight_${index}`,
                        title: highlight.title || '',
                        description: highlight.description || '',
                        slug: highlight.slug || '',
                        date: highlight.date,
                        url: bestPlayback.url,
                        duration: highlight.duration || 0,
                        keywords: this.extractKeywords(highlight),
                        playbackType: bestPlayback.name || 'unknown',
                        highlightIndex: index,
                        // Enhanced metadata
                        quality: this.getPlaybackQuality(bestPlayback),
                        isScoring: this.isLikelyScoringPlay(highlight)
                    };
                    
                    videos.push(video);
                }
            });

            // Sort by scoring likelihood and quality
            videos.sort((a, b) => {
                if (a.isScoring !== b.isScoring) {
                    return b.isScoring - a.isScoring; // Scoring plays first
                }
                return b.quality - a.quality; // Then by quality
            });

            console.log(`✅ Extracted ${videos.length} videos (${videos.filter(v => v.isScoring).length} likely scoring plays)`);
            return videos;
        } catch (error) {
            console.error('❌ Error extracting highlight videos:', error);
            return [];
        }
    }

    // Enhanced keyword extraction
    extractKeywords(highlight) {
        const keywordSources = [
            highlight.keywordsAll?.map(k => k.value) || [],
            highlight.keywords?.map(k => k.value) || [],
            highlight.title?.split(' ') || [],
            highlight.description?.split(' ') || []
        ];
        
        return keywordSources
            .flat()
            .filter(Boolean)
            .map(k => k.toLowerCase())
            .filter(k => k.length > 2) // Filter out short words
            .join(' ');
    }

    // Determine if highlight is likely a scoring play
    isLikelyScoringPlay(highlight) {
        const content = `${highlight.title || ''} ${highlight.description || ''}`.toLowerCase();
        const keywords = this.extractKeywords(highlight).toLowerCase();
        const allContent = `${content} ${keywords}`;
        
        // Check for scoring indicators
        const scoringIndicators = [
            'rbi', 'run', 'score', 'homer', 'home run', 'grand slam',
            'sac fly', 'sacrifice', 'groundout', 'error', 'wild pitch',
            'double play', 'fielder choice', 'walk', 'bases loaded'
        ];
        
        return scoringIndicators.some(indicator => allContent.includes(indicator));
    }

    // Get playback quality score
    getPlaybackQuality(playback) {
        if (!playback.name) return 0;
        
        const qualityMap = {
            '2500K': 100,
            '1800K': 90,
            '1200K': 80,
            '800K': 70,
            '600K': 60,
            '450K': 50
        };
        
        for (const [quality, score] of Object.entries(qualityMap)) {
            if (playback.name.includes(quality)) {
                return score;
            }
        }
        return 30; // Default for unknown quality
    }

    // Enhanced playback selection with MP4 priority
    selectBestPlayback(playbacks) {
        if (!playbacks || playbacks.length === 0) return null;

        // Group playbacks by type
        const mp4Playbacks = [];
        const hlsPlaybacks = [];
        const otherPlaybacks = [];
        
        playbacks.forEach(p => {
            const name = (p.name || '').toLowerCase();
            const url = (p.url || '').toLowerCase();
            
            if (name.includes('mp4') || url.includes('.mp4')) {
                mp4Playbacks.push(p);
            } else if (name.includes('hls') || url.includes('.m3u8')) {
                hlsPlaybacks.push(p);
            } else {
                otherPlaybacks.push(p);
            }
        });

        // Prioritize MP4, then HLS, then others
        const prioritizedPlaybacks = [...mp4Playbacks, ...hlsPlaybacks, ...otherPlaybacks];
        
        if (prioritizedPlaybacks.length === 0) return playbacks[0];

        // Select best quality from prioritized list
        const preferredQualities = ['2500K', '1800K', '1200K', '800K', '600K', '450K'];
        
        for (const quality of preferredQualities) {
            const qualityPlayback = prioritizedPlaybacks.find(p => 
                p.name && p.name.includes(quality)
            );
            if (qualityPlayback) {
                console.log(`📺 Selected ${qualityPlayback.name || 'unnamed'} playback`);
                return qualityPlayback;
            }
        }

        console.log(`📺 Selected default playback: ${prioritizedPlaybacks[0].name || 'unnamed'}`);
        return prioritizedPlaybacks[0];
    }

    // Enhanced text normalization
    normalizeDescription(desc) {
        if (!desc) return '';
        
        return desc
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .replace(/\b(1st|2nd|3rd|4th|5th|6th|7th|8th|9th)\b/g, match => match.replace(/\D/g, '')) // Normalize ordinals
            .replace(/\bhomers?\b/g, 'home run')
            .replace(/\bdoubles?\b/g, 'double')
            .replace(/\btriples?\b/g, 'triple')
            .replace(/\bsingles?\b/g, 'single')
            .replace(/\bsac fly\b/g, 'sacrifice fly')
            .replace(/\bdp\b/g, 'double play')
            .replace(/\bgidp\b/g, 'grounded into double play')
            .replace(/\bfc\b/g, 'fielder choice')
            .replace(/\bhbp\b/g, 'hit by pitch')
            .replace(/\bwp\b/g, 'wild pitch')
            .replace(/\bpb\b/g, 'passed ball')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Enhanced similarity calculation with fuzzy matching
    calculateAdvancedSimilarity(str1, str2) {
        const words1 = str1.split(' ').filter(w => w.length > 2);
        const words2 = str2.split(' ').filter(w => w.length > 2);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        let exactMatches = 0;
        let fuzzyMatches = 0;
        
        words1.forEach(word1 => {
            // Exact match
            if (words2.includes(word1)) {
                exactMatches++;
            } else {
                // Fuzzy match (substring or similar)
                const fuzzyMatch = words2.some(word2 => 
                    this.isSubstringMatch(word1, word2) || 
                    this.calculateLevenshteinSimilarity(word1, word2) > 0.7
                );
                if (fuzzyMatch) {
                    fuzzyMatches += 0.5; // Partial credit for fuzzy matches
                }
            }
        });
        
        const totalScore = exactMatches + fuzzyMatches;
        const maxPossible = Math.max(words1.length, words2.length);
        
        return totalScore / maxPossible;
    }

    // Helper for substring matching
    isSubstringMatch(word1, word2) {
        if (word1.length < 4 || word2.length < 4) return false;
        return word1.includes(word2) || word2.includes(word1);
    }

    // Levenshtein similarity for fuzzy matching
    calculateLevenshteinSimilarity(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;
        
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        
        const distance = matrix[len1][len2];
        return 1 - (distance / Math.max(len1, len2));
    }

    // Enhanced video matching with multi-factor scoring
    matchVideoByDescription(play, videos, threshold = 0.25) {
        const playDesc = this.normalizeDescription(play.result?.description || '');
        const playerName = this.normalizeDescription(play.matchup?.batter?.fullName || '');
        const pitcherName = this.normalizeDescription(play.matchup?.pitcher?.fullName || '');
        const playType = this.normalizeDescription(play.result?.event || '');
        
        console.log(`🔍 Matching play: "${playDesc}" by ${playerName} (${playType})`);
        
        let bestMatch = null;
        let bestScore = 0;

        videos.forEach((video, index) => {
            const videoText = this.normalizeDescription(
                `${video.title} ${video.description} ${video.keywords}`
            );
            
            // Multi-factor scoring
            const descSimilarity = this.calculateAdvancedSimilarity(playDesc, videoText);
            const batterSimilarity = playerName ? this.calculateAdvancedSimilarity(playerName, videoText) : 0;
            const pitcherSimilarity = pitcherName ? this.calculateAdvancedSimilarity(pitcherName, videoText) : 0;
            const playTypeSimilarity = this.calculatePlayTypeSimilarity(playType, videoText);
            
            // Weighted combined score
            const combinedScore = (
                descSimilarity * 0.4 +
                batterSimilarity * 0.25 +
                pitcherSimilarity * 0.15 +
                playTypeSimilarity * 0.2
            );
            
            // Bonus for scoring plays
            const scoringBonus = video.isScoring ? 0.1 : 0;
            const finalScore = Math.min(combinedScore + scoringBonus, 1.0);
            
            console.log(`📊 Video ${index}: "${video.title}" - Score: ${finalScore.toFixed(3)} (desc:${descSimilarity.toFixed(2)}, batter:${batterSimilarity.toFixed(2)}, pitcher:${pitcherSimilarity.toFixed(2)}, type:${playTypeSimilarity.toFixed(2)})`);
            
            if (finalScore > bestScore && finalScore >= threshold) {
                bestScore = finalScore;
                bestMatch = { ...video, matchScore: finalScore };
            }
        });

        if (bestMatch) {
            console.log(`✅ Best match: "${bestMatch.title}" (${bestMatch.matchScore.toFixed(3)})`);
        } else {
            console.log(`❌ No match above threshold ${threshold}`);
        }

        return bestMatch;
    }

    // Calculate play type similarity using scoring patterns
    calculatePlayTypeSimilarity(playType, videoText) {
        let bestScore = 0;
        
        for (const [type, config] of Object.entries(this.scoringPlayPatterns)) {
            const typeMatches = config.keywords.some(keyword => 
                playType.includes(keyword) || videoText.includes(keyword)
            );
            
            if (typeMatches) {
                const score = config.weight * this.calculateAdvancedSimilarity(playType, videoText);
                bestScore = Math.max(bestScore, score);
            }
        }
        
        return bestScore;
    }

    // Enhanced temporal matching with context awareness
    matchVideoByTime(play, videos, maxMinutesDiff = 10) {
        const playTime = this.getPlayTime(play);
        if (!playTime) {
            console.log('⏰ No play time available for temporal matching');
            return null;
        }

        const maxDiff = maxMinutesDiff * 60 * 1000;
        console.log(`⏰ Temporal matching around: ${playTime.toISOString()}`);

        let bestMatch = null;
        let smallestDiff = maxDiff;

        videos.forEach((video, index) => {
            try {
                const videoTime = new Date(video.date);
                const timeDiff = Math.abs(videoTime - playTime);
                const minutesDiff = timeDiff / (60 * 1000);
                
                console.log(`⏰ Video ${index}: "${video.title}" - ${minutesDiff.toFixed(1)}min diff`);
                
                if (timeDiff < smallestDiff) {
                    smallestDiff = timeDiff;
                    bestMatch = { 
                        ...video, 
                        timeDiff,
                        timeScore: Math.max(0, 1 - (timeDiff / maxDiff))
                    };
                }
            } catch (error) {
                console.warn(`⚠️ Invalid video date for video ${index}:`, error);
            }
        });

        if (bestMatch) {
            const minutesDiff = bestMatch.timeDiff / (60 * 1000);
            console.log(`✅ Best temporal match: "${bestMatch.title}" (${minutesDiff.toFixed(1)}min diff)`);
        }

        return bestMatch;
    }

    // Get play time from various possible fields
    getPlayTime(play) {
        const timeFields = [
            play.about?.startTime,
            play.about?.endTime,
            play.playEndTime,
            play.playStartTime
        ];
        
        for (const timeField of timeFields) {
            if (timeField) {
                try {
                    return new Date(timeField);
                } catch (error) {
                    continue;
                }
            }
        }
        return null;
    }

    // Enhanced play-video validation with comprehensive scoring patterns
    validatePlayVideoMatch(play, video) {
        const playType = this.normalizeDescription(play.result?.event || '');
        const playDesc = this.normalizeDescription(play.result?.description || '');
        const videoContent = this.normalizeDescription(`${video.title} ${video.description} ${video.keywords}`);
        
        console.log(`🔍 Validating: "${playType}" against "${video.title}"`);
        
        // Check for any scoring play patterns
        for (const [type, config] of Object.entries(this.scoringPlayPatterns)) {
            const playMatches = config.keywords.some(keyword => 
                playType.includes(keyword) || playDesc.includes(keyword)
            );
            const videoMatches = config.keywords.some(keyword => 
                videoContent.includes(keyword)
            );
            
            if (playMatches && videoMatches) {
                console.log(`✅ Validation PASS: Both contain ${type} indicators`);
                return true;
            } else if (playMatches || videoMatches) {
                // Partial match - might still be valid
                const similarity = this.calculateAdvancedSimilarity(playDesc, videoContent);
                if (similarity > 0.3) {
                    console.log(`✅ Validation PASS: Partial match with high similarity (${similarity.toFixed(3)})`);
                    return true;
                }
            }
        }

        // Special validation for generic terms
        const genericScoringTerms = ['run', 'score', 'rbi', 'home', 'base', 'hit'];
        const playHasScoring = genericScoringTerms.some(term => 
            playType.includes(term) || playDesc.includes(term)
        );
        const videoHasScoring = genericScoringTerms.some(term => 
            videoContent.includes(term)
        );
        
        if (playHasScoring && videoHasScoring) {
            console.log(`✅ Validation PASS: Generic scoring indicators found`);
            return true;
        }

        console.log(`❌ Validation FAIL: No matching scoring patterns`);
        return false;
    }

    // Enhanced main matching function with fallback strategies
    async findVideoForPlay(gamePk, play) {
        const cacheKey = `${gamePk}_${play.about?.atBatIndex || play.atBatIndex}_${Date.now() % 3600000}`; // Hour-based cache
        
        if (this.videoCache.has(cacheKey)) {
            console.log('📦 Returning cached result');
            return this.videoCache.get(cacheKey);
        }

        try {
            console.log(`🔍 Finding video for game ${gamePk}, at-bat ${play.about?.atBatIndex || play.atBatIndex}`);
            
            const gameContent = await this.fetchGameContent(gamePk);
            if (!gameContent) {
                console.log('❌ Failed to fetch game content');
                return null;
            }

            const videos = this.extractHighlightVideos(gameContent);
            if (videos.length === 0) {
                console.log('❌ No highlight videos found');
                return null;
            }

            console.log(`📺 Processing ${videos.length} videos for matching...`);

            // Strategy 1: Description-based matching (primary)
            let matchedVideo = this.matchVideoByDescription(play, videos, 0.25);
            let matchStrategy = 'description';
            
            // Strategy 2: Temporal matching (secondary)
            if (!matchedVideo) {
                console.log('🔄 Trying temporal matching...');
                matchedVideo = this.matchVideoByTime(play, videos, 15);
                matchStrategy = 'temporal';
            }
            
            // Strategy 3: Relaxed description matching (tertiary)
            if (!matchedVideo) {
                console.log('🔄 Trying relaxed description matching...');
                matchedVideo = this.matchVideoByDescription(play, videos, 0.15);
                matchStrategy = 'relaxed_description';
            }
            
            // Strategy 4: Best scoring play fallback
            if (!matchedVideo && videos.some(v => v.isScoring)) {
                console.log('🔄 Using best scoring play fallback...');
                matchedVideo = videos.find(v => v.isScoring);
                matchedVideo.matchScore = 0.1; // Low confidence score
                matchStrategy = 'fallback_scoring';
            }

            // Validate the match
            if (matchedVideo && !this.validatePlayVideoMatch(play, matchedVideo)) {
                console.log('❌ Video validation failed, checking if we should keep it anyway...');
                
                // Keep high-confidence matches even if validation fails
                if (matchedVideo.matchScore && matchedVideo.matchScore > 0.6) {
                    console.log('✅ Keeping high-confidence match despite validation failure');
                } else {
                    console.log('❌ Discarding low-confidence match that failed validation');
                    matchedVideo = null;
                }
            }

            // Cache the result
            this.videoCache.set(cacheKey, matchedVideo);
            
            if (matchedVideo) {
                console.log(`✅ Found video via ${matchStrategy}: "${matchedVideo.title}" (confidence: ${matchedVideo.matchScore?.toFixed(3) || 'N/A'})`);
                console.log(`🔗 URL: ${matchedVideo.url}`);
            } else {
                console.log('❌ No suitable video found after all strategies');
            }

            return matchedVideo;
        } catch (error) {
            console.error('💥 Error in findVideoForPlay:', error);
            return null;
        }
    }

    // Rest of the methods remain the same but with enhanced error handling...
    
    // Hide content wrapper with smooth transition
    hideContentWrapper() {
        const contentWrapper = document.querySelector('.content-wrapper');
        if (!contentWrapper) return;

        // Store the original state if this is the first video being opened
        if (this.activeVideoPlayers.size === 0) {
            this.contentWrapperState = {
                element: contentWrapper,
                originalDisplay: contentWrapper.style.display || 'block',
                originalVisibility: contentWrapper.style.visibility || 'visible',
                originalOpacity: contentWrapper.style.opacity || '1',
                originalTransition: contentWrapper.style.transition || ''
            };

            // Add smooth transition
            contentWrapper.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Trigger the fade out
            requestAnimationFrame(() => {
                contentWrapper.style.opacity = '0';
                contentWrapper.style.transform = 'translateY(-10px)';
                
                // Hide after animation completes
                setTimeout(() => {
                    if (contentWrapper.style.opacity === '0') { // Only hide if still faded out
                        contentWrapper.style.display = 'none';
                    }
                }, 400);
            });
        }
    }

    // Show content wrapper with smooth transition
    showContentWrapper() {
        if (!this.contentWrapperState) return;

        const { element, originalDisplay, originalVisibility, originalOpacity, originalTransition } = this.contentWrapperState;
        
        // Only show if no active video players remain
        if (this.activeVideoPlayers.size === 0) {
            // Reset display and prepare for fade in
            element.style.display = originalDisplay;
            element.style.opacity = '0';
            element.style.transform = 'translateY(-10px)';
            
            // Trigger the fade in
            requestAnimationFrame(() => {
                element.style.opacity = originalOpacity;
                element.style.transform = 'translateY(0)';
                
                // Restore original transition after animation completes
                setTimeout(() => {
                    element.style.transition = originalTransition;
                    element.style.visibility = originalVisibility;
                }, 400);
            });

            // Clear the stored state
            this.contentWrapperState = null;
        }
    }

    // Enhanced video player creation with better error handling
    createVideoPlayer(video, playDiv, videoButton) {
        // Remove existing video player if present
        const existingPlayer = playDiv.querySelector('.mlb-video-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }

        // Hide content wrapper when opening video
        this.hideContentWrapper();

        // Track this video player
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.activeVideoPlayers.add(playerId);

        // Hide the video button when player opens
        videoButton.style.opacity = '0';
        videoButton.style.pointerEvents = 'none';

        const playerContainer = document.createElement('div');
        playerContainer.className = 'mlb-video-player';
        playerContainer.dataset.playerId = playerId;
        playerContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            width: 90vw;
            max-width: 900px;
            height: 0;
            border-radius: 12px;
            overflow: visible;
            background: linear-gradient(152deg,rgba(4, 30, 65, 1) 44%, rgba(255, 255, 255, 1) 50%, rgba(191, 13, 61, 1) 55%);
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 25px 50px rgba(0,0,0,0.4);
            z-index: 1000;
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(3px);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.4s ease;
        `;
        backdrop.onclick = () => this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);

        const videoElement = document.createElement('video');
        videoElement.style.cssText = `
            width: 100%;
            height: 500px;
            display: block;
            background: #000;
            border-radius: 12px;
            position: relative;
            z-index: 1;
        `;
        videoElement.controls = true;
        videoElement.preload = 'metadata';
        videoElement.src = video.url;
        videoElement.crossOrigin = 'anonymous'; // For CORS if needed
        
        // Ensure video controls are always accessible
        videoElement.style.pointerEvents = 'auto';
        videoElement.tabIndex = 0;

        // Enhanced video event handlers
        videoElement.onloadedmetadata = () => {
            console.log('📺 Video metadata loaded successfully');
            // Show backdrop first
            backdrop.style.opacity = '1';
            
            // Then expand the player with smooth animation
            setTimeout(() => {
                playerContainer.style.height = '500px';
                playerContainer.style.opacity = '1';
                playerContainer.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
        };

        videoElement.oncanplay = () => {
            console.log('📺 Video ready to play');
        };

        // Reset button when video ends
        videoElement.onended = () => {
            console.log('📺 Video playback ended');
            // Don't auto-close, just reset button state for potential rewatch
            setTimeout(() => {
                this.resetVideoButton(videoButton);
            }, 1000);
        };

        videoElement.onerror = (e) => {
            console.error('❌ Video error:', e);
            const errorTypes = {
                1: 'MEDIA_ERR_ABORTED',
                2: 'MEDIA_ERR_NETWORK', 
                3: 'MEDIA_ERR_DECODE',
                4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
            };
            
            const errorType = errorTypes[videoElement.error?.code] || 'UNKNOWN_ERROR';
            
            playerContainer.innerHTML = `
                <div style="padding: 60px 40px; text-align: center; color: #fff; height: 300px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <p style="margin: 0; font-weight: bold; font-size: 20px; margin-bottom: 10px;">Unable to load video</p>
                    <p style="margin: 0; opacity: 0.8; font-size: 16px; margin-bottom: 20px;">${video.title}</p>
                    <small style="opacity: 0.6; font-size: 12px; font-family: monospace;">${errorType}</small>
                </div>
            `;
            playerContainer.style.height = '300px';
            playerContainer.style.opacity = '1';
            playerContainer.style.transform = 'translate(-50%, -50%) scale(1)';
            backdrop.style.opacity = '1';
            
            // Auto-close after 4 seconds
            setTimeout(() => {
                this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);
            }, 4000);
        };

        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 16px;
            z-index: 15;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        loadingIndicator.innerHTML = `
            <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            Loading video...
        `;

        // Add CSS animation for spinner
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // Hide loading indicator when video starts loading
        videoElement.onloadstart = () => {
            if (loadingIndicator.parentNode) {
                loadingIndicator.remove();
            }
        };

        // Enhanced close button - positioned outside video area
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            position: absolute;
            top: -45px;
            right: 10px;
            background: rgba(220, 53, 69, 0.9);
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
        `;
        closeButton.innerHTML = '✕';
        closeButton.title = 'Close video (ESC)';
        
        closeButton.onmouseover = () => {
            closeButton.style.backgroundColor = 'rgba(220, 53, 69, 1)';
            closeButton.style.transform = 'scale(1.1)';
            closeButton.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
        };
        closeButton.onmouseleave = () => {
            closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
            closeButton.style.transform = 'scale(1)';
            closeButton.style.boxShadow = 'none';
        };
        closeButton.onclick = (e) => {
            e.stopPropagation();
            videoElement.pause();
            this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);
        };

        // Add non-intrusive video title above the player (outside video area)
        const titleHeader = document.createElement('div');
        titleHeader.style.cssText = `
            position: absolute;
            top: -50px;
            left: 0;
            right: 0;
            color: white;
            padding: 10px 20px;
            text-align: center;
            background: rgba(0,0,0,0.8);
            border-radius: 8px 8px 0 0;
            backdrop-filter: blur(5px);
        `;
        
        const confidence = video.matchScore ? ` (${Math.round(video.matchScore * 100)}% match)` : '';
        const duration = video.duration ? ` • ${Math.round(video.duration)}s` : '';
        
        titleHeader.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${video.title}</div>
            <div style="font-size: 12px; opacity: 0.8;">
                ${video.playbackType}${duration}${confidence}
            </div>
        `;

        // Move quality indicator to top-right corner, outside video area
        const qualityBadge = document.createElement('div');
        qualityBadge.style.cssText = `
            position: absolute;
            top: -45px;
            right: 60px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.2);
        `;
        qualityBadge.textContent = video.quality ? `${video.quality}p` : 'HD';

        // Create wrapper that doesn't interfere with video controls
        const videoWrapper = document.createElement('div');
        videoWrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';
        
        // Only add the video element to the wrapper - no overlays that block controls
        videoWrapper.appendChild(videoElement);
        videoWrapper.appendChild(loadingIndicator);
        
        // Add elements outside the video area so they don't block controls
        playerContainer.appendChild(titleHeader);
        playerContainer.appendChild(closeButton);
        playerContainer.appendChild(qualityBadge);
        playerContainer.appendChild(videoWrapper);
        
        // Add elements to document
        document.body.appendChild(backdrop);
        document.body.appendChild(playerContainer);

        // Enhanced keyboard controls
        const handleKeydown = (e) => {
            if (e.target.closest('.mlb-video-player')) {
                switch(e.key) {
                    case 'Escape':
                        videoElement.pause();
                        this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);
                        break;
                    case ' ':
                        e.preventDefault();
                        if (videoElement.paused) {
                            videoElement.play();
                        } else {
                            videoElement.pause();
                        }
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        videoElement.currentTime = Math.max(0, videoElement.currentTime - 5);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 5);
                        break;
                    case 'f':
                    case 'F':
                        if (videoElement.requestFullscreen) {
                            videoElement.requestFullscreen();
                        }
                        break;
                }
            }
        };
        document.addEventListener('keydown', handleKeydown);

        // Cleanup function
        playerContainer.cleanup = () => {
            document.removeEventListener('keydown', handleKeydown);
            if (style.parentNode) {
                style.remove();
            }
        };

        return videoElement;
    }

    // Enhanced close video player with better cleanup and button reset
    closeVideoPlayer(playerContainer, playDiv, videoButton, playerId) {
        // Remove from active players
        this.activeVideoPlayers.delete(playerId);

        const backdrop = document.querySelector('div[style*="backdrop-filter: blur(3px)"]');
        
        // Cleanup event listeners
        if (playerContainer.cleanup) {
            playerContainer.cleanup();
        }
        
        // Collapse the player with smooth animation
        playerContainer.style.height = '0';
        playerContainer.style.opacity = '0';
        playerContainer.style.transform = 'translate(-50%, -50%) scale(0.8)';
        
        // Fade out backdrop
        if (backdrop) {
            backdrop.style.opacity = '0';
        }
        
        // Show content wrapper if no more active videos
        setTimeout(() => {
            this.showContentWrapper();
        }, 200);
        
        // Reset video button to original state
        setTimeout(() => {
            this.resetVideoButton(videoButton);
        }, 300);
        
        // Remove elements after animation completes
        setTimeout(() => {
            if (playerContainer?.parentNode) {
                playerContainer.remove();
            }
            if (backdrop?.parentNode) {
                backdrop.remove();
            }
        }, 500);
    }

    // Reset video button to original clickable state
    resetVideoButton(videoButton) {
        if (!videoButton) return;

        videoButton.style.transition = 'all 0.3s ease';
        videoButton.style.opacity = '1';
        videoButton.style.pointerEvents = 'auto';
        videoButton.disabled = false;
        
        // Reset to original appearance and content
        videoButton.innerHTML = `
            <img src="/assets/icons/video-camera.png" alt="📹" style="width: 16px; height: 16px; filter: contrast(1.2);" />
            <span style="font-size: 11px;">VIDEO</span>
        `;
        videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
        
        console.log('🔄 Video button reset to original state');
    }

    // Enhanced video button with better visual feedback
    addVideoButtonToPlay(playDiv, gamePk, play) {
        // Check if button already exists
        if (playDiv.querySelector('.video-button')) {
            return;
        }

        const videoButton = document.createElement('button');
        videoButton.className = 'video-button';
        videoButton.style.cssText = `
            position: absolute;
            bottom: 1vh;
            right: 1vw;
            background: linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95));
            border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 14px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10;
            opacity: 1;
            pointer-events: auto;
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        
        // Enhanced button content with icon and text
        videoButton.innerHTML = `
            <img src="/assets/icons/video-camera.png" alt="📹" style="width: 16px; height: 16px; filter: contrast(1.2);" />
            <span style="font-size: 11px;">VIDEO</span>
        `;

        // Enhanced hover effects
        videoButton.onmouseover = () => {
            if (videoButton.style.opacity === '1') {
                videoButton.style.transform = 'scale(1.08) translateY(-1px)';
                videoButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                videoButton.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(217,230,243,0.98))';
            }
        };
        
        videoButton.onmouseleave = () => {
            if (videoButton.style.opacity === '1') {
                videoButton.style.transform = 'scale(1) translateY(0)';
                videoButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
            }
        };

        // Enhanced click handler with loading states
        videoButton.onclick = async (e) => {
            e.stopPropagation();
            
            // Prevent clicks when button is hidden
            if (videoButton.style.opacity === '0' || videoButton.style.pointerEvents === 'none') {
                return;
            }

            // Disable button and show loading state
            videoButton.disabled = true;
            const originalContent = videoButton.innerHTML;
            videoButton.innerHTML = `
                <div style="width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.3); border-top: 2px solid rgba(0,0,0,0.8); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <span style="font-size: 11px;">LOADING</span>
            `;
            videoButton.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,248,255,0.9))';

            try {
                const video = await this.findVideoForPlay(gamePk, play);
                
                if (video) {
                    // Success feedback
                    videoButton.innerHTML = `
                        <span style="color: green;">✓</span>
                        <span style="font-size: 11px;">FOUND</span>
                    `;
                    videoButton.style.background = 'linear-gradient(135deg, rgba(220,252,231,0.9), rgba(187,247,208,0.9))';
                    
                    // Brief delay then create player
                    setTimeout(() => {
                        this.createVideoPlayer(video, playDiv, videoButton);
                    }, 300);
                } else {
                    // Not found feedback
                    videoButton.innerHTML = `
                        <span style="color: #dc3545;">✕</span>
                        <span style="font-size: 11px;">NO VIDEO</span>
                    `;
                    videoButton.style.background = 'linear-gradient(135deg, rgba(254,226,226,0.9), rgba(252,165,165,0.9))';
                    
                    // Reset after delay
                    setTimeout(() => {
                        videoButton.innerHTML = originalContent;
                        videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
                        videoButton.disabled = false;
                    }, 2500);
                }
            } catch (error) {
                console.error('💥 Error loading video:', error);
                
                // Error feedback
                videoButton.innerHTML = `
                    <span style="color: #dc3545;">⚠</span>
                    <span style="font-size: 11px;">ERROR</span>
                `;
                videoButton.style.background = 'linear-gradient(135deg, rgba(254,226,226,0.9), rgba(252,165,165,0.9))';
                
                // Reset after delay
                setTimeout(() => {
                    videoButton.innerHTML = originalContent;
                    videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
                    videoButton.disabled = false;
                }, 2500);
            }
        };

        playDiv.appendChild(videoButton);
    }

    // Enhanced cache management with size limits and TTL
    clearCache(maxAge = 3600000) { // 1 hour default
        const now = Date.now();
        const cutoff = now - maxAge;
        
        // Clear old cache entries
        for (const [key, value] of this.videoCache.entries()) {
            if (value && value.cached && value.cached < cutoff) {
                this.videoCache.delete(key);
            }
        }
        
        for (const [key, value] of this.gameContentCache.entries()) {
            if (value && value.cached && value.cached < cutoff) {
                this.gameContentCache.delete(key);
            }
        }
        
        // Limit cache size
        if (this.videoCache.size > 100) {
            const entries = Array.from(this.videoCache.entries());
            const toDelete = entries.slice(0, entries.length - 100);
            toDelete.forEach(([key]) => this.videoCache.delete(key));
        }
        
        if (this.gameContentCache.size > 20) {
            const entries = Array.from(this.gameContentCache.entries());
            const toDelete = entries.slice(0, entries.length - 20);
            toDelete.forEach(([key]) => this.gameContentCache.delete(key));
        }
        
        console.log(`🧹 Cache cleanup: ${this.videoCache.size} video entries, ${this.gameContentCache.size} game entries`);
    }

    // Cleanup all active video players and reset state
    cleanup() {
        // Close all active players
        const players = document.querySelectorAll('.mlb-video-player');
        players.forEach(player => {
            const playerId = player.dataset.playerId;
            if (playerId) {
                const videoButton = document.querySelector('.video-button');
                this.closeVideoPlayer(player, null, videoButton, playerId);
            }
        });
        
        // Clear caches
        this.clearCache();
        
        // Reset state
        this.activeVideoPlayers.clear();
        this.contentWrapperState = null;
        
        console.log('🧹 MLBVideoMatcher cleanup completed');
    }
}

// Export for use in other files with enhanced error handling
try {
    window.MLBVideoMatcher = MLBVideoMatcher;
    console.log('✅ MLBVideoMatcher loaded successfully');
} catch (error) {
    console.error('💥 Failed to load MLBVideoMatcher:', error);
}
