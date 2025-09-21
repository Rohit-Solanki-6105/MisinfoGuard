// Content script for MisinfoGuard extension
console.log('🛡️ MisinfoGuard content script starting...');

// Extension state
let extensionState = {
    enabled: false,
    hasApiKey: false,
    selectedText: '',
    isAnalyzing: false
};

// UI elements
let analysisOverlay = null;
let quickAnalyzeButton = null;
let lastSelection = null;

// Initialize content script
(function initialize() {
    console.log('MisinfoGuard content script loaded');
    
    // Initialize with default enabled state
    extensionState.enabled = true;
    
    // Check extension state with background script
    chrome.runtime.sendMessage({ action: 'getExtensionState' }, (response) => {
        console.log('Extension state response:', response);
        
        if (chrome.runtime.lastError) {
            console.error('Error communicating with background script:', chrome.runtime.lastError);
            // Continue with default settings if background script fails
            console.log('Continuing with default settings');
            setupEventListeners();
            return;
        }
        
        if (response) {
            extensionState = { ...extensionState, ...response };
            console.log('Updated extension state:', extensionState);
        }
        
        // Always setup event listeners
        console.log('Setting up event listeners');
        setupEventListeners();
    });
    
    // Also setup listeners immediately as fallback
    setTimeout(() => {
        if (!document.hasEventListener) {
            console.log('Setting up fallback event listeners');
            setupEventListeners();
        }
    }, 1000);
})();

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Mark that listeners are set up
    document.hasEventListener = true;
    
    // Text selection handling
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection);
    
    // Click outside to hide overlay and quick button
    document.addEventListener('click', handleClickOutside);
    
    // Scroll to hide quick analyze button
    document.addEventListener('scroll', hideQuickAnalyzeButton);
    
    // Message listener for background script communication
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Content script received message:', message);
        
        if (message.action === 'showAnalysisResult') {
            showAnalysisResult(message.analysis, message.originalText);
            sendResponse({ success: true });
        } else if (message.action === 'showAnalysisError' || message.action === 'showError') {
            showErrorOverlay(message.error);
            sendResponse({ success: true });
        } else if (message.action === 'extensionStateChanged') {
            extensionState = { ...extensionState, ...message };
            console.log('Extension state updated:', extensionState);
            sendResponse({ success: true });
        }
        
        return true; // Keep message channel open for async response
    });
    
    console.log('Event listeners set up successfully');
}

// Handle text selection
function handleTextSelection(event) {
    console.log('Text selection handler called');
    
    // Always allow text selection (remove the enabled check temporarily for debugging)
    console.log('Extension state:', extensionState);
    
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log('Selected text:', selectedText);
        console.log('Text length:', selectedText.length);
        
        if (selectedText.length > 10 && selectedText.length < 5000) {
            console.log('Text meets criteria, showing quick analyze button');
            extensionState.selectedText = selectedText;
            
            // Get selection position
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            console.log('Selection rect:', rect);
            
            // Show quick analyze button
            showQuickAnalyzeButton(rect, selectedText);
            
            lastSelection = {
                text: selectedText,
                rect: rect,
                range: range.cloneRange()
            };
        } else {
            console.log('Text does not meet criteria, hiding button');
            hideQuickAnalyzeButton();
        }
    }, 100);
}

// Show quick analyze button
function showQuickAnalyzeButton(rect, text) {
    console.log('Showing quick analyze button');
    
    hideQuickAnalyzeButton();
    
    quickAnalyzeButton = document.createElement('div');
    quickAnalyzeButton.id = 'misinfoguard-quick-button';
    quickAnalyzeButton.innerHTML = `
        <button class="quick-analyze-btn" onclick="event.stopPropagation();">
            🛡️ Analyze with MisinfoGuard
        </button>
    `;
    
    // Position the button
    const top = Math.max(10, rect.bottom + window.scrollY + 5);
    const left = Math.max(10, rect.left + window.scrollX);
    
    quickAnalyzeButton.style.cssText = `
        position: absolute !important;
        top: ${top}px !important;
        left: ${left}px !important;
        z-index: 2147483647 !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 0 !important;
        cursor: pointer !important;
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        animation: fadeInUp 0.3s ease-out !important;
        min-width: 280px !important;
    `;
    
    quickAnalyzeButton.querySelector('.quick-analyze-btn').style.cssText = `
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 14px 20px !important;
        border: none !important;
        background: none !important;
        color: inherit !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        white-space: nowrap !important;
        min-height: 48px !important;
        width: 100% !important;
        cursor: pointer !important;
    `;
    
    // Add click handler
    quickAnalyzeButton.querySelector('.quick-analyze-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Quick analyze button clicked');
        analyzeSelectedText(text);
    });
    
    document.body.appendChild(quickAnalyzeButton);
    console.log('Quick analyze button added to page');
}

