// Enhanced MLB Video Matcher - Direct GUID to PlayId Matching
// Matches videos using direct playId to GUID correspondence

class MLBVideoMatcher {
    constructor() {
        this.videoCache = new Map();
        this.gameContentCache = new Map();
        this.usedVideoIds = new Set();
        this.rateLimitDelay = 1000;
        this.lastApiCall = 0;
        this.activeVideoPlayers = new Set();
        this.contentWrapperState = null;
        

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
                console.log(`Processing highlight ${index}:`, {
                    guid: highlight.guid,
                    title: highlight.title,
                    hasPlaybacks: !!(highlight?.playbacks?.length),
                    playbackCount: highlight?.playbacks?.length || 0
                });

                // Skip highlights without GUID - we need this for matching
                if (!highlight.guid) {
                    console.log(`  ❌ Skipping highlight ${index}: No GUID`);
                    return; 
                }

                const playbacks = highlight?.playbacks || [];
                const bestPlayback = this.selectBestPlayback(playbacks);
                
                if (!bestPlayback) {
                    console.log(`  ❌ Skipping highlight ${index}: No suitable playback found`);
                    return;
                }

                if (!highlight.date) {
                    console.log(`  ❌ Skipping highlight ${index}: No date`);
                    return;
                }
                
                const video = {
                    id: highlight.id || highlight.guid || `highlight_${index}`,
                    guid: highlight.guid,
                    title: (highlight.title || '').trim(),
                    description: (highlight.description || '').trim(),
                    date: highlight.date,
                    url: bestPlayback.url,
                    duration: highlight.duration || 0,
                    keywords: this.extractKeywords(highlight),
                    playbackType: bestPlayback.name || 'unknown',
                    isAnimated: this.detectAnimatedVideo(highlight),
                    contentType: this.detectContentType(highlight)
                };
                
                console.log(`  ✅ Added video ${index}:`, {
                    guid: video.guid,
                    title: video.title,
                    url: video.url,
                    isAnimated: video.isAnimated,
                    contentType: video.contentType
                });
                
                videos.push(video);
            });

            console.log(`✅ Extracted ${videos.length} videos with GUIDs`);
            return videos;
        } catch (error) {
            console.error('❌ Error extracting highlight videos:', error);
            return [];
        }
    }

    selectBestPlayback(playbacks) {
        if (!playbacks || playbacks.length === 0) {
            console.log('⚠️ No playbacks available');
            return null;
        }

        console.log(`  Checking ${playbacks.length} playbacks:`, playbacks.map(p => ({
            name: p.name,
            url: p.url?.substring(0, 50) + '...',
            hasMP4: (p.name || '').toLowerCase().includes('mp4avc') || (p.url || '').toLowerCase().includes('.mp4'),
            hasM3U8: (p.name || '').includes('m3u8') || (p.url || '').includes('.m3u8')
        })));

        const mp4Playbacks = playbacks.filter(p => {
            const name = (p.name || '').toLowerCase();
            const url = (p.url || '').toLowerCase();
            
            const isMP4 = name.includes('mp4avc') || url.includes('.mp4');
            const isNotM3U8 = !name.includes('m3u8') && !url.includes('.m3u8');
            
            console.log(`    Playback "${p.name}": isMP4=${isMP4}, isNotM3U8=${isNotM3U8}`);
            
            return isMP4 && isNotM3U8;
        });

        console.log(`  Found ${mp4Playbacks.length} MP4 playbacks`);

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
                console.log(`✅ Selected ${quality} MP4 playback: ${qualityPlayback.name}`);
                return qualityPlayback;
            }
        }

        console.log(`✅ Selected default MP4 playback: ${mp4Playbacks[0].name}`);
        return mp4Playbacks[0];
    }

    detectAnimatedVideo(highlight) {
        const duration = highlight.duration || 0;
        // Only filter by suspicious duration (very short or very long videos)
        return duration > 0 && (duration < 5 || duration > 120);
    }

    detectContentType(highlight) {
        const duration = highlight.duration || 0;
        
        // Simple duration-based filtering
        if (duration > 0 && (duration < 5 || duration > 120)) {
            return 'animated';
        }
        
        return 'play';
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

    // Main video finding method using direct GUID to PlayId matching
    async findVideoForPlay(gamePk, play) {
        const playKey = `${gamePk}_${play.about?.atBatIndex || 'unknown'}_${play.about?.playIndex || 'unknown'}`;
        
        if (this.videoCache.has(playKey)) {
            const cachedResult = this.videoCache.get(playKey);
            console.log(`📦 Using cached result for play ${playKey}`);
            return cachedResult;
        }

        try {
            console.log(`🔍 Finding video for play: ${playKey}`);
            console.log(`📝 Play Description: "${play.result?.description || 'No description'}"`);
            
            // Extract playId from the play's playEvents
            let targetPlayId = null;
            if (play.playEvents && play.playEvents.length > 0) {
                const lastPlayEvent = play.playEvents[play.playEvents.length - 1];
                if (lastPlayEvent.playId) {
                    targetPlayId = lastPlayEvent.playId;
                }
            }

            if (!targetPlayId) {
                console.log('❌ No playId found for this scoring play. Cannot match.');
                this.videoCache.set(playKey, null);
                return null;
            }
            console.log(`🎯 Target playId: ${targetPlayId}`);

            // Fetch game content and extract videos
            const gameContent = await this.fetchGameContent(gamePk);
            if (!gameContent) {
                console.log('❌ No game content available.');
                this.videoCache.set(playKey, null);
                return null;
            }

            const allVideos = this.extractHighlightVideos(gameContent);
            if (allVideos.length === 0) {
                console.log('❌ No highlight videos available.');
                this.videoCache.set(playKey, null);
                return null;
            }

            // Filter to suitable play videos
            const playVideos = allVideos.filter(video => 
                !video.isAnimated && 
                video.contentType !== 'animated' &&
                video.url.toLowerCase().includes('.mp4')
            );
            
            console.log(`📊 Filtered to ${playVideos.length} suitable videos`);

            if (playVideos.length === 0) {
                console.log('❌ No suitable play videos found.');
                this.videoCache.set(playKey, null);
                return null;
            }

            // Find exact GUID match
            let bestMatch = null;

            // Prioritize unused videos first
            let availableVideos = playVideos.filter(video => !this.usedVideoIds.has(video.id));
            if (availableVideos.length === 0) {
                console.log('⚠️ All videos used, allowing reuse.');
                availableVideos = [...playVideos];
            }

            console.log(`🔍 Looking for GUID "${targetPlayId}" among ${availableVideos.length} available videos:`);
            availableVideos.forEach((video, index) => {
                console.log(`  Video ${index}: GUID="${video.guid}", Title="${video.title}", Match=${video.guid === targetPlayId ? '✅' : '❌'}`);
            });

            for (const video of availableVideos) {
                if (video.guid === targetPlayId) {
                    bestMatch = video;
                    console.log(`✅ Perfect GUID match found: "${video.title}" (GUID: ${video.guid})`);
                    break; 
                }
            }

            if (!bestMatch) {
                console.log(`❌ No video found with matching GUID: ${targetPlayId}`);
                this.videoCache.set(playKey, null);
                return null;
            }

            // Mark as used
            this.usedVideoIds.add(bestMatch.id);
            
            const result = {
                ...bestMatch,
                matchScore: 1.0,
                matchType: 'guid-match',
                playId: targetPlayId
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

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        if (timeSinceLastCall < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
        }
        this.lastApiCall = Date.now();
    }

    // UI Methods
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
                    videoButton.innerHTML = `
                        <span style="color: green;">✓</span>
                        <span style="font-size: 11px;">PERFECT MATCH</span>
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

    // Video player creation
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
        
        const duration = video.duration ? ` • ${Math.round(video.duration)}s` : '';
        
        titleHeader.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${video.title}</div>
            <div style="font-size: 12px; opacity: 0.8;">Perfect Match${duration}</div>
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

    // Reset button state
    resetVideoButton(videoButton) {
        if (!videoButton) return;

        videoButton.style.transition = 'all 0.3s ease';
        videoButton.style.opacity = '0.7';
        videoButton.style.pointerEvents = 'auto';
        videoButton.disabled = false;
        
        videoButton.innerHTML = `
            <img src="assets/icons/video-camera.png" alt="video" style="width: 16px; height: 16px; filter: contrast(1.2);" />
            <span style="font-size: 11px;">VIDEO</span>
        `;
        videoButton.style.background = 'linear-gradient(135deg, rgba(248,249,250,0.95), rgba(217,230,243,0.95))';
        
        console.log('🔄 Video button reset to original state');
    }

    // Cache management
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

    clearCache(maxAge = 3600000) { // 1 hour default
        const now = Date.now();
        const cutoff = now - maxAge;
        
        // Size-based eviction
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
}

// Export
try {
    window.MLBVideoMatcher = MLBVideoMatcher;
    console.log('✅ MLBVideoMatcher loaded successfully');
    console.log('🎯 Using direct GUID to playId matching');
} catch (error) {
    console.error('💥 Failed to load MLBVideoMatcher:', error);
}
