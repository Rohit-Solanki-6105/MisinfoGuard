# Icon Creation Instructions

## Required Icon Sizes
You need to create PNG icons in the following sizes:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Design Concept
The icon should represent a shield with AI/technology elements, using the color scheme from the extension.

## Quick Creation Methods

### Method 1: Online SVG Converter
1. Use the `icon-template.svg` file in this folder
2. Go to svgtopng.com or similar online converter
3. Upload the SVG and convert to PNG at each required size
4. Download and rename files appropriately

### Method 2: AI Image Generator
Use this prompt with AI image generators (DALL-E, Midjourney, etc.):
```
Create a modern app icon for a browser extension called MisinfoGuard. 
Design: Purple and blue gradient shield with white checkmark, 
small AI eye symbol, clean minimalist style, 
suitable for browser extension, 128x128 pixels, 
high contrast, professional look
```

### Method 3: Design Tools
- **Canva**: Use custom dimensions, create shield shape with gradients
- **Figma**: Vector design with proper scaling
- **Adobe Illustrator**: Professional vector design

## Design Guidelines
- Primary color: Linear gradient from #4f46e5 to #7c3aed
- Shield shape as main element
- White/light accents for contrast
- Simple, recognizable at small sizes
- Optional: AI eye, checkmark, or magnifying glass elements

## Alternative Design Ideas
1. Shield + Magnifying glass (detection theme)
2. Shield + Warning triangle (alert theme)  
3. Brain + Shield (AI protection theme)
4. Eye + Shield (monitoring theme)
5. Checkmark + Shield (verification theme)

## File Placement
Place all created PNG files in this `icons/` folder:
```
icons/
├── icon16.png
├── icon32.png
├── icon48.png
├── icon128.png
└── icon-template.svg (reference)
```

## Testing
After creating icons, test them by:
1. Loading the extension in Chrome Developer Mode
2. Checking the extension appears with proper icon in toolbar
3. Verifying icon appears correctly in Extensions page
4. Testing on different display scales (high DPI screens)