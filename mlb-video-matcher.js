// Enhanced MLB Video Matcher - Direct GUID to PlayId Matching
// Matches videos using game content and play-by-play endpoints

class MLBVideoMatcher {
    constructor() {
        this.videoCache = new Map();
        this.gameContentCache = new Map();
        this.playByPlayCache = new Map();
        this.usedVideoIds = new Set();
        this.rateLimitDelay = 1000;
        this.lastApiCall = 0;
        this.activeVideoPlayers = new Set();
        this.contentWrapperState = null;
        
        // Keep existing play type patterns for fallback or UI purposes
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

        // Keep productive out patterns for fallback or UI
        this.productiveOutPatterns = {
            'rbi_groundout': ['rbi groundout', 'rbi ground out', 'grounds out', 'groundout rbi'],
            'rbi_flyout': ['rbi flyout', 'rbi fly out', 'flies out', 'flyout rbi'],
            'sac_fly': ['sacrifice fly', 'sac fly', 'sf'],
            'sac_bunt': ['sacrifice bunt', 'sac bunt'],
            'force_out_rbi': ['force out', 'grounds into force', 'rbi force'],
            'fielders_choice_rbi': ['fielders choice', 'fielder choice', 'fc']
        };

        // Keep avoid/prefer keywords for filtering non-highlight content
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

    // Keep existing normalization for UI or fallback purposes
    normalizeText(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/\(\d+\)/g, '')
            .replace(/grounds into a force out/g, 'force out')
            .replace(/grounds into force out/g, 'force out')
            .replace(/reaches on a fielder's choice/g, 'fielders choice')
            .replace(/fielder's choice/g, 'fielders choice')
            .replace(/reaches on error/g, 'error')
            .replace(/sacrifice fly/g, 'sac fly')
            .replace(/sacrifice bunt/g, 'sac bunt')
            .replace(/,\s*([^,]+)\s+scores?/g, ' rbi')
            .replace(/\bscores?\b/g, 'rbi')
            .replace(/\bto\s+(1st|2nd|3rd|first|second|third)(\s+base)?\b/g, '')
            .replace(/\bout at\s+(1st|2nd|3rd|first|second|third)\b/g, '')
            .replace(/\b(first|second|third)\s+baseman\b/g, '')
            .replace(/\b(left|center|right)\s+fielder?\b/g, '')
            .replace(/\b(shortstop|catcher|pitcher)\b/g, '')
            .replace(/\b(on|a|an|the|to|for|in|at|by|with|into)\b/g, ' ')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // NEW: Fetch play-by-play data (already present, but good to confirm its purpose)
    async fetchPlayByPlay(gamePk) {
        if (this.playByPlayCache.has(gamePk)) {
            return this.playByPlayCache.get(gamePk);
        }

        try {
            await this.waitForRateLimit();
            const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const playByPlay = await response.json();
            this.playByPlayCache.set(gamePk, playByPlay);
            console.log(`✅ Fetched play-by-play for ${gamePk}`);
            return playByPlay;
        } catch (error) {
            console.error(`❌ Failed to fetch play-by-play for ${gamePk}:`, error);
            return null;
        }
    }

    // Existing fetchGameContent (unchanged)
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

    // Existing extractHighlightVideos (modified to ensure guid is explicitly stored)
    extractHighlightVideos(gameContent) {
        const videos = [];
        
        try {
            const highlights = gameContent?.highlights?.highlights?.items || [];
            console.log(`Processing ${highlights.length} potential highlights`);
            
            highlights.forEach((highlight, index) => {
                // Ensure highlight.guid exists and is not null/undefined before considering
                if (!highlight.guid) {
                    // console.warn(`Skipping highlight without GUID: ${highlight.title}`);
                    return; 
                }

                const playbacks = highlight?.playbacks || [];
                const bestPlayback = this.selectBestPlayback(playbacks);
                
                if (bestPlayback && highlight.date) {
                    const video = {
                        id: highlight.id || highlight.guid || `highlight_${index}`, // Prefer highlight.guid as ID if available
                        guid: highlight.guid, // Store guid explicitly
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

            console.log(`✅ Extracted ${videos.length} videos (after filtering for GUID)`);
            return videos;
        } catch (error) {
            console.error('❌ Error extracting highlight videos:', error);
            return [];
        }
    }

    // Existing selectBestPlayback (unchanged)
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

    // Existing detectAnimatedVideo (unchanged)
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

    // Existing detectContentType (unchanged)
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

    // Existing extractKeywords (unchanged)
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

    // Main video finding method using guid to playId matching
    async findVideoForPlay(gamePk, play, minScore = 0.4) { // minScore is now less relevant for direct match
        // Create a unique key for caching based on game and play identifiers
        const playKey = `${gamePk}_${play.about?.atBatIndex || 'unknown'}_${play.about?.playIndex || 'unknown'}`;
        
        // Return cached result if available
        if (this.videoCache.has(playKey)) {
            const cachedResult = this.videoCache.get(playKey);
            console.log(`📦 Using cached result for play ${playKey}`);
            return cachedResult;
        }

        try {
            console.log(`🔍 Finding video for play: ${playKey}`);
            console.log(`📝 Play Description: "${play.result?.description || 'No description'}"`);
            
            // --- Step 1: Extract targetPlayId directly from the provided play object ---
            let targetPlayId = null;
            if (play.playEvents && play.playEvents.length > 0) {
                // As requested, get the playId from the last playEvent of this specific scoring play
                const lastPlayEvent = play.playEvents[play.playEvents.length - 1];
                if (lastPlayEvent.playId) {
                    targetPlayId = lastPlayEvent.playId;
                }
            }

            if (!targetPlayId) {
                console.log('❌ No playId found for this specific scoring play. Cannot match.');
                this.videoCache.set(playKey, null);
                return null;
            }
            console.log(`🎯 Target playId for this scoring play: ${targetPlayId}`);

            // --- Step 2: Fetch and process game content to find videos with matching GUIDs ---
            const gameContent = await this.fetchGameContent(gamePk);
            if (!gameContent) {
                console.log('❌ No game content available for highlight videos.');
                this.videoCache.set(playKey, null);
                return null;
            }

            const allVideos = this.extractHighlightVideos(gameContent);
            if (allVideos.length === 0) {
                console.log('❌ No highlight videos available after extraction and GUID filtering.');
                this.videoCache.set(playKey, null);
                return null;
            }

            // Filter to playable videos (non-animated, MP4) and those not yet used if possible
            const playVideos = allVideos.filter(video => 
                !video.isAnimated && 
                video.contentType !== 'animated' &&
                video.url.toLowerCase().includes('.mp4')
            );
            
            console.log(`📊 Filtered to ${playVideos.length} suitable play videos (from ${allVideos.length} total)`);

            if (playVideos.length === 0) {
                console.log('❌ No suitable play videos found after filtering.');
                this.videoCache.set(playKey, null);
                return null;
            }

            // --- Step 3: Find the video that exactly matches the targetPlayId (guid) ---
            let bestMatch = null;
            let matchScore = 0; // Will be 1.0 for a perfect GUID match

            // Prioritize unused videos first, then allow reuse if no new match is found
            let availableVideos = playVideos.filter(video => !this.usedVideoIds.has(video.id));
            if (availableVideos.length === 0) {
                console.log('⚠️ All unique videos used for this game, attempting to reuse.');
                availableVideos = [...playVideos]; // Allow reuse
            }
            console.log(`📊 Searching among ${availableVideos.length} available videos for a GUID match.`);

            for (const video of availableVideos) {
                if (video.guid === targetPlayId) {
                    bestMatch = video;
                    matchScore = 1.0; // Perfect match by GUID
                    console.log(`✅ Perfect GUID match found: "${video.title}" (GUID: ${video.guid})`);
                    break; 
                }
            }

            if (!bestMatch) {
                console.log(`❌ No highlight video found with matching GUID: ${targetPlayId}.`);
                this.videoCache.set(playKey, null);
                return null;
            }

            // Mark the video as used to avoid immediate duplicates, if unique ID is preferred
            this.usedVideoIds.add(bestMatch.id); 
            
            const result = {
                ...bestMatch,
                matchScore: matchScore,
                matchFactors: `guid-match:${targetPlayId}`,
                playType: this.getBasicPlayType(play.result?.description),
                idMatch: matchScore,
                isProductiveOut: this.isProductiveOut(play.result?.description)
            };
            
            this.videoCache.set(playKey, result);
            
            console.log(`✅ Successfully linked video: "${bestMatch.title}" to play ID: ${targetPlayId}`);
            return result;

        } catch (error) {
            console.error('💥 Error in findVideoForPlay:', error);
            this.videoCache.set(playKey, null);
            return null;
        }
    }

    // Keep existing helper methods for play type detection
    getBasicPlayType(description) {
        const normalized = this.normalizeText(description);
        
        if (normalized.includes('single')) return 'single';
        if (normalized.includes('double')) return 'double';  
        if (normalized.includes('triple')) return 'triple';
        if (normalized.includes('homer') || normalized.includes('home run')) return 'home_run';
        if (normalized.includes('walk')) return 'walk';
        if (normalized.includes('sacrifice fly') || normalized.includes('sac fly')) return 'sac_fly';
        if (normalized.includes('groundout') || normalized.includes('ground out')) return 'groundout';
        if (normalized.includes('flyout') || normalized.includes('fly out')) return 'flyout';
        
        return 'unknown';
    }

    isProductiveOut(playDescription) {
        const normalized = this.normalizeText(playDescription);
        
        const hasOut = /\b(out|groundout|flyout|grounds out|flies out)\b/.test(normalized);
        const hasRBI = /\b(rbi|scores?|run|home)\b/.test(normalized) || playDescription.includes('scores');
        const isSacrifice = /\b(sacrifice|sac)\b/.test(normalized);
        
        return (hasOut && hasRBI) || isSacrifice;
    }

    getProductiveOutType(playDescription) {
        const normalized = this.normalizeText(playDescription);
        
        for (const [type, patterns] of Object.entries(this.productiveOutPatterns)) {
            if (patterns.some(pattern => normalized.includes(pattern))) {
                return type;
            }
        }
        
        if (normalized.includes('ground') && normalized.includes('rbi')) return 'rbi_groundout';
        if (normalized.includes('fly') && normalized.includes('rbi')) return 'rbi_flyout';
        if (normalized.includes('sacrifice fly')) return 'sac_fly';
        if (normalized.includes('sacrifice bunt')) return 'sac_bunt';
        
        return null;
    }

    // Existing rate limit helper
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        if (timeSinceLastCall < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
        }
        this.lastApiCall = Date.now();
    }

    // Existing UI methods (unchanged)
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
        
        // Use placeholder image for the video button icon
        videoButton.innerHTML = `
            <img src="assets/icons/video-camera.png" alt="video" style="width: 16px; height: 16px; filter: contrast(1.2);" />
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
                    const matchInfo = video.matchScore >= 1.0 ? 'PERFECT' : 'MATCH';
                    
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

    // Existing content wrapper management (unchanged)
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

    // Video player creation and control logic
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
        
        const confidence = video.matchScore
        const productiveInfo = video.isProductiveOut
        const duration = video.duration ? ` • ${Math.round(video.duration)}s` : '';
        
        titleHeader.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${video.title}</div>
            <div style="font-size: 12px; opacity: 0.8;">${confidence}${productiveInfo}${duration}</div>
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

    // Video player close logic
    closeVideoPlayer(playerContainer, playDiv, videoButton, playerId) {
        this.activeVideoPlayers.delete(playerId);

        // Select backdrop based on its unique styling to avoid conflicts
        const backdrop = document.querySelector('div[style*="backdrop-filter: blur(3px)"]');
        
        if (playerContainer.cleanup) {
            playerContainer.cleanup(); // Clean up keyboard event listener
        }
        
        playerContainer.style.height = '0';
        playerContainer.style.opacity = '0';
        playerContainer.style.transform = 'translate(-50%, -50%) scale(0.8)';
        
        if (backdrop) {
            backdrop.style.opacity = '0';
        }
        
        // Use more staggered timeouts for smoother transition and cleanup
        setTimeout(() => {
            this.showContentWrapper(); // Show main content wrapper slightly before button resets
        }, 200); 
        
        setTimeout(() => {
            this.resetVideoButton(videoButton); // Reset button appearance
        }, 300); 
        
        setTimeout(() => {
            if (playerContainer?.parentNode) {
                playerContainer.remove(); // Remove player container from DOM
            }
            if (backdrop?.parentNode) {
                backdrop.remove(); // Remove backdrop from DOM
            }
        }, 500); // Allow time for transitions before full removal
    }

    // Reset button state
    resetVideoButton(videoButton) {
        if (!videoButton) return;

        videoButton.style.transition = 'all 0.3s ease';
        videoButton.style.opacity = '0.7'; // Slightly less opaque than before for consistency
        videoButton.style.pointerEvents = 'auto';
        videoButton.disabled = false;
        
        videoButton.innerHTML = `
            <img src="https://placehold.co/16x16/000000/FFFFFF?text=📹" alt="📹" style="width: 16px; height: 16px; filter: contrast(1.2);" />
            <span style="font-size: 11px;">VIDEO</span>
        `;
        videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
        
        console.log('🔄 Video button reset to original state');
    }

    // Reset cache for a new game
    resetForNewGame(gamePk) {
        this.usedVideoIds.clear();
        
        for (const [key, value] of this.videoCache.entries()) {
            if (key.startsWith(`${gamePk}_`)) {
                this.videoCache.delete(key);
            }
        }
        
        this.gameContentCache.delete(gamePk);
        this.playByPlayCache.delete(gamePk); // Clear play-by-play cache for the game
        console.log(`🔄 Reset video matcher for game ${gamePk}`);
    }

    // Clear old cache entries
    clearCache(maxAge = 3600000) { // Default maxAge is 1 hour
        const now = Date.now();
        const cutoff = now - maxAge;
        
        for (const [key, value] of this.videoCache.entries()) {
            // Assuming cached objects might have a 'cached' timestamp property
            if (value && value.cached && value.cached < cutoff) {
                this.videoCache.delete(key);
            }
        }
        
        for (const [key, value] of this.gameContentCache.entries()) {
            if (value && value.cached && value.cached < cutoff) {
                this.gameContentCache.delete(key);
            }
        }
        
        for (const [key, value] of this.playByPlayCache.entries()) {
            if (value && value.cached && value.cached < cutoff) {
                this.playByPlayCache.delete(key);
            }
        }
        
        // Implement size-based eviction as a fallback or secondary measure
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
        
        if (this.playByPlayCache.size > 20) {
            const entries = Array.from(this.playByPlayCache.entries());
            const toDelete = entries.slice(0, entries.length - 20);
            toDelete.forEach(([key]) => this.playByPlayCache.delete(key));
        }
        
        console.log(`🧹 Cache cleanup: ${this.videoCache.size} video entries, ${this.gameContentCache.size} game entries, ${this.playByPlayCache.size} play-by-play entries`);
    }

    // Cleanup active video players and clear caches
    cleanup() {
        const players = document.querySelectorAll('.mlb-video-player');
        players.forEach(player => {
            const playerId = player.dataset.playerId;
            if (playerId) {
                // Pass null for playDiv and videoButton if they are not strictly needed for closing logic
                // Or try to retrieve them if available in the DOM context, for example, if the button is always next to the player
                const videoButton = document.querySelector('.video-button'); // This will only get the first one, might need more specific selector if multiple
                this.closeVideoPlayer(player, null, videoButton, playerId);
            }
        });
        
        this.clearCache();
        this.activeVideoPlayers.clear();
        this.contentWrapperState = null;
        this.usedVideoIds.clear();
        
        console.log('🧹 MLBVideoMatcher cleanup completed');
    }

    // NEW: Debug method for guid/playId matching
    async debugVideoMatching(gamePk, play) {
        console.log('🎯 VIDEO MATCHING DEBUG ANALYSIS');
        console.log('Play Description:', play.result?.description);
        
        const playByPlay = await this.fetchPlayByPlay(gamePk);
        const gameContent = await this.fetchGameContent(gamePk);
        
        if (!playByPlay || !gameContent) {
            console.log('❌ Missing play-by-play or game content');
            return;
        }

        // Find playId
        let targetPlayId = null;
        const allPlays = playByPlay?.liveData?.plays?.allPlays || [];
        for (const p of allPlays) {
            if (p.about.atBatIndex === play.about.atBatIndex) {
                for (const event of p.playEvents) {
                    if (event.playId) {
                        targetPlayId = event.playId;
                        break;
                    }
                }
                if (targetPlayId) break;
            }
        }

        console.log(`🎯 Target playId: ${targetPlayId || 'Not found'}`);

        // List available videos
        const videos = this.extractHighlightVideos(gameContent);
        console.log(`Available Videos (${videos.length}):`);
        
        videos.forEach(video => {
            console.log(`  ${video.id}:`, {
                title: video.title,
                guid: video.guid,
                isScoring: this.isPlayWithRuns(play.result?.description), // Assuming isPlayWithRuns exists or is a placeholder
                url: video.url
            });
        });
    }

    // Helper function used in debugVideoMatching - assuming it checks if a play involves scoring
    isPlayWithRuns(description) {
        if (!description) return false;
        const normalized = this.normalizeText(description);
        return normalized.includes('rbi') || normalized.includes('scores');
    }
}

// Export with enhanced logging
try {
    window.MLBVideoMatcher = MLBVideoMatcher;
    console.log('✅ MLBVideoMatcher loaded successfully');
    console.log('🎯 Using direct guid to playId matching');
    console.log('🔧 Preserved UI and caching functionality');
} catch (error) {
    console.error('💥 Failed to load MLBVideoMatcher:', error);
}
