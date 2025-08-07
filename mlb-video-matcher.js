// mlb-video-matcher.js - Enhanced and Fixed Version
// Addresses productive outs matching and duplicate method issues

class MLBVideoMatcher {
    constructor() {
        this.videoCache = new Map();
        this.gameContentCache = new Map();
        this.usedVideoIds = new Set();
        this.rateLimitDelay = 1000;
        this.lastApiCall = 0;
        this.activeVideoPlayers = new Set();
        this.contentWrapperState = null;
        
        // Enhanced play type patterns with better productive outs coverage
        this.playTypePatterns = {
            'home_run': ['homers', 'home run', 'hr', 'grand slam', 'solo shot', 'two-run homer', 'three-run homer', 'solo homer', 'grand-slam'],
            'triple': ['triples', '3b', 'three-base hit'],
            'double': ['doubles', '2b', 'two-base hit', 'rbi double'],
            'single': ['singles', '1b', 'rbi single', 'infield single', 'bloop single'],
            'sac_fly': ['sacrifice fly', 'sac fly', 'sf', 'sac-fly', 'sacrifice-fly'],
            'sac_bunt': ['sacrifice bunt', 'sac bunt', 'squeeze', 'sac-bunt', 'sacrifice-bunt'],  
            'groundout': ['groundout', 'grounds out', 'ground out', 'rbi groundout', 'grounds', 'force out'],
            'flyout': ['flyout', 'fly out', 'popup', 'pop out', 'flies out'],
            'double_play': ['double play', 'dp', 'gidp', 'twin killing', 'double-play'],
            'fielders_choice': ['fielder choice', 'fc', "fielder's choice", 'fielders-choice'],
            'error': ['error', 'throwing error', 'fielding error', 'reaches on error'],
            'wild_pitch': ['wild pitch', 'wp'],
            'passed_ball': ['passed ball', 'pb'],
            'walk': ['walk', 'bb', 'base on balls', 'intentional walk', 'ibb'],
            'hit_by_pitch': ['hit by pitch', 'hbp']
        };

        // Enhanced productive outs patterns - key for your issues
        this.productiveOutPatterns = {
            'rbi_groundout': ['rbi groundout', 'rbi ground out', 'grounds out', 'groundout rbi'],
            'rbi_flyout': ['rbi flyout', 'rbi fly out', 'flies out', 'flyout rbi'],
            'sac_fly': ['sacrifice fly', 'sac fly', 'sf'],
            'sac_bunt': ['sacrifice bunt', 'sac bunt'],
            'force_out_rbi': ['force out', 'grounds into force', 'rbi force'],
            'fielders_choice_rbi': ['fielders choice', 'fielder choice', 'fc']
        };

        // Video ID patterns for complex plays
        this.complexPlayPatterns = {
            'force_out': ['force-out', 'forceout', 'force', 'grounds-into', 'grounds-out'],
            'fielders_choice': ['fielders-choice', 'fielder-choice', 'fc'],
            'error': ['error', 'reaches-on-error', 'on-error'],
            'groundout_rbi': ['rbi-groundout', 'groundout-rbi', 'rbi-ground'],
            'double_play': ['double-play', 'dp', 'gidp', 'twin-killing'],
            'sac_fly': ['sacrifice-fly', 'sac-fly', 'sf'],
            'sac_bunt': ['sacrifice-bunt', 'sac-bunt', 'squeeze']
        };

        this.avoidKeywords = [
            'statcast', 'exit velocity', 'launch angle', 'expected', 'xba', 'xbh',
            'spin rate', 'extension', 'metrics', 'analytics', 'breakdown', 'analysis',
            'graphic', 'animation', 'overlay', 'stats', 'data', 'infographic',
            'visualization', 'chart', 'graph', 'comparison', 'avg', 'era'
        ];

        this.preferKeywords = [
            'highlights', 'play', 'call', 'catch', 'hit', 'throw', 'field',
            'swing', 'pitch', 'bat', 'ball', 'inning', 'run', 'score'
        ];
    }