// Hide quick analyze button
function hideQuickAnalyzeButton() {
    if (quickAnalyzeButton) {
        quickAnalyzeButton.remove();
        quickAnalyzeButton = null;
    }
}

// Handle click outside
function handleClickOutside(event) {
    if (quickAnalyzeButton && !quickAnalyzeButton.contains(event.target)) {
        hideQuickAnalyzeButton();
    }
    
    if (analysisOverlay && !analysisOverlay.contains(event.target)) {
        // Don't hide if clicking on overlay content
        if (!event.target.closest('.misinfoguard-overlay')) {
            hideAnalysisOverlay();
        }
    }
}

// Analyze selected text
async function analyzeSelectedText(text) {
    console.log('analyzeSelectedText called with text:', text.substring(0, 50) + '...');
    
    if (extensionState.isAnalyzing) {
        console.log('Already analyzing, returning');
        return;
    }
    
    if (!extensionState.hasApiKey) {
        showErrorOverlay('Please set up your Google AI API key in the extension popup first.');
        return;
    }
    
    extensionState.isAnalyzing = true;
    hideQuickAnalyzeButton();
    
    try {
        // Show loading state
        console.log('Showing loading overlay');
        showLoadingOverlay(text);
        
        // Send message to background script for analysis
        console.log('Sending analysis request to background script');
        const response = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Analysis timeout - please try again'));
            }, 30000); // 30 second timeout
            
            chrome.runtime.sendMessage({
                action: 'analyzeText',
                text: text,
                context: {
                    url: window.location.href,
                    title: document.title,
                    domain: window.location.hostname
                }
            }, (response) => {
                clearTimeout(timeout);
                console.log('Background script response:', response);
                
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.error) {
                    reject(new Error(response.error));
                } else if (response && response.success) {
                    resolve(response.result);
                } else {
                    reject(new Error('Invalid response from background script'));
                }
            });
        });
        
        console.log('Showing analysis result');
        showAnalysisResult(response, text);
        
    } catch (error) {
        console.error('Analysis error:', error);
        hideAnalysisOverlay();
        showErrorOverlay(error.message || 'Failed to analyze text. Please check your API key and try again.');
    } finally {
        extensionState.isAnalyzing = false;
    }
}

// Show loading overlay
function showLoadingOverlay(text) {
    console.log('showLoadingOverlay called');
    hideAnalysisOverlay();
    
    const overlay = createOverlay();
    overlay.innerHTML = `
        <div class="overlay-header">
            <h3>🛡️ MisinfoGuard Analysis</h3>
            <button class="close-btn" onclick="this.closest('.misinfoguard-overlay').remove()">×</button>
        </div>
        <div class="overlay-content">
            <div class="loading-section">
                <div class="loading-spinner"></div>
                <p>Analyzing text for misinformation...</p>
                <div class="analyzed-text">
                    <strong>Text being analyzed:</strong>
                    <p>"${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"</p>
                </div>
            </div>
        </div>
    `;
    
    analysisOverlay = overlay;
    document.body.appendChild(overlay);
    console.log('Loading overlay added to page');
    
    // Auto-hide after 30 seconds to prevent hanging
    setTimeout(() => {
        if (analysisOverlay && analysisOverlay.querySelector('.loading-spinner')) {
            console.log('Auto-hiding loading overlay after timeout');
            hideAnalysisOverlay();
            showErrorOverlay('Analysis timed out. Please try again.');
        }
    }, 30000);
}

