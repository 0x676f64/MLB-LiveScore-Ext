// mlb-video-matcher.js
// MLB Video Matcher and Player for Chrome Extension
// Handles finding and playing videos for specific scoring plays

class MLBVideoMatcher {
    constructor() {
        this.videoCache = new Map();
        this.gameContentCache = new Map();
        this.rateLimitDelay = 1000; // 1 second between API calls
        this.lastApiCall = 0;
        this.activeVideoPlayers = new Set(); // Track active video players
        this.contentWrapperState = null; // Store original content wrapper state
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

    // Fetch game content with caching
    async fetchGameContent(gamePk) {
        if (this.gameContentCache.has(gamePk)) {
            return this.gameContentCache.get(gamePk);
        }

        try {
            await this.waitForRateLimit();
            const response = await fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/content`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch game content: ${response.status}`);
            }

            const gameContent = await response.json();
            this.gameContentCache.set(gamePk, gameContent);
            return gameContent;
        } catch (error) {
            console.error('Error fetching game content:', error);
            return null;
        }
    }

    // Extract highlight videos from game content
    extractHighlightVideos(gameContent) {
        const videos = [];
        
        try {
            // Navigate through the content structure to find highlights
            const highlights = gameContent?.highlights?.highlights?.items || [];
            
            highlights.forEach(highlight => {
                const playbacks = highlight?.playbacks || [];
                const bestPlayback = this.selectBestPlayback(playbacks);
                
                if (bestPlayback && highlight.date) {
                    videos.push({
                        id: highlight.guid || highlight.id,
                        title: highlight.title || '',
                        description: highlight.description || '',
                        slug: highlight.slug || '',
                        date: highlight.date,
                        url: bestPlayback.url,
                        duration: highlight.duration || 0,
                        keywords: (highlight.keywordsAll || []).map(k => k.value).join(' ').toLowerCase()
                    });
                }
            });

            console.log(`Found ${videos.length} highlight videos`);
            return videos;
        } catch (error) {
            console.error('Error extracting highlight videos:', error);
            return [];
        }
    }

    // Select the best quality playback from available options
    selectBestPlayback(playbacks) {
        if (!playbacks || playbacks.length === 0) return null;

        // Prefer 720p or 1080p, fallback to highest available
        const preferredQualities = ['1800K', '1200K', '800K', '600K', '450K'];
        
        for (const quality of preferredQualities) {
            const playback = playbacks.find(p => p.name && p.name.includes(quality));
            if (playback) return playback;
        }

        // Return the first available if no preferred quality found
        return playbacks[0];
    }

    // Normalize description for matching
    normalizeDescription(desc) {
        return desc
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/(\d+)(st|nd|rd|th)/g, '$1')
            .replace(/\bhomers?\b/g, 'home run')
            .replace(/\bdoubles?\b/g, 'double')
            .replace(/\btriples?\b/g, 'triple')
            .replace(/\bsingles?\b/g, 'single')
            .trim();
    }

    // Calculate text similarity using a simple algorithm
    calculateSimilarity(str1, str2) {
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        
        let matchCount = 0;
        const totalWords = Math.max(words1.length, words2.length);
        
        words1.forEach(word => {
            if (words2.includes(word) && word.length > 2) { // Ignore short words
                matchCount++;
            }
        });
        
        return matchCount / totalWords;
    }

    // Match video by description similarity
    matchVideoByDescription(play, videos, threshold = 0.3) {
        const playDesc = this.normalizeDescription(play.result?.description || '');
        const playerName = this.normalizeDescription(play.matchup?.batter?.fullName || '');
        
        let bestMatch = null;
        let bestScore = 0;

        videos.forEach(video => {
            // Check title, description, and keywords
            const videoText = this.normalizeDescription(
                `${video.title} ${video.description} ${video.keywords}`
            );
            
            // Calculate similarity scores
            const descSimilarity = this.calculateSimilarity(playDesc, videoText);
            const nameSimilarity = playerName ? this.calculateSimilarity(playerName, videoText) : 0;
            
            // Combined score with name weighting
            const combinedScore = (descSimilarity * 0.7) + (nameSimilarity * 0.3);
            
            if (combinedScore > bestScore && combinedScore >= threshold) {
                bestScore = combinedScore;
                bestMatch = { ...video, matchScore: combinedScore };
            }
        });

        return bestMatch;
    }

    // Match video by timestamp proximity
    matchVideoByTime(play, videos, maxMinutesDiff = 5) {
        if (!play.about?.startTime && !play.about?.endTime) {
            return null;
        }

        const playTime = new Date(play.about.startTime || play.about.endTime);
        const maxDiff = maxMinutesDiff * 60 * 1000; // Convert to milliseconds

        let bestMatch = null;
        let smallestDiff = maxDiff;

        videos.forEach(video => {
            const videoTime = new Date(video.date);
            const timeDiff = Math.abs(videoTime - playTime);
            
            if (timeDiff < smallestDiff) {
                smallestDiff = timeDiff;
                bestMatch = { ...video, timeDiff };
            }
        });

        return bestMatch;
    }

    // Validate that the play type matches the video content
    validatePlayVideoMatch(play, video) {
        const playType = (play.result?.event || '').toLowerCase();
        const videoContent = `${video.title} ${video.description}`.toLowerCase();
        
        const validationRules = {
            'home run': ['homer', 'home run', 'hr'],
            'double': ['double'],
            'triple': ['triple'],
            'single': ['single', 'hit'],
            'error': ['error'],
            'walk': ['walk', 'bb'],
            'sac': ['sacrifice', 'sac']
        };

        for (const [type, keywords] of Object.entries(validationRules)) {
            if (playType.includes(type)) {
                return keywords.some(keyword => videoContent.includes(keyword));
            }
        }

        return true; // If no specific rule, assume valid
    }

    // Main function to find video for a play
    async findVideoForPlay(gamePk, play) {
        const cacheKey = `${gamePk}_${play.about?.atBatIndex || play.atBatIndex}`;
        
        if (this.videoCache.has(cacheKey)) {
            return this.videoCache.get(cacheKey);
        }

        try {
            const gameContent = await this.fetchGameContent(gamePk);
            if (!gameContent) {
                return null;
            }

            const videos = this.extractHighlightVideos(gameContent);
            if (videos.length === 0) {
                return null;
            }

            // Try description matching first
            let matchedVideo = this.matchVideoByDescription(play, videos, 0.3);
            
            // If no good description match, try temporal matching
            if (!matchedVideo) {
                matchedVideo = this.matchVideoByTime(play, videos, 10);
            }

            // Validate the match
            if (matchedVideo && !this.validatePlayVideoMatch(play, matchedVideo)) {
                console.log('Video validation failed, discarding match');
                matchedVideo = null;
            }

            // Cache the result (even if null)
            this.videoCache.set(cacheKey, matchedVideo);
            
            if (matchedVideo) {
                console.log(`Found video for play: ${matchedVideo.title}`, matchedVideo);
            }

            return matchedVideo;
        } catch (error) {
            console.error('Error finding video for play:', error);
            return null;
        }
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
                    contentWrapper.style.display = 'none';
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

    // Create expandable video player element
    createVideoPlayer(video, playDiv, videoButton) {
        // Remove existing video player if present
        const existingPlayer = playDiv.querySelector('.mlb-video-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }

        // Hide content wrapper when opening video
        this.hideContentWrapper();

        // Track this video player
        const playerId = Date.now() + Math.random();
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
            max-width: 800px;
            height: 0;
            border-radius: 12px;
            overflow: hidden;
            background: linear-gradient(152deg,rgba(4, 30, 65, 1) 44%, rgba(255, 255, 255, 1) 50%, rgba(191, 13, 61, 1) 55%);
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
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
            background: rgba(0, 0, 0, 0.8);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.4s ease;
        `;
        backdrop.onclick = () => this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);

        const videoElement = document.createElement('video');
        videoElement.style.cssText = `
            width: 100%;
            height: 450px;
            display: block;
        `;
        videoElement.controls = true;
        videoElement.preload = 'metadata';
        videoElement.src = video.url;

        // Video event handlers
        videoElement.onloadedmetadata = () => {
            // Show backdrop first
            backdrop.style.opacity = '1';
            
            // Then expand the player with smooth animation
            setTimeout(() => {
                playerContainer.style.height = '450px';
                playerContainer.style.opacity = '1';
                playerContainer.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
        };

        // Add error handling
        videoElement.onerror = () => {
            playerContainer.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #fff; height: 200px; display: flex; flex-direction: column; justify-content: center;">
                    <p style="margin: 0; font-weight: bold; font-size: 18px;">Unable to load video</p>
                    <small style="margin-top: 10px; opacity: 0.8; font-size: 14px;">${video.title}</small>
                </div>
            `;
            playerContainer.style.height = '200px';
            playerContainer.style.opacity = '1';
            playerContainer.style.transform = 'translate(-50%, -50%) scale(1)';
            backdrop.style.opacity = '1';
            
            // Auto-close after 3 seconds
            setTimeout(() => {
                this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);
            }, 3000);
        };

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(0,0,0,0.8);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(5px);
        `;
        closeButton.textContent = '✕';
        closeButton.title = 'Close video';
        closeButton.onmouseover = () => {
            closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
            closeButton.style.transform = 'scale(1.1)';
        };
        closeButton.onmouseleave = () => {
            closeButton.style.backgroundColor = 'rgba(0,0,0,0.8)';
            closeButton.style.transform = 'scale(1)';
        };
        closeButton.onclick = (e) => {
            e.stopPropagation();
            videoElement.pause();
            this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);
        };

        // Add video title overlay
        const titleOverlay = document.createElement('div');
        titleOverlay.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            color: white;
            padding: 20px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10;
        `;
        titleOverlay.textContent = video.title;

        // Create wrapper for video and overlays
        const videoWrapper = document.createElement('div');
        videoWrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';
        videoWrapper.appendChild(videoElement);
        videoWrapper.appendChild(closeButton);
        videoWrapper.appendChild(titleOverlay);

        playerContainer.appendChild(videoWrapper);
        
        // Add elements to document
        document.body.appendChild(backdrop);
        document.body.appendChild(playerContainer);

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                videoElement.pause();
                this.closeVideoPlayer(playerContainer, playDiv, videoButton, playerId);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        return videoElement;
    }

    // Close video player and restore content wrapper
    closeVideoPlayer(playerContainer, playDiv, videoButton, playerId) {
        // Remove from active players
        this.activeVideoPlayers.delete(playerId);

        const backdrop = document.querySelector('div[style*="position: fixed"][style*="background: rgba(0, 0, 0, 0.8)"]');
        
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
        
        // Show the video button again
        setTimeout(() => {
            videoButton.style.opacity = '1';
            videoButton.style.pointerEvents = 'auto';
        }, 300);
        
        // Remove elements after animation completes
        setTimeout(() => {
            if (playerContainer && playerContainer.parentNode) {
                playerContainer.remove();
            }
            if (backdrop && backdrop.parentNode) {
                backdrop.remove();
            }
        }, 500);
    }

    // Add video button to play item
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
            background: linear-gradient(135deg, #f8f9fa, #d9e6f3ff);
            border: none;
            padding: 6px 12px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
            z-index: 10;
            opacity: 1;
            pointer-events: auto;
        `;
        videoButton.innerHTML = '<img src="/assets/icons/video-camera.png" alt="Video Camera" />';

        // Add hover effects
        videoButton.onmouseover = () => {
            if (videoButton.style.opacity === '1') {
                videoButton.style.transform = 'scale(1.05)';
                videoButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }
        };
        videoButton.onmouseleave = () => {
            if (videoButton.style.opacity === '1') {
                videoButton.style.transform = 'scale(1)';
                videoButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }
        };

        // Handle video loading and playing
        videoButton.onclick = async (e) => {
            e.stopPropagation();
            
            // Prevent clicks when button is hidden
            if (videoButton.style.opacity === '0' || videoButton.style.pointerEvents === 'none') {
                return;
            }

            try {
                const video = await this.findVideoForPlay(gamePk, play);
                
                if (video) {
                    // Create and show video player with expansion animation
                    this.createVideoPlayer(video, playDiv, videoButton);
                } else {
                    // Show not found state briefly
                    videoButton.textContent = '❌ Not Found';
                    videoButton.style.background = 'linear-gradient(135deg, #f8f9fa, #d9e6f3ff)';
                    
                    setTimeout(() => {
                        videoButton.innerHTML = '<img src="/assets/icons/video-camera.png" alt="Video Camera" />';
                        videoButton.style.background = 'linear-gradient(135deg, #f8f9fa, #d9e6f3ff)';
                    }, 2000);
                }
            } catch (error) {
                console.error('Error loading video:', error);
                
                // Show error state briefly
                videoButton.textContent = '❌ Error';
                videoButton.style.background = 'linear-gradient(135deg, #f8f9fa, #d9e6f3ff)';
                
                setTimeout(() => {
                    videoButton.innerHTML = '<img src="/assets/icons/video-camera.png" alt="Video Camera" />';
                    videoButton.style.background = 'linear-gradient(135deg, #f8f9fa, #d9e6f3ff)';
                }, 2000);
            } finally {
                videoButton.disabled = false;
            }
        };

        playDiv.appendChild(videoButton);
    }

    // Clear all caches and reset state
    clearCache() {
        this.videoCache.clear();
        this.gameContentCache.clear();
        this.activeVideoPlayers.clear();
        this.contentWrapperState = null;
    }
}

// Export for use in other files
window.MLBVideoMatcher = MLBVideoMatcher;
