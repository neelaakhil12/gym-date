const fs = require('fs');

function checkTransparency(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // Find IDAT or color type in IHDR
    // IHDR starts at byte 12 (length), chunk type is at 16, content at 20.
    // Color type is at byte 25 (0-based relative to file start: 8 signature + 4 length + 4 IHDR + 9 IHDR fields)
    // Relative to buffer: 8 + 4 + 4 + 9 = 25
    const colorType = buffer.readUInt8(25);
    console.log('Color type:', colorType);
    if (colorType === 6 || colorType === 4) {
      console.log('Image color type supports alpha (transparency).');
    } else {
      console.log('Image color type does NOT support alpha.');
    }
  } catch (e) {
    console.error(e);
  }
}

checkTransparency('image copy.png');
