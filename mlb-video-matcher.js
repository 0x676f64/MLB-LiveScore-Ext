// mlb-video-matcher.js
// MLB Video Matcher and Player for Chrome Extension
// Handles finding and playing videos for specific scoring plays

class MLBVideoMatcher {
    constructor() {
        this.videoCache = new Map();
        this.gameContentCache = new Map();
        this.rateLimitDelay = 1000; // 1 second between API calls
        this.lastApiCall = 0;
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

    // Create expandable video player element
    createVideoPlayer(video, playDiv, videoButton) {
        // Remove existing video player if present
        const existingPlayer = playDiv.querySelector('.mlb-video-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }

        // Hide the video button when player opens
        videoButton.style.opacity = '0';
        videoButton.style.pointerEvents = 'none';

        const playerContainer = document.createElement('div');
        playerContainer.className = 'mlb-video-player';
        playerContainer.style.cssText = `
            width: 100%;
            height: 0;
            margin-top: 8px;
            border-radius: 8px;
            overflow: hidden;
            background: linear-gradient(152deg,rgba(4, 30, 65, 1) 44%, rgba(255, 255, 255, 1) 50%, rgba(191, 13, 61, 1) 55%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        const videoElement = document.createElement('video');
        videoElement.style.cssText = `
            width: 100%;
            height: 250px;
            display: block;
        `;
        videoElement.controls = true;
        videoElement.preload = 'metadata';
        videoElement.src = video.url;

        // Video event handlers
        videoElement.onloadedmetadata = () => {
            // Expand the player with smooth animation
            playerContainer.style.height = '250px';
            playerContainer.style.opacity = '1';
            
            // Update play div styling for expanded state
            playDiv.style.transform = 'scale(1.02)';
            playDiv.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            playDiv.style.zIndex = '10';
            
            // Scroll to show the video
            setTimeout(() => {
                playerContainer.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 200);
        };

        // Add error handling
        videoElement.onerror = () => {
            playerContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666; height: 100px; display: flex; flex-direction: column; justify-content: center;">
                    <p style="margin: 0; font-weight: bold;">Unable to load video</p>
                    <small style="margin-top: 5px; opacity: 0.7;">${video.title}</small>
                </div>
            `;
            playerContainer.style.height = '100px';
            playerContainer.style.opacity = '1';
            
            // Auto-collapse after 3 seconds
            setTimeout(() => {
                this.collapseVideoPlayer(playerContainer, playDiv, videoButton);
            }, 3000);
        };

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease;
        `;
        closeButton.textContent = '✕';
        closeButton.title = 'Close video';
        closeButton.onmouseover = () => closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
        closeButton.onmouseleave = () => closeButton.style.backgroundColor = 'rgba(0,0,0,0.7)';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            videoElement.pause();
            this.collapseVideoPlayer(playerContainer, playDiv, videoButton);
        };

        // Create wrapper for video and close button
        const videoWrapper = document.createElement('div');
        videoWrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';
        videoWrapper.appendChild(videoElement);
        videoWrapper.appendChild(closeButton);

        playerContainer.appendChild(videoWrapper);
        
        // Insert video container at the bottom of the play div
        playDiv.appendChild(playerContainer);

        return videoElement;
    }

    // Collapse video player back to icon
    collapseVideoPlayer(playerContainer, playDiv, videoButton) {
        // Collapse the player with smooth animation
        playerContainer.style.height = '0';
        playerContainer.style.opacity = '0';
        
        // Reset play div styling
        playDiv.style.transform = 'scale(1)';
        playDiv.style.boxShadow = '';
        playDiv.style.zIndex = '';
        
        // Show the video button again
        videoButton.style.opacity = '1';
        videoButton.style.pointerEvents = 'auto';
        
        // Remove the player after animation completes
        setTimeout(() => {
            if (playerContainer && playerContainer.parentNode) {
                playerContainer.remove();
            }
        }, 400);
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

    // Clear all caches
    clearCache() {
        this.videoCache.clear();
        this.gameContentCache.clear();
    }
}

// Export for use in other files
window.MLBVideoMatcher = MLBVideoMatcher;