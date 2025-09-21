# 🛡️ MisinfoGuard - AI-Powered Misinformation Detector

A browser extension that uses Google's Generative AI to detect potential misinformation and educate users on identifying credible content.

## 🎯 Features

- **Real-time Text Analysis**: Highlight any text on web pages to get instant misinformation analysis
- **AI-Powered Detection**: Uses Google's Generative AI (Gemini Pro) for sophisticated content analysis
- **Credibility Scoring**: Get numerical credibility scores (0-100%) for analyzed content
- **Educational Insights**: Learn why content might be misleading and how to spot similar issues
- **Risk Assessment**: Categorized risk levels (Low, Medium, High) with detailed explanations
- **Privacy-First**: Your API key is stored locally and never shared
- **Daily Statistics**: Track your fact-checking activity
- **Context Menu Integration**: Right-click selected text for quick analysis

## 🚀 Installation

### Step 1: Download the Extension
1. Download or clone this repository to your computer
2. Extract the files if downloaded as ZIP

### Step 2: Install in Chrome/Edge
1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the `misinformation-detector-extension` folder
5. The extension should now appear in your browser toolbar

### Step 3: Get Google Generative AI API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 4: Configure the Extension
1. Click the MisinfoGuard icon in your browser toolbar
2. Paste your API key in the setup field
3. Click "Save"
4. The extension is now ready to use!

## 📖 How to Use

### Method 1: Text Selection
1. Navigate to any webpage
2. Highlight any text you want to fact-check
3. Click the "Check with MisinfoGuard" button that appears
4. Review the detailed analysis in the popup overlay

### Method 2: Context Menu
1. Select text on any webpage
2. Right-click and select "Analyze with MisinfoGuard"
3. View the analysis results

### Understanding the Results

#### Credibility Score
- **80-100%**: Highly credible content
- **60-79%**: Moderately credible, some caution advised
- **40-59%**: Questionable credibility, verify with additional sources
- **0-39%**: High risk of misinformation, significant concerns identified

#### Risk Levels
- **🟢 LOW RISK**: Content appears credible with minor or no issues
- **🟡 MEDIUM RISK**: Some concerning elements, additional verification recommended
- **🔴 HIGH RISK**: Multiple red flags detected, likely misinformation

#### Analysis Components
- **Issues Identified**: Specific problems found in the content
- **Red Flags**: Warning signs of potential misinformation
- **Recommendations**: What you should do with this information
- **Educational Tips**: How to spot similar issues in the future

## ⚙️ Configuration

### Extension Settings
Access settings by clicking the MisinfoGuard icon:
- **Toggle Extension**: Enable/disable analysis features
- **Change API Key**: Update your Google AI API key
- **View Statistics**: See daily fact-checking activity

### API Key Management
- Your API key is stored locally in your browser
- The key is never transmitted to any servers except Google's AI API
- You can change or remove your key at any time
- The extension requires a valid API key to function

## 🔒 Privacy & Security

### Data Privacy
- **Local Storage**: API keys and settings are stored locally in your browser
- **No Data Collection**: We don't collect or store any of your browsed content
- **Direct API Calls**: Analysis requests go directly to Google's AI API
- **No Tracking**: No user tracking or analytics

### Security Features
- API key validation before use
- Secure communication with Google's AI services
- Content analysis happens in real-time (no permanent storage)
- Regular cache cleanup to prevent data accumulation

## 🛠️ Technical Details

### System Requirements
- Chrome 88+ or Edge 88+ (Manifest V3 support)
- Active internet connection for AI analysis
- Google Generative AI API key

### Architecture
- **Manifest V3**: Modern extension framework
- **Service Worker**: Background processing for API calls
- **Content Scripts**: Web page interaction and UI injection
- **Popup Interface**: Extension configuration and controls

### File Structure
```
misinformation-detector-extension/
├── manifest.json                 # Extension configuration
├── popup/                       # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/                     # Content scripts for web pages
│   ├── content.js
│   └── content.css
├── background/                  # Background service worker
│   └── background.js
├── icons/                       # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 🎓 Educational Component

### Learning About Misinformation
The extension doesn't just detect misinformation—it educates users about:
- Common misinformation techniques
- How to verify information sources
- Recognizing emotional manipulation
- Understanding bias and logical fallacies
- Building critical thinking skills

### Red Flags to Look For
- Emotional language designed to provoke strong reactions
- Claims without credible sources or citations
- Information that contradicts established facts
- Content from unverified or biased sources
- Logical fallacies and misleading statistics

## 🚨 Troubleshooting

### Common Issues

#### Extension Not Working
- Verify you have a valid API key entered
- Check your internet connection
- Ensure the extension is enabled in browser settings
- Try refreshing the webpage

#### API Key Issues
- Verify your API key is correct (no extra spaces)
- Check if your Google AI API quota is exceeded
- Ensure your Google Cloud project has the Generative AI API enabled

#### Analysis Not Appearing
- Make sure you're selecting enough text (minimum 10 characters)
- Check if the extension is enabled in the popup
- Try right-clicking and using the context menu option

#### Performance Issues
- The extension caches results to improve performance
- Complex analyses may take 5-10 seconds
- Very long text selections may be truncated

### Getting Help
1. Check the browser's extension error logs
2. Verify all files are properly loaded
3. Test with simple text selections first
4. Ensure your API key has proper permissions

## 🔄 Updates & Maintenance

### Regular Updates
- Monitor Google's Generative AI API for changes
- Update extension permissions as needed
- Improve analysis algorithms based on user feedback
- Add new educational content and features

### Cache Management
- The extension automatically cleans up old cached analyses
- Cache is limited to 100 recent analyses
- Cache expires after 24 hours
- All cache data is stored locally

## 📊 Contributing

### Feature Requests
- Enhanced source verification
- Multi-language support
- Integration with fact-checking databases
- Improved educational content
- Accessibility enhancements

### Development
1. Fork the repository
2. Create a feature branch
3. Test thoroughly with different content types
4. Submit a pull request with detailed description

## ⚖️ Legal & Ethical Considerations

### Disclaimer
- This tool provides AI-generated analysis for educational purposes
- Always verify important information with multiple reliable sources
- The extension's analysis should supplement, not replace, critical thinking
- Results may not be 100% accurate and should be used as guidance

### Responsible Use
- Use the tool to enhance critical thinking, not as absolute truth
- Encourage verification of important claims through multiple sources
- Respect content creators and publishers' rights
- Report false positives to improve the system

## 📞 Support

### Resources
- [Google AI Studio Documentation](https://ai.google.dev/)
- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/)
- [Fact-Checking Resources](https://www.poynter.org/ifcn/)

### Contact
For technical issues or feature requests, please create an issue in the repository.

---

**MisinfoGuard** - Empowering users to combat misinformation through AI-powered education and detection.

*Built for the Gen AI Hackathon - Creating tools for a more informed digital society.*