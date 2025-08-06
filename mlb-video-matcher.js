// mlb-video-matcher.js
// Enhanced MLB Video Matcher and Player for Chrome Extension
// Handles finding and playing videos for ALL types of scoring plays

class MLBVideoMatcher {
    constructor() {
        this.videoCache = new Map();
        this.gameContentCache = new Map();
        this.usedVideoIds = new Set(); // Track used videos to prevent duplicates
        this.rateLimitDelay = 1000;
        this.lastApiCall = 0;
        this.activeVideoPlayers = new Set(); // Track active video players
        this.contentWrapperState = null; // Store original content wrapper state
        
        // Simplified and more accurate play type patterns
        this.playTypePatterns = {
            'home_run': ['homer', 'home run', 'hr', 'grand slam', 'solo shot', 'two-run homer', 'three-run homer', 'solo homer', 'grand-slam'],
            'triple': ['triple', '3b', 'three-base hit'],
            'double': ['double', '2b', 'two-base hit', 'rbi double'],
            'single': ['single', '1b', 'rbi single', 'infield single', 'bloop single'],
            'sac_fly': ['sacrifice fly', 'sac fly', 'sf'],
            'sac_bunt': ['sacrifice bunt', 'sac bunt', 'squeeze'],
            'groundout': ['groundout', 'ground out', 'rbi groundout'],
            'flyout': ['flyout', 'fly out', 'popup', 'pop out'],
            'double_play': ['double play', 'dp', 'gidp', 'twin killing'],
            'fielders_choice': ['fielder choice', 'fc', "fielder's choice"],
            'error': ['error', 'throwing error', 'fielding error'],
            'wild_pitch': ['wild pitch', 'wp'],
            'passed_ball': ['passed ball', 'pb'],
            'walk': ['walk', 'bb', 'base on balls', 'intentional walk', 'ibb'],
            'hit_by_pitch': ['hit by pitch', 'hbp']
        };
    }

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
                        id: highlight.guid || highlight.id || `highlight_${index}`,
                        title: (highlight.title || '').trim(),
                        description: (highlight.description || '').trim(),
                        slug: highlight.slug || '',
                        date: highlight.date,
                        url: bestPlayback.url,
                        duration: highlight.duration || 0,
                        keywords: this.extractKeywords(highlight),
                        playbackType: bestPlayback.name || 'unknown'
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

    selectBestPlayback(playbacks) {
        if (!playbacks || playbacks.length === 0) return null;

        // Prioritize MP4 files
        const mp4Playbacks = playbacks.filter(p => {
            const name = (p.name || '').toLowerCase();
            const url = (p.url || '').toLowerCase();
            return name.includes('mp4') || url.includes('.mp4');
        });

        const targetPlaybacks = mp4Playbacks.length > 0 ? mp4Playbacks : playbacks;
        
        // Select highest quality
        const preferredQualities = ['2500K', '1800K', '1200K', '800K', '600K'];
        
        for (const quality of preferredQualities) {
            const qualityPlayback = targetPlaybacks.find(p => 
                p.name && p.name.includes(quality)
            );
            if (qualityPlayback) {
                return qualityPlayback;
            }
        }

        return targetPlaybacks[0];
    }

    // Simplified text normalization focused on key matching
    normalizeText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Extract player names from play data
    extractPlayerNames(play) {
        const names = [];
        
        if (play.matchup?.batter?.fullName) {
            names.push(play.matchup.batter.fullName);
        }
        if (play.matchup?.pitcher?.fullName) {
            names.push(play.matchup.pitcher.fullName);
        }
        
        return names.map(name => this.normalizeText(name));
    }

    // Determine play type from the play event
    getPlayType(play) {
        const event = this.normalizeText(play.result?.event || '');
        
        // Find matching pattern
        for (const [type, patterns] of Object.entries(this.playTypePatterns)) {
            if (patterns.some(pattern => event.includes(pattern))) {
                return type;
            }
        }
        
        return event || 'unknown';
    }

    // Calculate match score based on multiple factors
    calculateMatchScore(play, video) {
        const playDescription = this.normalizeText(play.result?.description || '');
        const playEvent = this.normalizeText(play.result?.event || '');
        const videoTitle = this.normalizeText(video.title);
        const videoDescription = this.normalizeText(video.description);
        const videoKeywords = this.normalizeText(video.keywords);
        
        const videoContent = `${videoTitle} ${videoDescription} ${videoKeywords}`;
        const playContent = `${playDescription} ${playEvent}`;
        
        let score = 0;
        let factors = [];
        
        // 1. Direct description similarity (40% weight)
        const descSimilarity = this.calculateTextSimilarity(playDescription, videoContent);
        score += descSimilarity * 0.4;
        factors.push(`desc:${descSimilarity.toFixed(2)}`);
        
        // 2. Play type matching (30% weight)
        const playType = this.getPlayType(play);
        const playTypeScore = this.calculatePlayTypeMatch(playType, videoContent);
        score += playTypeScore * 0.3;
        factors.push(`type:${playTypeScore.toFixed(2)}`);
        
        // 3. Player name matching (20% weight)
        const playerNames = this.extractPlayerNames(play);
        const playerScore = this.calculatePlayerNameMatch(playerNames, videoContent);
        score += playerScore * 0.2;
        factors.push(`player:${playerScore.toFixed(2)}`);
        
        // 4. Title similarity bonus (10% weight)
        const titleSimilarity = this.calculateTextSimilarity(playContent, videoTitle);
        score += titleSimilarity * 0.1;
        factors.push(`title:${titleSimilarity.toFixed(2)}`);
        
        return {
            score: Math.min(score, 1.0),
            factors: factors.join(', '),
            playType,
            videoTitle: video.title
        };
    }

