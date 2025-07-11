// darkMode.js - Shared dark mode utility for Chrome extension

class DarkModeManager {
    constructor() {
        this.storageKey = 'darkMode';
        this.isExtensionContext = this.checkExtensionContext();
        this.init();
    }

    checkExtensionContext() {
        return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    }

    init() {
        // Apply dark mode on page load
        this.applyDarkMode();
        
        // Listen for storage changes (when dark mode is toggled from other pages)
        if (this.isExtensionContext) {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local' && changes[this.storageKey]) {
                    this.applyDarkMode();
                }
            });
        } else {
            // For localStorage, listen for storage events
            window.addEventListener('storage', (e) => {
                if (e.key === this.storageKey) {
                    this.applyDarkMode();
                }
            });
        }
    }

    async isDarkModeEnabled() {
        try {
            if (this.isExtensionContext) {
                const result = await chrome.storage.local.get(this.storageKey);
                return result[this.storageKey] === true;
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem(this.storageKey);
                return stored === 'true';
            }
        } catch (error) {
            console.error('Error reading dark mode preference:', error);
            return false;
        }
    }

    async setDarkMode(enabled) {
        try {
            if (this.isExtensionContext) {
                await chrome.storage.local.set({ [this.storageKey]: enabled });
            } else {
                // Fallback to localStorage
                localStorage.setItem(this.storageKey, enabled.toString());
            }
            this.applyDarkMode();
        } catch (error) {
            console.error('Error saving dark mode preference:', error);
        }
    }

    async applyDarkMode() {
        const isDark = await this.isDarkModeEnabled();
        const body = document.body;
        
        if (isDark) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }

        // Update toggle button if it exists
        const toggleSwitch = document.querySelector('.toggle-switch');
        if (toggleSwitch) {
            if (isDark) {
                toggleSwitch.classList.add('active');
            } else {
                toggleSwitch.classList.remove('active');
            }
        }

        // Dispatch custom event for other components that need to know
        document.dispatchEvent(new CustomEvent('darkModeChanged', { 
            detail: { isDark } 
        }));
    }

    async toggle() {
        const currentMode = await this.isDarkModeEnabled();
        await this.setDarkMode(!currentMode);
    }
}

// Initialize dark mode manager
const darkModeManager = new DarkModeManager();

// Export for use in other scripts
window.darkModeManager = darkModeManager;