    // FIXED: Single, comprehensive normalization method
    normalizeText(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            // Remove parenthetical numbers like "(2)"
            .replace(/\(\d+\)/g, '')
            // Enhanced productive outs normalization
            .replace(/grounds into a force out/g, 'force out')
            .replace(/grounds into force out/g, 'force out')
            .replace(/reaches on a fielder's choice/g, 'fielders choice')
            .replace(/fielder's choice/g, 'fielders choice')
            .replace(/reaches on error/g, 'error')
            .replace(/sacrifice fly/g, 'sac fly')
            .replace(/sacrifice bunt/g, 'sac bunt')
            // Handle RBI descriptions better
            .replace(/,\s*([^,]+)\s+scores?/g, ' rbi') // "John Doe scores" -> "rbi"
            .replace(/\bscores?\b/g, 'rbi')
            // Remove verbose descriptions that clutter matching
            .replace(/\bto\s+(1st|2nd|3rd|first|second|third)(\s+base)?\b/g, '')
            .replace(/\bout at\s+(1st|2nd|3rd|first|second|third)\b/g, '')
            .replace(/\b(first|second|third)\s+baseman\b/g, '')
            .replace(/\b(left|center|right)\s+fielder?\b/g, '')
            .replace(/\b(shortstop|catcher|pitcher)\b/g, '')
            // Clean up articles and prepositions
            .replace(/\b(on|a|an|the|to|for|in|at|by|with|into)\b/g, ' ')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Enhanced method to detect productive outs - KEY FIX for your issue
    isProductiveOut(playDescription) {
        const normalized = this.normalizeText(playDescription);
        
        // Check if it's an out that produced runs
        const hasOut = /\b(out|groundout|flyout|grounds out|flies out)\b/.test(normalized);
        const hasRBI = /\b(rbi|scores?|run|home)\b/.test(normalized) || playDescription.includes('scores');
        const isSacrifice = /\b(sacrifice|sac)\b/.test(normalized);
        
        return (hasOut && hasRBI) || isSacrifice;
    }

    // Enhanced productive out type detection
    getProductiveOutType(playDescription) {
        const normalized = this.normalizeText(playDescription);
        
        for (const [type, patterns] of Object.entries(this.productiveOutPatterns)) {
            if (patterns.some(pattern => normalized.includes(pattern))) {
                return type;
            }
        }
        
        // Fallback detection
        if (normalized.includes('ground') && normalized.includes('rbi')) return 'rbi_groundout';
        if (normalized.includes('fly') && normalized.includes('rbi')) return 'rbi_flyout';
        if (normalized.includes('sacrifice fly')) return 'sac_fly';
        if (normalized.includes('sacrifice bunt')) return 'sac_bunt';
        
        return null;
    }

    // FIXED: Enhanced ID matching with better productive outs handling
    calculateIdMatch(playDescription, videoId) {
        if (!playDescription || !videoId) return 0;

        const normalized = this.normalizeText(playDescription);
        const videoWords = videoId.replace(/-/g, ' ').toLowerCase().split(' ').filter(w => w.length > 2);
        const playWords = normalized.split(' ').filter(w => w.length > 2 && w !== 'rbi');
        
        if (playWords.length === 0 || videoWords.length === 0) return 0;

        let score = 0;
        let totalWeight = 0;

        // Enhanced scoring for productive outs
        const isProductive = this.isProductiveOut(playDescription);
        const productiveType = this.getProductiveOutType(playDescription);

        playWords.forEach(playWord => {
            let wordWeight = 1;
            
            // Higher weight for player names (longer words)
            if (playWord.length > 4) wordWeight = 2;
            
            // Highest weight for key action words
            if (['groundout', 'flyout', 'single', 'double', 'triple', 'homer'].includes(playWord)) {
                wordWeight = 3;
            }

            // Special weight for productive out indicators
            if (isProductive && ['grounds', 'flies', 'sacrifice', 'sac'].includes(playWord)) {
                wordWeight = 2.5;
            }

            totalWeight += wordWeight;

            // Exact match
            if (videoWords.includes(playWord)) {
                score += wordWeight;
            } 
            // Partial match for names/complex terms
            else {
                const partialMatch = videoWords.some(videoWord => {
                    return (playWord.includes(videoWord) && videoWord.length > 3) ||
                           (videoWord.includes(playWord) && playWord.length > 3);
                });
                
                if (partialMatch) {
                    score += wordWeight * 0.7;
                }
            }
        });

        let baseScore = totalWeight > 0 ? score / totalWeight : 0;

        // ENHANCED: Productive out bonuses
        if (isProductive && productiveType) {
            const videoIdLower = videoId.toLowerCase();
            const complexPatterns = this.complexPlayPatterns[productiveType.replace('_rbi', '')] || [];
            
            // Bonus for matching productive out patterns
            complexPatterns.forEach(pattern => {
                if (videoIdLower.includes(pattern)) {
                    baseScore += 0.25; // Significant bonus
                }
            });

            // RBI context bonus
            if (playDescription.includes('scores') || playDescription.includes('RBI')) {
                if (videoIdLower.includes('rbi') || videoIdLower.includes('scores')) {
                    baseScore += 0.2;
                }
            }

            // Sacrifice play bonuses
            if (productiveType.startsWith('sac_')) {
                if (videoIdLower.includes('sacrifice') || videoIdLower.includes('sac')) {
                    baseScore += 0.3;
                }
            }
        }

        return Math.min(baseScore, 1.0);
    }

    // Enhanced player extraction with better name handling
    extractKeyPlayersFromPlay(description) {
        if (!description) return [];
        
        const players = [];
        
        // Primary batter (usually first name mentioned)
        const batterMatch = description.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s+Jr\.?)?(?:\s+[IVX]+)?)/);
        if (batterMatch) {
            players.push({
                name: batterMatch[1].trim(),
                role: 'batter',
                weight: 3
            });
        }
        
        // Defensive players (after "to" or mentioned with positions)
        const defensiveMatches = description.matchAll(/(?:to|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s+Jr\.?)?)/g);
        for (const match of defensiveMatches) {
            players.push({
                name: match[1].trim(),
                role: 'fielder',
                weight: 2
            });
        }
        
