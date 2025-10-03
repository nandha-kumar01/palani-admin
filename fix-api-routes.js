#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of all API route files
const apiRoutes = [
  '/home/laabam/Downloads/palani/src/app/api/groups/member/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/groups/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/groups/manage/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/groups/available/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/groups/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/groups/join/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/test/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/states/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/auth/register/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/announcements/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/location/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/location/firebase/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/gallery/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/gallery/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/songs/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/songs/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/madangal/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/madangal/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/users/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/users/deleted/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/annadhanam/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/annadhanam/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/security/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/temples/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/temples/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/announcements/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/announcements/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/admin/announcements/send/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/countries/[id]/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/countries/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/notifications/send/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/upload/route.ts',
  '/home/laabam/Downloads/palani/src/app/api/seed/route.ts'
];

const requiredExports = `
// Required for static export with dynamic API routes
export const dynamic = 'force-dynamic';
export const revalidate = false;`;

function fixApiRoute(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file already has the required exports
    if (content.includes('export const dynamic') && content.includes('export const revalidate')) {
      console.log(`Already fixed: ${filePath}`);
      return;
    }

    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex === -1) {
      // No imports found, add at the beginning
      const newContent = requiredExports + '\n\n' + content;
      fs.writeFileSync(filePath, newContent, 'utf8');
    } else {
      // Add after the last import
      lines.splice(lastImportIndex + 1, 0, requiredExports);
      const newContent = lines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
    }

    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

console.log('Fixing API routes for static export...');

apiRoutes.forEach(fixApiRoute);

console.log('Done!');
