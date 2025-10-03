const fs = require('fs');
const path = require('path');

function fixDoubleAwait(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match withTimeout(await ... 
    const patterns = [
      /withTimeout\(await\s+([^,]+),\s*(\d+),\s*([^)]+)\)/g,
      /withTimeout\(\s*await\s+([^,]+),\s*(\d+),\s*([^)]+)\)/g
    ];
    
    let modified = false;
    
    for (const pattern of patterns) {
      const newContent = content.replace(pattern, (match, operation, timeout, message) => {
        modified = true;
        return `withTimeout(${operation.trim()}, ${timeout}, ${message})`;
      });
      content = newContent;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findApiFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Find all TypeScript files in src/app/api
const apiDir = path.join(__dirname, 'src', 'app', 'api');
const files = findApiFiles(apiDir);

console.log(`Processing ${files.length} files...`);

let fixedCount = 0;
for (const file of files) {
  if (fixDoubleAwait(file)) {
    fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} files with double await issues.`);