    // Calculate text similarity using word matching
    calculateTextSimilarity(text1, text2) {
        const words1 = text1.split(' ').filter(w => w.length > 2);
        const words2 = text2.split(' ').filter(w => w.length > 2);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        let matches = 0;
        words1.forEach(word => {
            if (words2.includes(word)) {
                matches++;
            }
        });
        
        return matches / Math.max(words1.length, words2.length);
    }

    // Calculate play type matching score
    calculatePlayTypeMatch(playType, videoContent) {
        const patterns = this.playTypePatterns[playType] || [playType];
        
        let bestMatch = 0;
        patterns.forEach(pattern => {
            if (videoContent.includes(pattern)) {
                bestMatch = Math.max(bestMatch, 1.0);
            } else {
                // Partial matching for compound terms
                const patternWords = pattern.split(' ');
                if (patternWords.length > 1) {
                    const matchCount = patternWords.filter(word => videoContent.includes(word)).length;
                    bestMatch = Math.max(bestMatch, matchCount / patternWords.length * 0.8);
                }
            }
        });
        
        return bestMatch;
    }

    // Calculate player name matching score
    calculatePlayerNameMatch(playerNames, videoContent) {
        if (playerNames.length === 0) return 0;
        
        let bestMatch = 0;
        playerNames.forEach(name => {
            const nameWords = name.split(' ');
            let nameMatches = 0;
            
            nameWords.forEach(word => {
                if (word.length > 2 && videoContent.includes(word)) {
                    nameMatches++;
                }
            });
            
            const nameScore = nameWords.length > 0 ? nameMatches / nameWords.length : 0;
            bestMatch = Math.max(bestMatch, nameScore);
        });
        
        return bestMatch;
    }

    // Main function to find video for a play
    async findVideoForPlay(gamePk, play, minScore = 0.4) {
        const playKey = `${gamePk}_${play.about?.atBatIndex || 'unknown'}_${play.about?.playIndex || 'unknown'}`;
        
        // Check if we already found a video for this play
        if (this.videoCache.has(playKey)) {
            const cachedResult = this.videoCache.get(playKey);
            console.log(`📦 Using cached result for play ${playKey}`);
            return cachedResult;
        }

        try {
            console.log(`🔍 Finding video for play: ${playKey}`);
            console.log(`📝 Play: ${play.result?.description || 'No description'}`);
            
            const gameContent = await this.fetchGameContent(gamePk);
            if (!gameContent) {
                console.log('❌ No game content available');
                this.videoCache.set(playKey, null);
                return null;
            }

            const videos = this.extractHighlightVideos(gameContent);
            if (videos.length === 0) {
                console.log('❌ No videos available');
                this.videoCache.set(playKey, null);
                return null;
            }

            // Calculate scores for all available videos (not already used)
            const availableVideos = videos.filter(video => !this.usedVideoIds.has(video.id));
            console.log(`📊 Scoring ${availableVideos.length} available videos (${videos.length - availableVideos.length} already used)`);
            
            if (availableVideos.length === 0) {
                console.log('⚠️ All videos have been used, allowing reuse for this play');
                // If all videos are used, allow reuse but with penalty
                availableVideos.push(...videos);
            }

            const scoredVideos = availableVideos.map(video => ({
                video,
                ...this.calculateMatchScore(play, video)
            }));

            // Sort by score descending
            scoredVideos.sort((a, b) => b.score - a.score);

            // Log top matches for debugging
            console.log('🏆 Top matches:');
            scoredVideos.slice(0, 3).forEach((match, index) => {
                console.log(`  ${index + 1}. "${match.videoTitle}" - Score: ${match.score.toFixed(3)} (${match.factors})`);
            });

            const bestMatch = scoredVideos[0];
            
            if (bestMatch && bestMatch.score >= minScore) {
                // Mark this video as used to prevent duplicates
                this.usedVideoIds.add(bestMatch.video.id);
                
                const result = {
                    ...bestMatch.video,
                    matchScore: bestMatch.score,
                    matchFactors: bestMatch.factors,
                    playType: bestMatch.playType
                };
                
                this.videoCache.set(playKey, result);
                
                console.log(`✅ Found match: "${bestMatch.videoTitle}" (score: ${bestMatch.score.toFixed(3)})`);
                console.log(`🔗 URL: ${result.url}`);
                
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

    // Reset used videos for a new game
    resetForNewGame(gamePk) {
        this.usedVideoIds.clear();
        
        // Clear caches for this game
        for (const [key, value] of this.videoCache.entries()) {
            if (key.startsWith(`${gamePk}_`)) {
                this.videoCache.delete(key);
            }
        }
        
        this.gameContentCache.delete(gamePk);
        console.log(`🔄 Reset video matcher for game ${gamePk}`);
    }

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
