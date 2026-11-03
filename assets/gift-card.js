/**
 * Gift card: draws the QR code, copies the code, prints the card. Every action
 * is optional, so the page still reads without JavaScript.
 */

const copyButton = document.querySelector('[data-gift-card-copy]');
const printButton = document.querySelector('[data-gift-card-print]');
const code = document.querySelector('[data-gift-card-code]');
const qr = document.querySelector('[data-gift-card-qr]');

if (qr && window.QRCode) {
  new QRCode(qr, {
    text: qr.dataset.giftCardQr,
    width: 140,
    height: 140,
    colorDark: '#1f1a17',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
}

if (copyButton && code) {
  copyButton.addEventListener('click', async () => {
    const value = code.textContent.trim();

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }

    copyButton.textContent = copyButton.dataset.copiedLabel;
    setTimeout(() => {
      copyButton.textContent = copyButton.dataset.copyLabel;
    }, 2000);
  });
}

printButton?.addEventListener('click', () => window.print());
