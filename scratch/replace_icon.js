const fs = require('fs');
const path = require('path');

function replaceDumbbell(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceDumbbell(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Dumbbell')) {
        // Add import if needed
        if (!content.includes('import GymLogoIcon')) {
          // Add import at the top
          content = 'import GymLogoIcon from "@/components/GymLogoIcon";\n' + content;
        }
        
        // Replace JSX usage
        content = content.replace(/<Dumbbell/g, '<GymLogoIcon');
        
        // Replace object property usage
        content = content.replace(/icon:\s*Dumbbell/g, 'icon: GymLogoIcon');
        
        // Clean up lucide-react import
        content = content.replace(/Dumbbell,\s*/g, '');
        content = content.replace(/,\s*Dumbbell/g, '');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

replaceDumbbell('src');
