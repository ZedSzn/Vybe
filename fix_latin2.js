const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// Line 817 garbled globe: exact codepoints U+00F0 U+0178 U+0152 U+008D
const garbledGlobe = 'ðŸŒ';
const beforeCount = (c.match(new RegExp(garbledGlobe, 'g')) || []).length;
c = c.split(garbledGlobe).join('');
console.log('Garbled globes removed:', beforeCount);

// Also check for arrows in the camera error strings (lines 487, 489)
// Show those lines to see their actual content first
const lines = c.split('\n');
[486, 487, 488, 489, 587].forEach(i => {
  if (lines[i]) console.log(`Line ${i+1}:`, JSON.stringify(lines[i].trim().slice(0,100)));
});

fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');

const v = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');
const l817 = v.split('\n')[816];
console.log('\nLine 817 after fix:', JSON.stringify(l817.trim().slice(0,60)));
console.log('Globe removed:', !v.includes(garbledGlobe) ? 'OK' : 'FAIL');
