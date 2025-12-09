// offscreen.js

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'SCAN_QR_CODE') {
        const { dataUrl, crop } = message;

        try {
            const resultText = await scanQRCode(dataUrl, crop);
            chrome.runtime.sendMessage({ type: 'QR_SCAN_RESULT', result: resultText });
        } catch (error) {
            chrome.runtime.sendMessage({ type: 'QR_SCAN_ERROR', error: error.message });
        }
    }
});

async function scanQRCode(dataUrl, crop) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = function() {
            try {
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = crop.width;
                cropCanvas.height = crop.height;
                const cropCtx = cropCanvas.getContext('2d');

                cropCtx.drawImage(
                    image,
                    crop.x, crop.y,
                    crop.width, crop.height,
                    0, 0,
                    crop.width, crop.height
                );

                // Use the core ZXing library functions directly
                // Ensure ZXing is loaded via index.min.js in offscreen.html
                if (typeof ZXing === 'undefined') {
                    throw new Error('ZXing library not loaded in offscreen document.');
                }

                const luminanceSource = new ZXing.HTMLCanvasElementLuminanceSource(cropCanvas);
                const hybridBinarizer = new ZXing.HybridBinarizer(luminanceSource);
                const binaryBitmap = new ZXing.BinaryBitmap(hybridBinarizer);
                
                const qrReader = new ZXing.QRCodeReader();
                const result = qrReader.decode(binaryBitmap);

                resolve(result.getText());

            } catch (err) {
                reject(new Error('No QR code found in selection.'));
            }
        };
        image.onerror = function() {
            reject(new Error('Failed to load captured image for scanning.'));
        };
        image.src = dataUrl;
    });
}