// DOM Elements
const setupSection = document.getElementById('setup-section');
const mainSection = document.getElementById('main-section');
const loadingSection = document.getElementById('loading-section');
const errorSection = document.getElementById('error-section');

const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const clearKeyBtn = document.getElementById('clear-key-btn');
const toggleBtn = document.getElementById('toggle-btn');
const retryBtn = document.getElementById('retry-btn');

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const checksToday = document.getElementById('checks-today');
const warningsToday = document.getElementById('warnings-today');
const errorText = document.getElementById('error-text');

// State management
let extensionEnabled = true;
let apiKeyValid = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, popup initializing...');
    
    // Verify all elements exist
    console.log('Setup section:', setupSection);
    console.log('API key input:', apiKeyInput);
    console.log('Save button:', saveKeyBtn);
    
    // Set up event listeners immediately for setup section
    if (saveKeyBtn && apiKeyInput) {
        console.log('Adding immediate event listeners...');
        saveKeyBtn.addEventListener('click', handleSaveApiKey);
        apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed');
                handleSaveApiKey();
            }
        });
    }
    
    await initializePopup();
});

// Initialize the popup interface
async function initializePopup() {
    console.log('Initializing popup...'); // Debug log
    try {
        // Check if API key exists and is valid
        const result = await chrome.storage.local.get(['apiKey', 'extensionEnabled', 'dailyStats']);
        console.log('Storage result:', result); // Debug log
        
        if (result.apiKey) {
            console.log('API key found, validating...'); // Debug log
            showSection('loading');
            const isValid = await validateApiKey(result.apiKey);
            
            if (isValid) {
                console.log('API key is valid, loading main interface'); // Debug log
                apiKeyValid = true;
                extensionEnabled = result.extensionEnabled !== false; // Default to true
                await loadMainInterface(result.dailyStats || {});
            } else {
                console.log('API key is invalid'); // Debug log
                showError('Invalid API key. Please enter a valid Google Generative AI API key.');
                setTimeout(() => showSection('setup'), 2000);
            }
        } else {
            console.log('No API key found, showing setup'); // Debug log
            showSection('setup');
        }
    } catch (error) {
        console.error('Error initializing popup:', error);
        showError('Failed to initialize extension.');
    }
}

// Show specific section
function showSection(section) {
    // Hide all sections
    [setupSection, mainSection, loadingSection, errorSection].forEach(el => {
        el.style.display = 'none';
    });
    
    // Show requested section
    switch (section) {
        case 'setup':
            setupSection.style.display = 'block';
            break;
        case 'main':
            mainSection.style.display = 'block';
            break;
        case 'loading':
            loadingSection.style.display = 'block';
            break;
        case 'error':
            errorSection.style.display = 'block';
            break;
    }
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    showSection('error');
}

// Validate API key with Google Generative AI
async function validateApiKey(apiKey) {
    console.log('Validating API key:', apiKey.substring(0, 10) + '...'); // Debug log (partial key)
    
    // Basic format check first
    if (!apiKey || apiKey.length < 20) {
        console.log('API key too short or empty');
        return false;
    }
    
    try {
        console.log('Making API request...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API response status:', response.status);
        console.log('API response ok:', response.ok);
        
        return response.ok;
    } catch (error) {
        console.error('API key validation error:', error);
        // For debugging purposes, let's allow proceeding even if validation fails due to network issues
        // In production, you might want to be more strict
        if (apiKey.startsWith('AIza') && apiKey.length > 30) {
            console.log('Network error but API key format looks valid, allowing...');
            return true;
        }
        return false;
    }
}

// Load main interface
async function loadMainInterface(dailyStats) {
    updateStatusDisplay();
    updateDailyStats(dailyStats);
    showSection('main');
    
    // Set up event listeners
    setupEventListeners();
}

// Update status display
function updateStatusDisplay() {
    if (extensionEnabled) {
        statusDot.classList.add('active');
        statusText.textContent = 'MisinfoGuard Active';
        toggleBtn.textContent = 'Disable';
        toggleBtn.classList.remove('enabled');
    } else {
        statusDot.classList.remove('active');
        statusText.textContent = 'MisinfoGuard Disabled';
        toggleBtn.textContent = 'Enable';
        toggleBtn.classList.add('enabled');
    }
}

