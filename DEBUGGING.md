# Debugging Guide for MisinfoGuard Extension

## Issue: Save Button Not Working

### Step 1: Check Browser Console
1. Open the extension popup
2. Right-click anywhere in the popup and select "Inspect" or "Inspect Element"
3. Go to the "Console" tab
4. Try clicking the Save button
5. Look for any error messages or debug logs

### Step 2: Expected Console Output
You should see these debug messages when clicking Save:
```
DOM loaded, popup initializing...
Setup section: [object HTMLDivElement]
API key input: [object HTMLInputElement]
Save button: [object HTMLButtonElement]
Adding immediate event listeners...
Save button clicked!
API key length: [number]
Showing loading section
Validating API key...
API key valid: true/false
Saving API key to storage...
Verified storage: {apiKey: "your-key-here"}
Loading main interface...
```

### Step 3: Common Issues and Solutions

#### Issue 1: Elements Not Found
If you see "Save button not found!" or similar:
- Check that the HTML IDs match the JavaScript selectors
- Ensure the popup.html loads correctly

#### Issue 2: API Validation Fails
If validation keeps failing:
- Check your internet connection
- Verify the API key is correct
- The extension now allows proceeding even if validation has network issues

#### Issue 3: Storage Permission Issues
If storage fails:
- Ensure the extension has proper permissions in manifest.json
- Try reloading the extension in chrome://extensions/

### Step 4: Manual Testing
Try this in the console:
```javascript
// Test if elements exist
console.log('API Input:', document.getElementById('api-key-input'));
console.log('Save Button:', document.getElementById('save-key-btn'));

// Test storage directly
chrome.storage.local.set({test: 'value'}).then(() => {
    console.log('Storage works!');
    chrome.storage.local.get('test').then(result => {
        console.log('Retrieved:', result);
    });
});
```

### Step 5: Simplified Testing
For testing, you can temporarily:
1. Enter any text as API key (minimum 20 characters)
2. The extension will now proceed even if API validation fails
3. Check if the interface switches to the main section

### Step 6: If Still Not Working
1. Try reloading the extension:
   - Go to chrome://extensions/
   - Click the reload button for MisinfoGuard
   - Try again

2. Check extension permissions:
   - Ensure "storage" permission is granted
   - Check if popup can access chrome APIs

3. Try a fresh installation:
   - Remove the extension
   - Add it again from the folder

### Step 7: Alternative Testing
Create a minimal test by adding this to popup.html temporarily:
```html
<button onclick="console.log('Direct click works!')">Test Button</button>
```

If this works but the Save button doesn't, there's a JavaScript binding issue.

## Quick Fix for Testing
If you just want to test the extension functionality:
1. Open popup console
2. Run: `chrome.storage.local.set({apiKey: 'test-key-for-debugging-purposes-only'})`
3. Reload the popup
4. It should show the main interface

This helps bypass the save functionality to test the rest of the extension.