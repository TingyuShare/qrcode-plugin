function generateQRCode(text) {
  const qrcodeContainer = document.getElementById('qrcode');
  qrcodeContainer.innerHTML = ''; // Clear previous QR code
  new QRCode(qrcodeContainer, {
    text: text,
    width: 200,
    height: 200,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const customTextInput = document.getElementById('customText');
  const generateQrButton = document.getElementById('generateQrButton');

  // Get current tab URL and generate QR code
  browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      generateQRCode(tabs[0].url);
      customTextInput.placeholder = tabs[0].url;
    } else {
        // Fallback if URL can't be fetched (e.g., new tab page)
        generateQRCode("Unable to fetch current URL");
    }
  });

  generateQrButton.addEventListener('click', function() {
    const textToEncode = customTextInput.value.trim();
    if (textToEncode) {
      generateQRCode(textToEncode);
    } else {
      // If input is empty, try to use current tab URL again
      browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url) {
          generateQRCode(tabs[0].url);
        }
      });
    }
  });

  // Optional: Regenerate QR if text is entered and enter is pressed
  customTextInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const textToEncode = customTextInput.value.trim();
      if (textToEncode) {
        generateQRCode(textToEncode);
      }
    }
  });
});