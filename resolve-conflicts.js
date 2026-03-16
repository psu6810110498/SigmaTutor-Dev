import * as fs from 'fs';
import * as path from 'path';

const files = [
  'apps/backend/src/routes/review.routes.ts',
  'apps/frontend/app/(main)/(admin)/admin/reviews/page.tsx',
  'apps/frontend/app/(public)/course/[id]/page.tsx',
  'apps/frontend/app/lib/api.ts',
  'apps/frontend/app/lib/types.ts',
];

const basePath = process.cwd();

for (const relPath of files) {
  const filePath = path.join(basePath, relPath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const result = [];
  
  let state = 'NORMAL';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (state === 'NORMAL') {
      if (line.startsWith('<<<<<<< Updated upstream')) {
        state = 'UPSTREAM';
      } else {
        result.push(line);
      }
    } else if (state === 'UPSTREAM') {
      if (line.startsWith('=======')) {
        state = 'STASH';
      } else {
        result.push(line);
      }
    } else if (state === 'STASH') {
      if (line.startsWith('>>>>>>> Stashed changes')) {
        state = 'NORMAL';
      }
    }
  }
  
  fs.writeFileSync(filePath, result.join('\n'), 'utf-8');
  console.log(`Resolved conflicts in ${relPath}`);
}
