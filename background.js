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
        console.log('Background: Offscreen document already open.');
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
        console.log('Background: Offscreen document created.');
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'QR_CROP_DATA') {
        (async () => {
            console.log('Background: Received QR_CROP_DATA message.');
            try {
                await setupOffscreenDocument('offscreen.html');

                chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
                    if (chrome.runtime.lastError || !dataUrl) {
                        const errorMessage = 'Error: Could not capture tab.';
                        console.error('Background: Tab capture failed:', chrome.runtime.lastError || 'No dataUrl');
                        chrome.scripting.executeScript({
                            target: { tabId: sender.tab.id },
                            func: (message) => { alert(message); },
                            args: [errorMessage]
                        });
                        sendResponse({ error: errorMessage });
                        return;
                    }
                    console.log('Background: Tab captured, sending data to offscreen document.');
                    // Send the image data to the offscreen document for processing
                    // IMPORTANT: The response from sendMessage to an offscreen document is not directly the result
                    // but rather a confirmation that the message was sent. The actual result comes via another
                    // chrome.runtime.sendMessage from the offscreen document back to the service worker.
                    // We need to set up a listener for that.

                    // To handle the async response from the offscreen document, we need to use a Promise
                    // and resolve it when the offscreen document sends back the result.
                    const scanResultPromise = new Promise((resolve, reject) => {
                        const listener = (offscreenResponse) => {
                            if (offscreenResponse.type === 'QR_SCAN_RESULT' || offscreenResponse.type === 'QR_SCAN_ERROR') {
                                chrome.runtime.onMessage.removeListener(listener); // Remove listener after receiving response
                                resolve(offscreenResponse);
                            }
                        };
                        chrome.runtime.onMessage.addListener(listener);

                        // Send message to offscreen document
                        chrome.runtime.sendMessage({
                            type: 'SCAN_QR_CODE',
                            dataUrl: dataUrl,
                            crop: request.crop
                        });
                    });

                    const response = await scanResultPromise;
                    console.log('Background: Received response from offscreen document:', response);

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
                        console.error('Background: Unexpected response type from offscreen document:', response);
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
                console.error('Background: Error in QR_CROP_DATA handler:', error);
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