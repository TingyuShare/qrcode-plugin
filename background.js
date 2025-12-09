importScripts('index.min.js'); // Keep this for potential other uses or if ZXing is needed directly in SW for other features

let offscreenCreating; // A global promise to avoid concurrency issues

async function setupOffscreenDocument(path) {
    // Check if an offscreen document is already open
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
        return; // An offscreen document is already open
    }

    // Create a new offscreen document
    if (offscreenCreating) {
        await offscreenCreating;
    } else {
        offscreenCreating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['CLIPBOARD'], // Use a relevant reason, e.g., 'CLIPBOARD' or 'DOM_SCRAPING'
            justification: 'Needed for QR code scanning with DOM access',
        });
        await offscreenCreating;
        offscreenCreating = null;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'QR_CROP_DATA') {
        (async () => {
            try {
                await setupOffscreenDocument('offscreen.html');

                chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
                    if (chrome.runtime.lastError || !dataUrl) {
                        const errorMessage = 'Error: Could not capture tab.';
                        chrome.scripting.executeScript({
                            target: { tabId: sender.tab.id },
                            func: (message) => { alert(message); },
                            args: [errorMessage]
                        });
                        sendResponse({ error: errorMessage });
                        return;
                    }

                    // Send the image data to the offscreen document for processing
                    const response = await chrome.runtime.sendMessage({
                        type: 'SCAN_QR_CODE',
                        dataUrl: dataUrl,
                        crop: request.crop
                    });

                    if (response && response.type === 'QR_SCAN_RESULT') {
                        chrome.scripting.executeScript({
                            target: { tabId: sender.tab.id },
                            func: (message) => {
                                alert(message);
                                try {
                                    navigator.clipboard.writeText(message).then(() => {
                                        console.log('QR code result copied to clipboard!');
                                    }).catch(err => {
                                        console.error('Failed to copy QR code result to clipboard:', err);
                                    });
                                } catch (err) {
                                    console.error('Clipboard API not available or failed:', err);
                                }
                            },
                            args: [response.result]
                        });
                        sendResponse({ success: true });
                    } else if (response && response.type === 'QR_SCAN_ERROR') {
                        chrome.scripting.executeScript({
                            target: { tabId: sender.tab.id },
                            func: (message) => { alert(message); },
                            args: [response.error]
                        });
                        sendResponse({ error: response.error });
                    } else {
                        const errorMessage = 'Unknown response from offscreen document.';
                        chrome.scripting.executeScript({
                            target: { tabId: sender.tab.id },
                            func: (message) => { alert(message); },
                            args: [errorMessage]
                        });
                        sendResponse({ error: errorMessage });
                    }
                });
            } catch (error) {
                const errorMessage = `Background script error: ${error.message}`;
                chrome.scripting.executeScript({
                    target: { tabId: sender.tab.id },
                    func: (message) => { alert(message); },
                    args: [errorMessage]
                });
                sendResponse({ error: errorMessage });
            }
        })();
        return true; // Keep message channel open for async response
    }
});