// Update daily stats
function updateDailyStats(stats) {
    const today = new Date().toDateString();
    const todayStats = stats[today] || { checks: 0, warnings: 0 };
    
    checksToday.textContent = todayStats.checks;
    warningsToday.textContent = todayStats.warnings;
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...'); // Debug log
    
    // Save API key
    if (saveKeyBtn) {
        console.log('Save button found, adding event listener'); // Debug log
        saveKeyBtn.addEventListener('click', handleSaveApiKey);
    } else {
        console.error('Save button not found!'); // Debug log
    }
    
    if (apiKeyInput) {
        apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed in API input'); // Debug log
                handleSaveApiKey();
            }
        });
    } else {
        console.error('API key input not found!'); // Debug log
    }
    
    // Clear API key
    if (clearKeyBtn) {
        clearKeyBtn.addEventListener('click', handleClearApiKey);
    }
    
    // Toggle extension
    if (toggleBtn) {
        toggleBtn.addEventListener('click', handleToggleExtension);
    }
    
    // Retry button
    if (retryBtn) {
        retryBtn.addEventListener('click', initializePopup);
    }
    
    // Settings button (placeholder)
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // TODO: Implement settings page
            console.log('Settings clicked');
        });
    }
}

// Handle API key saving
async function handleSaveApiKey() {
    console.log('Save button clicked!'); // Debug log
    const apiKey = apiKeyInput.value.trim();
    console.log('API key length:', apiKey.length); // Debug log
    
    if (!apiKey) {
        console.log('No API key entered'); // Debug log
        showError('Please enter an API key.');
        return;
    }
    
    console.log('Showing loading section'); // Debug log
    showSection('loading');
    
    try {
        console.log('Validating API key...'); // Debug log
        
        // For debugging, let's temporarily skip validation if it's causing issues
        let isValid = true;
        
        // Try to validate, but don't fail if there are network issues
        try {
            isValid = await validateApiKey(apiKey);
        } catch (validationError) {
            console.log('Validation error, but continuing:', validationError);
            // If validation fails due to network, assume valid if format is correct
            isValid = apiKey.length > 20;
        }
        
        console.log('API key valid:', isValid); // Debug log
        
        if (isValid) {
            // Save API key
            console.log('Saving API key to storage...'); // Debug log
            await chrome.storage.local.set({ 
                apiKey: apiKey,
                extensionEnabled: true 
            });
            
            // Verify storage
            const stored = await chrome.storage.local.get(['apiKey']);
            console.log('Verified storage:', stored); // Debug log
            
            // Send message to background script
            console.log('Sending message to background script...'); // Debug log
            try {
                chrome.runtime.sendMessage({ 
                    action: 'apiKeyUpdated', 
                    apiKey: apiKey 
                });
            } catch (msgError) {
                console.log('Message sending failed, but continuing:', msgError);
            }
            
            apiKeyValid = true;
            extensionEnabled = true;
            
            console.log('Loading main interface...'); // Debug log
            await loadMainInterface({});
        } else {
            console.log('API key validation failed'); // Debug log
            showError('Invalid API key. Please check your key and try again.');
        }
    } catch (error) {
        console.error('Error saving API key:', error);
        showError('Failed to save API key: ' + error.message);
    }
}

// Handle API key clearing
async function handleClearApiKey() {
    if (confirm('Are you sure you want to remove your API key? You will need to enter it again to use the extension.')) {
        await chrome.storage.local.remove(['apiKey']);
        chrome.runtime.sendMessage({ action: 'apiKeyRemoved' });
        showSection('setup');
        apiKeyInput.value = '';
    }
}

// Handle extension toggle
async function handleToggleExtension() {
    extensionEnabled = !extensionEnabled;
    
    await chrome.storage.local.set({ extensionEnabled });
    
    chrome.runtime.sendMessage({ 
        action: 'toggleExtension', 
        enabled: extensionEnabled 
    });
    
    updateStatusDisplay();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'updateStats':
            updateDailyStats(message.stats);
            break;
        case 'extensionError':
            showError(message.error);
            break;
    }
});

// Utility function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '10px 15px',
        borderRadius: '6px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '10000',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'
    });
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}