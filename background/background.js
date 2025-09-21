// Background service worker for MisinfoGuard extension

// Extension state
let extensionState = {
    apiKey: null,
    enabled: true,
    dailyStats: {},
    cache: new Map()
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
    console.log('MisinfoGuard extension installed');
    
    // Load stored data
    const stored = await chrome.storage.local.get(['apiKey', 'extensionEnabled', 'dailyStats']);
    extensionState.apiKey = stored.apiKey || null;
    extensionState.enabled = stored.extensionEnabled !== false;
    extensionState.dailyStats = stored.dailyStats || {};
    
    // Create context menu
    createContextMenu();
    
    // Clean up old cache entries
    cleanupCache();
});

// Create context menu for quick access
function createContextMenu() {
    chrome.contextMenus.removeAll(() => {
        if (extensionState.enabled && extensionState.apiKey) {
            chrome.contextMenus.create({
                id: 'analyze-text',
                title: 'Analyze with MisinfoGuard',
                contexts: ['selection']
            });
        }
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'analyze-text' && info.selectionText) {
        await analyzeSelectedText(info.selectionText, tab.id);
    }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.action) {
        case 'apiKeyUpdated':
            handleApiKeyUpdate(message.apiKey);
            break;
            
        case 'apiKeyRemoved':
            handleApiKeyRemoval();
            break;
            
        case 'toggleExtension':
            handleExtensionToggle(message.enabled);
            break;
            
        case 'analyzeText':
            handleTextAnalysis(message)
                .then(result => sendResponse({ success: true, result: result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep message channel open for async response
            
        case 'getExtensionState':
            sendResponse({
                enabled: extensionState.enabled,
                hasApiKey: !!extensionState.apiKey
            });
            break;
            
        case 'updateStats':
            updateDailyStats(message.type);
            break;
    }
});

// Handle API key updates
async function handleApiKeyUpdate(apiKey) {
    extensionState.apiKey = apiKey;
    extensionState.enabled = true;
    
    await chrome.storage.local.set({ 
        apiKey: apiKey,
        extensionEnabled: true 
    });
    
    createContextMenu();
    notifyAllTabs('extensionStateChanged', { enabled: true, hasApiKey: true });
}

// Handle API key removal
async function handleApiKeyRemoval() {
    extensionState.apiKey = null;
    extensionState.enabled = false;
    
    await chrome.storage.local.remove(['apiKey']);
    await chrome.storage.local.set({ extensionEnabled: false });
    
    chrome.contextMenus.removeAll();
    notifyAllTabs('extensionStateChanged', { enabled: false, hasApiKey: false });
}

// Handle extension toggle
async function handleExtensionToggle(enabled) {
    extensionState.enabled = enabled;
    await chrome.storage.local.set({ extensionEnabled: enabled });
    
    if (enabled && extensionState.apiKey) {
        createContextMenu();
    } else {
        chrome.contextMenus.removeAll();
    }
    
    notifyAllTabs('extensionStateChanged', { enabled, hasApiKey: !!extensionState.apiKey });
}

// Handle text analysis requests
async function handleTextAnalysis(message) {
    if (!extensionState.enabled || !extensionState.apiKey) {
        throw new Error('Extension is not properly configured');
    }
    
    try {
        const analysis = await analyzeTextWithAI(message.text, message.context);
        
        // Update stats
        updateDailyStats('check');
        if (analysis.credibilityScore < 0.6) {
            updateDailyStats('warning');
        }
        
        return analysis;
    } catch (error) {
        console.error('Analysis error:', error);
        throw new Error('Failed to analyze text. Please try again.');
    }
}

// Analyze text with Google Generative AI
async function analyzeTextWithAI(text, context = {}) {
    // Check cache first
    const cacheKey = generateCacheKey(text);
    if (extensionState.cache.has(cacheKey)) {
        return extensionState.cache.get(cacheKey);
    }
    
    const prompt = generateAnalysisPrompt(text, context);
    console.log('Generated prompt for AI:', prompt);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${extensionState.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1000,
                }
            })
        });
        console.log('AI response received:', response);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('AI response data:', data);
        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('Generated text from AI:', generatedText);
        // Parse the AI response
        const analysis = parseAIResponse(generatedText);
        console.log('Parsed analysis:', analysis);
        // Cache the result
        extensionState.cache.set(cacheKey, analysis);
        console.log('Analysis cached with key:', cacheKey);
        return analysis;
        
    } catch (error) {
        console.error('AI API error:', error);
        throw new Error('Failed to get AI analysis');
    }
}

