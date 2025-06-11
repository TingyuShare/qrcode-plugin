# QR Code Generator - Firefox Extension

This is a simple Firefox browser extension that allows you to quickly generate a QR code for the current page's URL or for any custom text you input.

## Features

*   **Current Page QR Code**: Automatically generates a QR code for the URL of the active tab when you open the extension popup.
*   **Custom Text QR Code**: Provides an input field where you can type or paste any text (URL, message, etc.) to generate a custom QR code.
*   **Instant Generation**: QR codes are generated on the fly.
*   **Lightweight**: Minimalistic design and no unnecessary permissions.

## Installation

1.  **Download the Extension Files**:
    *   Clone this repository or download the files as a ZIP.
    *   Ensure you have all the necessary files:
        *   `manifest.json`
        *   `popup.html`
        *   `popup.js`
        *   `qrcode.min.js` (Download from [here](https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js) if you haven't already)
        *   An `icons` folder containing `icon-48.png` (a 48x48px icon for the extension).

2.  **Load the Extension in Firefox**:
    *   Open Firefox.
    *   Type `about:debugging` in the address bar and press Enter.
    *   Click on "This Firefox" (or "This Nightly"/"This Developer Edition" depending on your Firefox version).
    *   Click on "Load Temporary Add-on...".
    *   Navigate to the directory where you saved the extension files and select the `manifest.json` file.

## Usage

1.  Once installed, you will see the QR Code Generator icon in your Firefox toolbar.
2.  Click the icon to open the popup.
3.  By default, a QR code for the current tab's URL will be displayed.
4.  To generate a QR code for custom text:
    *   Type or paste your desired text into the input field.
    *   Click the "Generate Custom QR" button, or simply press Enter.
5.  The QR code will update to reflect your custom text.

## Files

*   `manifest.json`: Defines the extension's properties, permissions, and UI elements.
*   `popup.html`: The HTML structure for the extension's popup window.
*   `popup.js`: The JavaScript logic for fetching the current URL, handling user input, and generating QR codes using `qrcode.min.js`.
*   `qrcode.min.js`: The QRCode.js library used for generating QR codes.
*   `icons/icon-48.png`: The icon displayed in the Firefox toolbar.

## Library Used

*   [QRCode.js](https://github.com/davidshimjs/qrcodejs) by davidshimjs