// Content script for MisinfoGuard extension
console.log('🛡️ MisinfoGuard content script starting...');
console.log('Current URL:', window.location.href);
console.log('Document ready state:', document.readyState);

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
    
    // Check extension state with background script
    chrome.runtime.sendMessage({ action: 'getExtensionState' }, (response) => {
        console.log('Extension state response:', response);
        
        if (chrome.runtime.lastError) {
            console.error('Error communicating with background script:', chrome.runtime.lastError);
            return;
        }
        
        if (response) {
            extensionState = { ...extensionState, ...response };
            console.log('Updated extension state:', extensionState);
            
            if (extensionState.enabled) {
                console.log('Extension enabled, setting up event listeners');
                setupEventListeners();
            } else {
                console.log('Extension not enabled');
            }
        } else {
            console.log('No response from background script');
        }
    });
})();

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
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
    
    // Check if extension is enabled
    if (!extensionState.enabled) {
        console.log('Extension not enabled');
        return;
    }
    
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
    console.log('showQuickAnalyzeButton called with:', { rect, textLength: text.length });
    
    hideQuickAnalyzeButton(); // Remove existing button
    
    quickAnalyzeButton = document.createElement('div');
    quickAnalyzeButton.id = 'misinfoguard-quick-button';
    quickAnalyzeButton.innerHTML = `
        <div class="quick-analyze-btn">
            <span class="icon">🛡️</span>
            <span class="text">Check with MisinfoGuard</span>
        </div>
    `;
    
    // Position the button
    const buttonTop = rect.bottom + window.scrollY + 5;
    const buttonLeft = Math.min(rect.left + window.scrollX, window.innerWidth - 250);
    
    console.log('Button position:', { top: buttonTop, left: buttonLeft });
    
    quickAnalyzeButton.style.cssText = `
        position: absolute;
        top: ${buttonTop}px;
        left: ${buttonLeft}px;
        z-index: 10000;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        border-radius: 10px;
        padding: 0;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: fadeInUp 0.3s ease-out;
        border: none;
        outline: none;
        min-width: 280px;
    `;
    
    quickAnalyzeButton.querySelector('.quick-analyze-btn').style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 20px;
        border: none;
        background: none;
        color: inherit;
        font-size: 15px;
        font-weight: 600;
        white-space: nowrap;
        min-height: 48px;
    `;
    
    // Add click handler
    quickAnalyzeButton.addEventListener('click', (e) => {
        console.log('Quick analyze button clicked!');
        e.stopPropagation();
        analyzeSelectedText(text);
    });
    
    // Add hover effects
    quickAnalyzeButton.addEventListener('mouseenter', () => {
        quickAnalyzeButton.style.transform = 'translateY(-2px)';
        quickAnalyzeButton.style.boxShadow = '0 8px 25px rgba(79, 70, 229, 0.5)';
    });
    
    quickAnalyzeButton.addEventListener('mouseleave', () => {
        quickAnalyzeButton.style.transform = 'translateY(0)';
        quickAnalyzeButton.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.4)';
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
        hideAnalysisOverlay();
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
                    <ul class="issues-list">
                        ${analysis.issues.map(issue => `
                            <li class="issue-item ${issue.severity}">
                                <span class="issue-type">${formatIssueType(issue.type)}</span>
                                <span class="issue-description">${issue.description}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            
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
            <div class="error-message">
                <p>${errorMessage}</p>
                <button class="retry-btn" onclick="this.closest('.misinfoguard-overlay').remove()">Try Again</button>
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

// Listen for messages from background script (duplicate handler - removing to clean up)
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        
        .misinfoguard-overlay * {
            box-sizing: border-box;
        }
        
        .misinfoguard-overlay .overlay-header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 20px 24px;
            border-radius: 16px 16px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .misinfoguard-overlay .overlay-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        
        .misinfoguard-overlay .close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 22px;
            font-weight: bold;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .misinfoguard-overlay .close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .misinfoguard-overlay .overlay-content {
            padding: 24px;
        }
        
        .misinfoguard-overlay .loading-section {
            text-align: center;
            padding: 32px 24px;
        }
        
        .misinfoguard-overlay .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #4f46e5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .misinfoguard-overlay .analyzed-text {
            background: #f9fafb;
            padding: 18px;
            border-radius: 10px;
            margin-top: 18px;
            text-align: left;
        }
        
        .misinfoguard-overlay .analysis-summary {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 24px;
            margin-bottom: 24px;
            align-items: center;
        }
        
        .misinfoguard-overlay .credibility-score {
            text-align: center;
        }
        
        .misinfoguard-overlay .score-circle {
            width: 90px;
            height: 90px;
            border: 4px solid;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
        }
        
        .misinfoguard-overlay .score-number {
            font-size: 20px;
            font-weight: bold;
        }
        
        .misinfoguard-overlay .score-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .misinfoguard-overlay .risk-level {
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        
        .misinfoguard-overlay .issues-section,
        .misinfoguard-overlay .red-flags-section,
        .misinfoguard-overlay .recommendations-section,
        .misinfoguard-overlay .educational-section {
            margin-bottom: 24px;
        }
        
        .misinfoguard-overlay h4 {
            margin: 0 0 14px 0;
            font-size: 17px;
            font-weight: 600;
            color: #374151;
        }
        
        .misinfoguard-overlay ul {
            margin: 0;
            padding-left: 0;
            list-style: none;
        }
        
        .misinfoguard-overlay li {
            padding: 12px 16px;
            margin-bottom: 8px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 3px solid #e5e7eb;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .misinfoguard-overlay .issue-item.high {
            border-left-color: #ef4444;
            background: #fef2f2;
        }
        
        .misinfoguard-overlay .issue-item.medium {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }
        
        .misinfoguard-overlay .issue-item.low {
            border-left-color: #10b981;
            background: #f0fdf4;
        }
        
        .misinfoguard-overlay .issue-type {
            font-weight: 600;
            color: #374151;
            display: block;
            margin-bottom: 4px;
            font-size: 14px;
        }
        
        .misinfoguard-overlay .overlay-footer {
            display: flex;
            gap: 12px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .misinfoguard-overlay .overlay-footer button {
            flex: 1;
            padding: 12px 18px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            min-height: 44px;
        }
        
        .misinfoguard-overlay .overlay-footer button:hover {
            background: #f9fafb;
            border-color: #9ca3af;
        }
        
        .misinfoguard-overlay .error-message {
            text-align: center;
            padding: 32px 24px;
        }
        
        .misinfoguard-overlay .retry-btn {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            margin-top: 18px;
            font-size: 14px;
            min-height: 44px;
        }
    `;
    
    document.head.appendChild(styleSheet);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'extensionStateChanged':
            extensionState.enabled = message.enabled;
            extensionState.hasApiKey = message.hasApiKey;
            
            if (extensionState.enabled && extensionState.hasApiKey) {
                setupEventListeners();
            } else {
                hideQuickAnalyzeButton();
                hideAnalysisOverlay();
            }
            break;
            
        case 'showAnalysisResult':
            showAnalysisResult(message.analysis, message.originalText);
            break;
            
        case 'showError':
            showErrorOverlay(message.error);
            break;
    }
});