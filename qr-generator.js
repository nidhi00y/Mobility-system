const QRCode = require('qrcode');

const url = process.argv[2] || 'https://your-car-app.com';

QRCode.toFile('qr-code.png', url, { width: 400 }, (err) => {
  if (err) {
    console.error('Failed to generate QR code:', err);
    process.exit(1);
  }

  console.log(`QR code generated for: ${url}`);
  console.log('Saved as qr-code.png');
});
