// The ZXing library is loaded before this script via the manifest.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'QR_CROP_DATA') {
        // The library should be available now in the global scope (self).
        if (typeof ZXing === 'undefined') {
            alert('Scan failed: ZXing library not loaded.');
            return;
        }

        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError || !dataUrl) {
                alert('Error: Could not capture tab.');
                return;
            }

            const image = new Image();
            image.onload = function() {
                try {
                    const cropCanvas = document.createElement('canvas');
                    cropCanvas.width = request.crop.width;
                    cropCanvas.height = request.crop.height;
                    const cropCtx = cropCanvas.getContext('2d');

                    cropCtx.drawImage(
                        image,
                        request.crop.x, request.crop.y,
                        request.crop.width, request.crop.height,
                        0, 0,
                        request.crop.width, request.crop.height
                    );

                    // Use the core ZXing library functions directly
                    const luminanceSource = new ZXing.HTMLCanvasElementLuminanceSource(cropCanvas);
                    const hybridBinarizer = new ZXing.HybridBinarizer(luminanceSource);
                    const binaryBitmap = new ZXing.BinaryBitmap(hybridBinarizer);
                    
                    const qrReader = new ZXing.QRCodeReader();
                    const result = qrReader.decode(binaryBitmap);

                    const resultText = result.getText();
                    chrome.scripting.executeScript({
                        target: { tabId: sender.tab.id },
                        func: (message) => { alert(message); },
                        args: [resultText]
                    });

                } catch (err) {
                    // The 'decode' method throws an error if no QR code is found.
                    chrome.scripting.executeScript({
                        target: { tabId: sender.tab.id },
                        func: (message) => { alert(message); },
                        args: ['No QR code found in selection.']
                    });
                }
            };
            image.onerror = function() {
                chrome.scripting.executeScript({
                    target: { tabId: sender.tab.id },
                    func: (message) => { alert(message); },
                    args: ['Failed to load captured image for scanning.']
                });
            };
            image.src = dataUrl;
        });
    }
    return true; // Keep message channel open for async response
});

