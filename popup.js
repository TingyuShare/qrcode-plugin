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
  const scanBtn = document.getElementById('scanBtn');
  const resultDiv = document.getElementById('result');
  let tabUrl = '';

  // Get current tab URL and generate initial QR code
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      tabUrl = tabs[0].url;
      generateQRCode(tabUrl);
      customTextInput.placeholder = tabUrl;
    } else {
      const fallbackText = "Unable to fetch current URL";
      generateQRCode(fallbackText);
      customTextInput.placeholder = fallbackText;
    }
  });

  // Real-time QR code generation on input
  customTextInput.addEventListener('input', function() {
    const textToEncode = customTextInput.value.trim();
    if (textToEncode) {
      generateQRCode(textToEncode);
    } else {
      if (tabUrl) {
        generateQRCode(tabUrl);
      }
    }
  });

  // When the scan button is clicked, inject the cropping scripts
  scanBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) {
        resultDiv.textContent = "Could not find active tab.";
        return;
      }
      
      // Inject CSS and the content script
      chrome.scripting.insertCSS({
        target: { tabId: activeTab.id },
        files: ['cropper.css']
      }, () => {
        if (chrome.runtime.lastError) {
            resultDiv.textContent = "Error injecting CSS: " + chrome.runtime.lastError.message;
            return;
        }
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['cropper.js']
        }, () => {
            if (chrome.runtime.lastError) {
                resultDiv.textContent = "Error injecting script: " + chrome.runtime.lastError.message;
                return;
            }
            // The popup will close automatically when the user clicks away from it.
            // Programmatically closing it here can cause race conditions and errors in Firefox.
            // window.close();
        });
      });
    });
  });
});
