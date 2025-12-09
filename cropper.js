(function() {
  if (window.qrCropperInjected) {
    return;
  }
  window.qrCropperInjected = true;

  const overlay = document.createElement('div');
  overlay.id = 'qr-scanner-overlay';
  document.body.appendChild(overlay);

  let startX, startY, selectionBox;

  function handleMouseDown(e) {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    selectionBox = document.createElement('div');
    selectionBox.id = 'qr-scanner-selection';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    overlay.appendChild(selectionBox);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e) {
    let currentX = e.clientX;
    let currentY = e.clientY;
    let width = currentX - startX;
    let height = currentY - startY;
    if (width < 0) {
      selectionBox.style.left = currentX + 'px';
      selectionBox.style.width = -width + 'px';
    } else {
      selectionBox.style.width = width + 'px';
    }
    if (height < 0) {
      selectionBox.style.top = currentY + 'px';
      selectionBox.style.height = -height + 'px';
    } else {
      selectionBox.style.height = height + 'px';
    }
  }

  function handleMouseUp(e) {
    const rect = selectionBox.getBoundingClientRect();
    overlay.remove();
    window.qrCropperInjected = false;

    if (rect.width === 0 || rect.height === 0) return;

    // Use devicePixelRatio to ensure coordinates are correct for the screenshot
    const dpr = window.devicePixelRatio || 1;
    chrome.runtime.sendMessage({
      type: 'QR_CROP_DATA',
      crop: {
        x: rect.left * dpr,
        y: rect.top * dpr,
        width: rect.width * dpr,
        height: rect.height * dpr
      }
    });
  }

  overlay.addEventListener('mousedown', handleMouseDown);
})();
