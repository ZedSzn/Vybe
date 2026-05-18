const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// Garbled globe emoji before "Any country" — remove it
c = c.replace(/ð\s*/g, '');
// Also try the raw bytes as they appear in the string
c = c.split('ð').join('');

// Garbled rightwards arrow (â†') — replace with >
const garbledRight = 'â';
c = c.split(garbledRight).join('>');

// Garbled downwards arrow (â†") — remove
const garbledDown = 'â';
c = c.split(garbledDown).join('');

fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');

const v = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');
const line817 = v.split('\n').find(l => l.includes('Any country'));
console.log('Any country line:', line817 ? line817.trim().slice(0, 80) : 'not found');
console.log('Garbled chars gone:', !v.includes('ð') && !v.includes(garbledRight) ? 'OK' : 'check manually');