        // Players who score - ENHANCED for productive outs
        const scoringPatterns = [
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s+Jr\.?)?)(?:\s+scores)/g,
            /,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s+Jr\.?)?)(?:\s+score)/g
        ];
        
        scoringPatterns.forEach(pattern => {
            const matches = description.matchAll(pattern);
            for (const match of matches) {
                players.push({
                    name: match[1].trim(),
                    role: 'runner',
                    weight: 2.5 // Higher weight for scoring players
                });
            }
        });
        
        return players;
    }

    // FIXED: Single comprehensive match score calculation
    calculateMatchScore(play, video) {
        // Skip animated videos immediately
        if (video.isAnimated || video.contentType === 'animated') {
            return { score: 0, factors: 'animated-video-penalty', playType: 'unknown', videoTitle: video.title };
        }

        const playDescription = play.result?.description || '';
        const playEvent = play.result?.event || '';
        
        // Detect if this is a productive out
        const isProductive = this.isProductiveOut(playDescription);
        const productiveType = this.getProductiveOutType(playDescription);
        
        let score = 0;
        let factors = [];
        
        // 1. Enhanced ID matching (primary factor)
        const idMatchScore = this.calculateIdMatch(playDescription, video.id);
        const idWeight = isProductive ? 0.65 : 0.7; // Slightly higher weight for productive outs
        score += idMatchScore * idWeight;
        factors.push(`id:${idMatchScore.toFixed(2)}`);
        
        // 2. Player matching
        const playerMatchScore = this.calculatePlayerMatch(playDescription, video.id, video.title);
        const playerWeight = 0.2;
        score += playerMatchScore * playerWeight;
        factors.push(`player:${playerMatchScore.toFixed(2)}`);
        
        // 3. Title matching
        const titleMatchScore = this.calculateTextSimilarity(playDescription, video.title);
        score += titleMatchScore * 0.1;
        factors.push(`title:${titleMatchScore.toFixed(2)}`);
        
        // 4. Enhanced productive out bonuses
        if (isProductive) {
            factors.push(`productive:${productiveType || 'generic'}`);
            
            // Specific bonuses for productive out types
            const videoContent = `${video.id} ${video.title}`.toLowerCase();
            
            if (productiveType === 'rbi_groundout' && videoContent.includes('rbi') && videoContent.includes('ground')) {
                score += 0.15;
                factors.push('rbi-ground-bonus');
            }
            
            if (productiveType === 'sac_fly' && (videoContent.includes('sacrifice') || videoContent.includes('sac'))) {
                score += 0.15;
                factors.push('sac-fly-bonus');
            }
            
            if (productiveType === 'force_out_rbi' && videoContent.includes('force')) {
                score += 0.12;
                factors.push('force-rbi-bonus');
            }
        }
        
        // 5. Play type verification
        const playType = this.getPlayType(play);
        const playTypeScore = this.calculatePlayTypeMatch(playType, video.id + ' ' + video.title);
        score += playTypeScore * 0.05;
        factors.push(`type:${playTypeScore.toFixed(2)}`);

        return {
            score: Math.min(score, 1.0),
            factors: factors.join(', '),
            playType: productiveType || playType,
            videoTitle: video.title,
            idMatch: idMatchScore,
            playerMatch: playerMatchScore,
            isProductiveOut: isProductive
        };
    }

    // Helper methods (keeping your existing implementation)
    calculateTextSimilarity(text1, text2) {
        const normalize = (text) => this.normalizeText(text).split(' ').filter(w => w.length > 2);
        const words1 = normalize(text1);
        const words2 = normalize(text2);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        let matches = 0;
        words1.forEach(word => {
            if (words2.includes(word)) matches++;
        });
        
        return matches / Math.max(words1.length, words2.length);
    }

    calculatePlayerMatch(playDescription, videoId, videoTitle = '') {
        const players = this.extractKeyPlayersFromPlay(playDescription);
        const videoContent = `${videoId.replace(/-/g, ' ')} ${videoTitle}`.toLowerCase();
        
        if (players.length === 0) return 0;
        
        let totalWeight = 0;
        let matchWeight = 0;
        
        players.forEach(player => {
            const nameWords = player.name.toLowerCase().split(' ');
            const lastName = nameWords[nameWords.length - 1];
            const firstName = nameWords[0];
            
            totalWeight += player.weight;
            
            if (videoContent.includes(lastName) && lastName.length > 3) {
                matchWeight += player.weight * 0.8;
            } else if (videoContent.includes(firstName) && firstName.length > 3) {
                matchWeight += player.weight * 0.5;
            }
            
            const fullName = player.name.toLowerCase().replace(/\s+/g, '-');
            if (videoContent.includes(fullName)) {
                matchWeight += player.weight * 0.3;
            }
        });
        
        return totalWeight > 0 ? Math.min(matchWeight / totalWeight, 1.0) : 0;
    }

    getPlayType(play) {
        const event = this.normalizeText(play.result?.event || '');
        
        for (const [type, patterns] of Object.entries(this.playTypePatterns)) {
            if (patterns.some(pattern => event.includes(pattern))) {
                return type;
            }
        }
        
        return event || 'unknown';
    }

    calculatePlayTypeMatch(playType, videoContent) {
        const patterns = this.playTypePatterns[playType] || [playType];
        const normalizedContent = this.normalizeText(videoContent);
        
        let bestMatch = 0;
        patterns.forEach(pattern => {
            if (normalizedContent.includes(pattern)) {
                bestMatch = Math.max(bestMatch, 1.0);
            } else {
                const patternWords = pattern.split(' ');
                if (patternWords.length > 1) {
                    const matchCount = patternWords.filter(word => normalizedContent.includes(word)).length;
                    bestMatch = Math.max(bestMatch, matchCount / patternWords.length * 0.8);
                }
            }
        });
        
        return bestMatch;
    }

    // Keep all your existing methods for video handling, API calls, etc.
    // [Rest of your existing implementation remains the same]
    
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        if (timeSinceLastCall < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
        }
        this.lastApiCall = Date.now();
    }

    async fetchGameContent(gamePk) {
        if (this.gameContentCache.has(gamePk)) {
            return this.gameContentCache.get(gamePk);
        }

        try {
            await this.waitForRateLimit();
            const response = await fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/content`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const gameContent = await response.json();
            this.gameContentCache.set(gamePk, gameContent);
            console.log(`✅ Fetched game content for ${gamePk}`);
            return gameContent;
        } catch (error) {
            console.error(`❌ Failed to fetch game content for ${gamePk}:`, error);
            return null;
        }
    }

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
                        id: highlight.id || highlight.guid || `highlight_${index}`,
                        title: (highlight.title || '').trim(),
                        description: (highlight.description || '').trim(),
                        slug: highlight.slug || '',
                        date: highlight.date,
                        url: bestPlayback.url,
                        duration: highlight.duration || 0,
                        keywords: this.extractKeywords(highlight),
                        playbackType: bestPlayback.name || 'unknown',
                        isAnimated: this.detectAnimatedVideo(highlight),
                        contentType: this.detectContentType(highlight)
                    };
                    
                    videos.push(video);
                }
            });

            console.log(`✅ Extracted ${videos.length} videos`);
            return videos;
        } catch (error) {
            console.error('❌ Error extracting highlight videos:', error);
            return [];
        }
    }

    selectBestPlayback(playbacks) {
        if (!playbacks || playbacks.length === 0) return null;

        const mp4Playbacks = playbacks.filter(p => {
            const name = (p.name || '').toLowerCase();
            const url = (p.url || '').toLowerCase();
            
            return (name.includes('mp4avc') || url.includes('.mp4')) && 
                   !name.includes('m3u8') && !url.includes('.m3u8');
        });

        if (mp4Playbacks.length === 0) {
            console.log('⚠️ No MP4 playbacks found');
            return null;
        }
        
        const preferredQualities = ['2500K', '1800K', '1200K', '800K', '600K', '450K'];
        
        for (const quality of preferredQualities) {
            const qualityPlayback = mp4Playbacks.find(p => 
                p.name && p.name.includes(quality)
            );
            if (qualityPlayback) {
                console.log(`✅ Selected ${quality} MP4 playback`);
                return qualityPlayback;
            }
        }

        console.log('✅ Selected default MP4 playback');
        return mp4Playbacks[0];
    }

    detectAnimatedVideo(highlight) {
        const textToCheck = [
            highlight.title || '',
            highlight.description || '',
            highlight.slug || '',
            ...(highlight.keywordsAll?.map(k => k.value) || []),
            ...(highlight.keywords?.map(k => k.value) || [])
        ].join(' ').toLowerCase();

        const hasAvoidKeywords = this.avoidKeywords.some(keyword => 
            textToCheck.includes(keyword)
        );

        const duration = highlight.duration || 0;
        const suspiciousDuration = duration > 0 && (duration < 10 || duration > 60);

        return hasAvoidKeywords || suspiciousDuration;
    }

    detectContentType(highlight) {
        const textToCheck = [
            highlight.title || '',
            highlight.description || '',
            highlight.slug || ''
        ].join(' ').toLowerCase();

        if (this.avoidKeywords.some(keyword => textToCheck.includes(keyword))) {
            return 'animated';
        }
        
        if (this.preferKeywords.some(keyword => textToCheck.includes(keyword))) {
            return 'play';
        }

        const playPatterns = Object.values(this.playTypePatterns).flat();
        if (playPatterns.some(pattern => textToCheck.includes(pattern))) {
            return 'play';
        }

        return 'unknown';
    }

    extractKeywords(highlight) {
        const keywordSources = [
            highlight.keywordsAll?.map(k => k.value) || [],
            highlight.keywords?.map(k => k.value) || []
        ];
        
        return keywordSources
            .flat()
            .filter(Boolean)
            .map(k => k.toLowerCase())
            .join(' ');
    }

    // Main video finding method with enhanced productive out handling
    async findVideoForPlay(gamePk, play, minScore = 0.4) {
        const playKey = `${gamePk}_${play.about?.atBatIndex || 'unknown'}_${play.about?.playIndex || 'unknown'}`;
        
        if (this.videoCache.has(playKey)) {
            const cachedResult = this.videoCache.get(playKey);
            console.log(`📦 Using cached result for play ${playKey}`);
            return cachedResult;
        }

        try {
            console.log(`🔍 Finding video for play: ${playKey}`);
            console.log(`📝 Play: ${play.result?.description || 'No description'}`);
            
            // Log if it's a productive out
            if (this.isProductiveOut(play.result?.description)) {
                const productiveType = this.getProductiveOutType(play.result?.description);
                console.log(`🎯 Productive out detected: ${productiveType}`);
            }
            
            const gameContent = await this.fetchGameContent(gamePk);
            if (!gameContent) {
                console.log('❌ No game content available');
                this.videoCache.set(playKey, null);
                return null;
            }

            const allVideos = this.extractHighlightVideos(gameContent);
            if (allVideos.length === 0) {
                console.log('❌ No videos available');
                this.videoCache.set(playKey, null);
                return null;
            }

            const playVideos = allVideos.filter(video => 
                !video.isAnimated && 
                video.contentType !== 'animated' &&
                video.url.toLowerCase().includes('.mp4')
            );
            
            console.log(`📊 Filtered to ${playVideos.length} play videos (from ${allVideos.length} total)`);

            if (playVideos.length === 0) {
                console.log('❌ No suitable play videos found after filtering');
                this.videoCache.set(playKey, null);
                return null;
            }

            const availableVideos = playVideos.filter(video => !this.usedVideoIds.has(video.id));
            console.log(`📊 Scoring ${availableVideos.length} available videos`);
            
            if (availableVideos.length === 0) {
                console.log('⚠️ All videos used, allowing reuse');
                availableVideos.push(...playVideos);
            }

            const scoredVideos = availableVideos.map(video => ({
                video,
                ...this.calculateMatchScore(play, video)
            }));

            scoredVideos.sort((a, b) => b.score - a.score);

            console.log('🏆 Top matches:');
            scoredVideos.slice(0, 3).forEach((match, index) => {
                console.log(`  ${index + 1}. "${match.videoTitle}" - Score: ${match.score.toFixed(3)} (${match.factors})`);
                if (match.isProductiveOut) {
                    console.log(`     🎯 Productive out match detected`);
                }
            });

            const bestMatch = scoredVideos[0];
            
            if (bestMatch && bestMatch.score >= minScore) {
                this.usedVideoIds.add(bestMatch.video.id);
                
                const result = {
                    ...bestMatch.video,
                    matchScore: bestMatch.score,
                    matchFactors: bestMatch.factors,
                    playType: bestMatch.playType,
                    idMatch: bestMatch.idMatch,
                    isProductiveOut: bestMatch.isProductiveOut
                };
                
                this.videoCache.set(playKey, result);
                
                console.log(`✅ Found match: "${bestMatch.videoTitle}" (score: ${bestMatch.score.toFixed(3)})`);
                return result;
            } else {
                console.log(`❌ No match above threshold ${minScore} (best: ${bestMatch?.score?.toFixed(3) || 'N/A'})`);
                this.videoCache.set(playKey, null);
                return null;
            }

        } catch (error) {
            console.error('💥 Error in findVideoForPlay:', error);
            this.videoCache.set(playKey, null);
            return null;
        }
    }

    // Keep all your UI methods unchanged
    addVideoButtonToPlay(playDiv, gamePk, play) {
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
            opacity: 70%;
            pointer-events: auto;
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        
        videoButton.innerHTML = `
            <img src="/assets/icons/video-camera.png" alt="📹" style="width: 16px; height: 16px; filter: contrast(1.2);" />
            <span style="font-size: 11px;">VIDEO</span>
        `;

        videoButton.onmouseover = () => {
            if (videoButton.style.opacity !== '0') {
                videoButton.style.transform = 'scale(1.08) translateY(-1px)';
                videoButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                videoButton.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(217,230,243,0.98))';
            }
        };
        
        videoButton.onmouseleave = () => {
            if (videoButton.style.opacity !== '0') {
                videoButton.style.transform = 'scale(1) translateY(0)';
                videoButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
            }
        };

        videoButton.onclick = async (e) => {
            e.stopPropagation();
            
            if (videoButton.style.opacity === '0' || videoButton.style.pointerEvents === 'none') {
                return;
            }

            videoButton.disabled = true;
            const originalContent = videoButton.innerHTML;
            videoButton.innerHTML = `
                <div style="width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.3); border-top: 2px solid rgba(0,0,0,0.8); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <span style="font-size: 11px;">SEARCHING</span>
            `;
            videoButton.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,248,255,0.9))';

            try {
                const video = await this.findVideoForPlay(gamePk, play);
                
                if (video) {
                    const matchInfo = video.idMatch > 0.8 ? 'PERFECT' : 
                                     video.idMatch > 0.6 ? 'STRONG' : 
                                     video.matchScore > 0.7 ? 'GOOD' : 'FAIR';
                    
                    videoButton.innerHTML = `
                        <span style="color: green;">✓</span>
                        <span style="font-size: 11px;">${matchInfo} MATCH</span>
                    `;
                    videoButton.style.background = 'linear-gradient(135deg, rgba(220,252,231,0.9), rgba(187,247,208,0.9))';
                    
                    setTimeout(() => {
                        this.createVideoPlayer(video, playDiv, videoButton);
                    }, 300);
                } else {
                    videoButton.innerHTML = `
                        <span style="color: #dc3545;">✕</span>
                        <span style="font-size: 11px;">NO MATCH</span>
                    `;
                    videoButton.style.background = 'linear-gradient(135deg, rgba(254,226,226,0.9), rgba(252,165,165,0.9))';
                    
                    setTimeout(() => {
                        videoButton.innerHTML = originalContent;
                        videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
                        videoButton.disabled = false;
                    }, 2500);
                }
            } catch (error) {
                console.error('💥 Error loading video:', error);
                
                videoButton.innerHTML = `
                    <span style="color: #dc3545;">⚠</span>
                    <span style="font-size: 11px;">ERROR</span>
                `;
                videoButton.style.background = 'linear-gradient(135deg, rgba(254,226,226,0.9), rgba(252,165,165,0.9))';
                
                setTimeout(() => {
                    videoButton.innerHTML = originalContent;
                    videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
                    videoButton.disabled = false;
                }, 2500);
            }
        };

        playDiv.appendChild(videoButton);
    }

    // Content wrapper management
    hideContentWrapper() {
        const contentWrapper = document.querySelector('.content-wrapper');
        if (!contentWrapper) return;

        if (this.activeVideoPlayers.size === 0) {
            this.contentWrapperState = {
                element: contentWrapper,
                originalDisplay: contentWrapper.style.display || 'block',
                originalVisibility: contentWrapper.style.visibility || 'visible',
                originalOpacity: contentWrapper.style.opacity || '1',
                originalTransition: contentWrapper.style.transition || ''
            };

            contentWrapper.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            requestAnimationFrame(() => {
                contentWrapper.style.opacity = '0';
                contentWrapper.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    if (contentWrapper.style.opacity === '0') {
                        contentWrapper.style.display = 'none';
                    }
                }, 400);
            });
        }
    }

    showContentWrapper() {
        if (!this.contentWrapperState) return;

        const { element, originalDisplay, originalVisibility, originalOpacity, originalTransition } = this.contentWrapperState;
        
        if (this.activeVideoPlayers.size === 0) {
            element.style.display = originalDisplay;
            element.style.opacity = '0';
            element.style.transform = 'translateY(-10px)';
            
            requestAnimationFrame(() => {
                element.style.opacity = originalOpacity;
                element.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                    element.style.transition = originalTransition;
                    element.style.visibility = originalVisibility;
                }, 400);
            });

            this.contentWrapperState = null;
        }
    }

    // Video player creation and management
    createVideoPlayer(video, playDiv, videoButton) {
        const existingPlayer = playDiv.querySelector('.mlb-video-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }

        this.hideContentWrapper();

        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.activeVideoPlayers.add(playerId);

        videoButton.style.opacity = '0';
        videoButton.style.pointerEvents = 'none';

        const playerContainer = document.createElement('div');
        playerContainer.className = 'mlb-video-player';
        playerContainer.dataset.playerId = playerId;
        playerContainer.style.cssText = `
            position: fixed;
            top: 55%;
            left: 55%;
            transform: translate(-50%, -50%) scale(0.8);
            width: 90vw;
            max-width: 900px;
            height: 0;
            border-radius: 12px;
            overflow: visible;
            background: linear-gradient(152deg,rgba(4, 30, 65, 1) 44%, rgba(255, 255, 255, 1) 50%, rgba(191, 13, 61, 1) 55%);
            opacity: 50%;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 25px 50px rgba(0,0,0,0.4);
            z-index: 1000;
        `;

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            backdrop-filter: blur(3px);
            z-index: 999;
            opacity: 0.5 !important;
            transition: opacity 0.4s ease;
        `;
        backdrop.onclick = () => this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);

        const videoElement = document.createElement('video');
        videoElement.style.cssText = `
            width: 100%;
            height: 500px;
            display: block;
            background: linear-gradient(152deg, rgb(4, 30, 65) 44%, rgb(255, 255, 255) 60%, rgb(191, 13, 61) 55%);
            border-radius: 12px;
            position: relative;
            z-index: 1;
        `;
        videoElement.controls = true;
        videoElement.preload = 'metadata';
        videoElement.src = video.url;
        videoElement.crossOrigin = 'anonymous';
        videoElement.style.pointerEvents = 'auto';
        videoElement.tabIndex = 0;

        videoElement.onloadedmetadata = () => {
            console.log('📺 Video metadata loaded successfully');
            backdrop.style.opacity = '1';
            
            setTimeout(() => {
                playerContainer.style.height = '500px';
                playerContainer.style.opacity = '1';
                playerContainer.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
        };

        videoElement.onended = () => {
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
            
            setTimeout(() => {
                this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);
            }, 4000);
        };

        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            position: absolute;
            top: -45px;
            right: 10px;
            background: rgba(220, 53, 69, 0.9);
            color: white;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
        `;
        closeButton.innerHTML = '✕';
        closeButton.title = 'Close video (ESC)';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            videoElement.pause();
            this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);
        };

        const titleHeader = document.createElement('div');
        titleHeader.style.cssText = `
            position: absolute;
            top: -50px;
            left: 0;
            right: 0;
            color: white;
            padding: 15px 20px;
            text-align: center;
            background: #041e41;
            border-radius: 8px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.2);
        `;
        
        const confidence = video.matchScore ? ` (${Math.round(video.matchScore * 100)}% match)` : '';
        const idInfo = video.idMatch > 0 ? ` • ID: ${Math.round(video.idMatch * 100)}%` : '';
        const productiveInfo = video.isProductiveOut ? ' • 🎯 Productive Out' : '';
        const duration = video.duration ? ` • ${Math.round(video.duration)}s` : '';
        
        titleHeader.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${video.title}</div>
            <div style="font-size: 12px; opacity: 0.8;">${confidence}${idInfo}${productiveInfo}${duration}</div>
        `;

        const videoWrapper = document.createElement('div');
        videoWrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';
        videoWrapper.appendChild(videoElement);
        
        playerContainer.appendChild(titleHeader);
        playerContainer.appendChild(closeButton);
        playerContainer.appendChild(videoWrapper);
        
        document.body.appendChild(backdrop);
        document.body.appendChild(playerContainer);

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
                }
            }
        };
        document.addEventListener('keydown', handleKeydown);

        playerContainer.cleanup = () => {
            document.removeEventListener('keydown', handleKeydown);
        };

        return videoElement;
    }

    closeVideoPlayer(playerContainer, playDiv, videoButton, playerId) {
        this.activeVideoPlayers.delete(playerId);

        const backdrop = document.querySelector('div[style*="backdrop-filter: blur(3px)"]');
        
        if (playerContainer.cleanup) {
            playerContainer.cleanup();
        }
        
        playerContainer.style.height = '0';
        playerContainer.style.opacity = '0';
        playerContainer.style.transform = 'translate(-50%, -50%) scale(0.8)';
        
        if (backdrop) {
            backdrop.style.opacity = '0';
        }
        
        setTimeout(() => {
            this.showContentWrapper();
        }, 200);
        
        setTimeout(() => {
            this.resetVideoButton(videoButton);
        }, 300);
        
        setTimeout(() => {
            if (playerContainer?.parentNode) {
                playerContainer.remove();
            }
            if (backdrop?.parentNode) {
                backdrop.remove();
            }
        }, 500);
    }

    resetVideoButton(videoButton) {
        if (!videoButton) return;

        videoButton.style.transition = 'all 0.3s ease';
        videoButton.style.opacity = '0.6';
        videoButton.style.pointerEvents = 'auto';
        videoButton.disabled = false;
        
        videoButton.innerHTML = `
            <img src="/assets/icons/video-camera.png" alt="📹" style="width: 16px; height: 16px; filter: contrast(1.2);" />
            <span style="font-size: 11px;">VIDEO</span>
        `;
        videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
        
        console.log('🔄 Video button reset to original state');
    }

    // Utility methods
    resetForNewGame(gamePk) {
        this.usedVideoIds.clear();
        
        for (const [key, value] of this.videoCache.entries()) {
            if (key.startsWith(`${gamePk}_`)) {
                this.videoCache.delete(key);
            }
        }
        
        this.gameContentCache.delete(gamePk);
        console.log(`🔄 Reset video matcher for game ${gamePk}`);
    }

    clearCache(maxAge = 3600000) {
        const now = Date.now();
        const cutoff = now - maxAge;
        
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

    cleanup() {
        const players = document.querySelectorAll('.mlb-video-player');
        players.forEach(player => {
            const playerId = player.dataset.playerId;
            if (playerId) {
                const videoButton = document.querySelector('.video-button');
                this.closeVideoPlayer(player, null, videoButton, playerId);
            }
        });
        
        this.clearCache();
        this.activeVideoPlayers.clear();
        this.contentWrapperState = null;
        this.usedVideoIds.clear();
        
        console.log('🧹 MLBVideoMatcher cleanup completed');
    }

    // ENHANCED: Debug method for productive outs
    async debugProductiveOutMatching(gamePk, play) {
        console.log('🎯 PRODUCTIVE OUT DEBUG ANALYSIS');
        console.log('Play Description:', play.result?.description);
        
        const isProductive = this.isProductiveOut(play.result?.description);
        const productiveType = this.getProductiveOutType(play.result?.description);
        
        console.log('Is Productive Out:', isProductive);
        console.log('Productive Type:', productiveType);
        
        if (isProductive) {
            const normalized = this.normalizeText(play.result?.description);
            console.log('Normalized Description:', normalized);
            
            // Test the matching against sample video IDs
            const sampleVideoIds = [
                'john-smith-rbi-groundout',
                'jane-doe-sacrifice-fly', 
                'mike-jones-grounds-into-force-out',
                'sara-wilson-fielders-choice-rbi'
            ];
            
            console.log('Testing against sample video IDs:');
            sampleVideoIds.forEach(videoId => {
                const score = this.calculateIdMatch(play.result?.description, videoId);
                console.log(`  ${videoId}: ${score.toFixed(3)}`);
            });
        }
        
        // Run normal debug analysis
        await this.debugVideoMatching(gamePk, play);
    }
}

// Export with enhanced logging
try {
    window.MLBVideoMatcher = MLBVideoMatcher;
    console.log('✅ Enhanced MLBVideoMatcher loaded successfully');
    console.log('🎯 Enhanced productive outs matching (sacrifice flies, RBI groundouts, force outs)');
    console.log('🔧 Fixed duplicate methods and improved matching logic');
    console.log('📊 Better scoring for complex defensive plays with RBIs');
} catch (error) {
    console.error('💥 Failed to load Enhanced MLBVideoMatcher:', error);
}