// Show analysis result
function showAnalysisResult(analysis, originalText) {
    console.log('showAnalysisResult called with:', analysis);
    
    hideAnalysisOverlay();
    
    const overlay = createOverlay();
    const riskColor = getRiskColor(analysis.riskLevel);
    const credibilityPercentage = Math.round(analysis.credibilityScore * 100);
    
    overlay.innerHTML = `
        <div class="overlay-header">
            <h3>🛡️ MisinfoGuard Analysis</h3>
            <button class="close-btn" onclick="this.closest('.misinfoguard-overlay').remove()">×</button>
        </div>
        <div class="overlay-content">
            <div class="analysis-summary">
                <div class="credibility-score">
                    <div class="score-circle" style="border-color: ${riskColor}">
                        <span class="score-number" style="color: ${riskColor}">${credibilityPercentage}%</span>
                        <span class="score-label">Credibility</span>
                    </div>
                    <div class="risk-indicator">
                        <span class="risk-level ${analysis.riskLevel}">
                            ${analysis.riskLevel.toUpperCase()} RISK
                        </span>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b; line-height: 1.4;">
                            This content has been analyzed for potential misinformation indicators.
                        </p>
                    </div>
                </div>
                
                <div class="summary-text">
                    ${analysis.summary}
                </div>
            </div>
            
            <div class="analyzed-text">
                <h4>📄 Analyzed Content</h4>
                <p>"${originalText.substring(0, 300)}${originalText.length > 300 ? '...' : ''}"</p>
            </div>
            
            ${analysis.issues && analysis.issues.length > 0 ? `
                <div class="issues-section">
                    <h4>⚠️ Issues Identified</h4>
                    <ul class="issues-list">
                        ${analysis.issues.map(issue => `
                            <li>
                                <div>
                                    <strong>${issue.type.replace(/_/g, ' ').toUpperCase()}</strong>
                                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">${issue.description}</p>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${analysis.redFlags && analysis.redFlags.length > 0 ? `
                <div class="red-flags-section">
                    <h4>🚩 Red Flags</h4>
                    <ul class="red-flags-list">
                        ${analysis.redFlags.map(flag => `<li>${flag}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${analysis.recommendations && analysis.recommendations.length > 0 ? `
                <div class="recommendations-section">
                    <h4>💡 Recommendations</h4>
                    <ul class="recommendations-list">
                        ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${analysis.educationalTips && analysis.educationalTips.length > 0 ? `
                <div class="educational-section">
                    <h4>📚 Learn More</h4>
                    <ul class="educational-list">
                        ${analysis.educationalTips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="overlay-footer">
                <button class="share-btn" onclick="navigator.share ? navigator.share({title: 'MisinfoGuard Analysis', text: '${analysis.summary.replace(/'/g, '\\\'')}'}) : navigator.clipboard.writeText('${analysis.summary.replace(/'/g, '\\\'')}')">
                    📤 Share Analysis
                </button>
                <button class="learn-more-btn" onclick="window.open('https://www.stopfake.org/en/how-to-spot-fake-news/', '_blank')">
                    📖 Learn About Misinformation
                </button>
            </div>
        </div>
    `;
    
    analysisOverlay = overlay;
    document.body.appendChild(overlay);
    console.log('Analysis overlay added to DOM successfully');
}

// Show error overlay
function showErrorOverlay(errorMessage) {
    hideAnalysisOverlay();
    
    const overlay = createOverlay();
    overlay.innerHTML = `
        <div class="overlay-header">
            <h3>❌ Analysis Error</h3>
            <button class="close-btn" onclick="this.closest('.misinfoguard-overlay').remove()">×</button>
        </div>
        <div class="overlay-content">
            <div class="error-section">
                <p style="color: #ef4444; text-align: center; padding: 20px; font-size: 16px;">
                    ${errorMessage}
                </p>
                <div style="text-align: center;">
                    <button onclick="this.closest('.misinfoguard-overlay').remove()" 
                            style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    analysisOverlay = overlay;
    document.body.appendChild(overlay);
}

// Create overlay element
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'misinfoguard-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        width: 90vw;
        max-height: 85vh;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: fadeInScale 0.3s ease-out;
    `;
    
    return overlay;
}

// Hide analysis overlay
function hideAnalysisOverlay() {
    if (analysisOverlay) {
        analysisOverlay.remove();
        analysisOverlay = null;
    }
}

// Get risk color
function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case 'low': return '#10b981';
        case 'medium': return '#f59e0b';
        case 'high': return '#ef4444';
        default: return '#6b7280';
    }
}

// Format issue type
function formatIssueType(type) {
    return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}