// Generate analysis prompt for AI
function generateAnalysisPrompt(text, context) {
    return `You are an expert fact-checker and misinformation analyst. Analyze the following text for potential misinformation, bias, and credibility issues.

Text to analyze: "${text}"

Context: ${context.url ? `URL: ${context.url}` : 'No additional context'}

Please provide your analysis in the following JSON format:
{
    "credibilityScore": [0-1 score where 1 is highly credible],
    "riskLevel": ["low", "medium", "high"],
    "issues": [
        {
            "type": ["factual_error", "bias", "emotional_manipulation", "missing_context", "unverified_claim", "logical_fallacy"],
            "description": "Brief description of the issue",
            "severity": ["low", "medium", "high"]
        }
    ],
    "redFlags": [
        "List of specific red flags found"
    ],
    "summary": "Brief summary of the analysis",
    "recommendations": [
        "Specific recommendations for the user"
    ],
    "educationalTips": [
        "Tips to help users identify similar issues in the future"
    ]
}

Focus on:
1. Factual accuracy and verifiability
2. Emotional manipulation techniques
3. Logical fallacies
4. Missing context or cherry-picked information
5. Source credibility indicators
6. Language patterns common in misinformation

Be thorough but concise. Provide educational value to help users become better at identifying misinformation.`;
}

// Parse AI response into structured data
function parseAIResponse(responseText) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate and normalize the response
            return {
                credibilityScore: Math.max(0, Math.min(1, parsed.credibilityScore || 0.5)),
                riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
                issues: Array.isArray(parsed.issues) ? parsed.issues : [],
                redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
                summary: parsed.summary || 'Analysis completed',
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                educationalTips: Array.isArray(parsed.educationalTips) ? parsed.educationalTips : [],
                timestamp: Date.now()
            };
        }
    } catch (error) {
        console.error('Error parsing AI response:', error);
    }
    
    // Fallback response if parsing fails
    return {
        credibilityScore: 0.5,
        riskLevel: 'medium',
        issues: [{
            type: 'analysis_error',
            description: 'Unable to complete full analysis',
            severity: 'medium'
        }],
        redFlags: [],
        summary: 'Analysis incomplete due to technical issues',
        recommendations: ['Please try again or manually verify this information'],
        educationalTips: ['Always cross-reference information with multiple reliable sources'],
        timestamp: Date.now()
    };
}

// Generate cache key for text
function generateCacheKey(text) {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

// Clean up old cache entries
function cleanupCache() {
    const maxCacheSize = 100;
    const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    // Remove old entries
    for (const [key, value] of extensionState.cache.entries()) {
        if (now - value.timestamp > maxCacheAge) {
            extensionState.cache.delete(key);
        }
    }
    
    // Limit cache size
    if (extensionState.cache.size > maxCacheSize) {
        const entries = Array.from(extensionState.cache.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        
        extensionState.cache.clear();
        entries.slice(0, maxCacheSize).forEach(([key, value]) => {
            extensionState.cache.set(key, value);
        });
    }
}

// Update daily statistics
async function updateDailyStats(type) {
    const today = new Date().toDateString();
    
    if (!extensionState.dailyStats[today]) {
        extensionState.dailyStats[today] = { checks: 0, warnings: 0 };
    }
    
    if (type === 'check') {
        extensionState.dailyStats[today].checks++;
    } else if (type === 'warning') {
        extensionState.dailyStats[today].warnings++;
    }
    
    // Save to storage
    await chrome.storage.local.set({ dailyStats: extensionState.dailyStats });
    
    // Notify popup if open
    try {
        chrome.runtime.sendMessage({
            action: 'updateStats',
            stats: extensionState.dailyStats
        });
    } catch (error) {
        // Popup might not be open, ignore error
    }
}

// Notify all tabs of state changes
async function notifyAllTabs(action, data) {
    try {
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action, ...data })
                .catch(() => {}); // Ignore errors for tabs without content script
        });
    } catch (error) {
        console.error('Error notifying tabs:', error);
    }
}

// Analyze selected text (triggered from context menu)
async function analyzeSelectedText(text, tabId) {
    try {
        const analysis = await analyzeTextWithAI(text);
        
        // Send result to content script
        chrome.tabs.sendMessage(tabId, {
            action: 'showAnalysisResult',
            analysis: analysis,
            originalText: text
        });
        
    } catch (error) {
        console.error('Error analyzing selected text:', error);
        chrome.tabs.sendMessage(tabId, {
            action: 'showError',
            error: 'Failed to analyze selected text'
        });
    }
}

// Periodic cleanup
setInterval(cleanupCache, 60 * 60 * 1000); // Run every hour