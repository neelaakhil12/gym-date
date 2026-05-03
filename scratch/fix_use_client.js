const fs = require('fs');
const path = require('path');

function fixUseClient(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixUseClient(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix "use client" issue
      if (content.includes('"use client";') && content.indexOf('"use client";') > 0) {
        // Remove all occurrences of "use client";
        content = content.replace(/"use client";\s*/g, '');
        // Add it to the absolute top
        content = '"use client";\n\n' + content;
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed use client in:', fullPath);
      }
    }
  }
}

fixUseClient('src');
