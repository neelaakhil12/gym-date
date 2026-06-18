const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // Check PNG signature
    if (buffer.readUInt32BE(0) !== 0x89504E47 || buffer.readUInt32BE(4) !== 0x0D0A1A0A) {
      return 'Not a valid PNG';
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return `${width}x${height}`;
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

const assetsDir = path.join(__dirname, '../gymdate-app/assets');
const files = fs.readdirSync(assetsDir);
files.forEach(file => {
  if (file.endsWith('.png')) {
    const size = fs.statSync(path.join(assetsDir, file)).size;
    console.log(`${file}: ${getPngDimensions(path.join(assetsDir, file))} (${size} bytes)`);
  }
});
