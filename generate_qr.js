const QRCode = require('qrcode');

QRCode.toFile('public/test-qr.png', 'BRC-MR-TEST', {
  color: {
    dark: '#000000',  
    light: '#ffffff' 
  }
}, function (err) {
  if (err) throw err;
  console.log('done');
});
