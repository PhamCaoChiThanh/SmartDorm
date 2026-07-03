const fs = require('fs');
const path = require('path');

const conflictedFiles = [
  'backend/Controllers/InvoiceController.cs',
  'backend/Data/AppDbContext.cs',
  'backend/Models/Models.cs',
  'frontend/app/admin/invoices/page.tsx'
];

conflictedFiles.forEach(file => {
  const filePath = path.join('m:/SmartDorm', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  console.log(`\n=== CONFLICTS IN ${file} ===`);
  
  let inHead = false;
  let inTri = false;
  let headLines = [];
  let triLines = [];
  let conflictIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<<<<<<< HEAD')) {
      inHead = true;
      inTri = false;
      headLines = [];
      triLines = [];
    } else if (line.includes('=======')) {
      inHead = false;
      inTri = true;
    } else if (line.includes('>>>>>>> origin/tri')) {
      inTri = false;
      console.log(`Conflict #${conflictIndex++} (around line ${i + 1}):`);
      console.log(`--- HEAD (${headLines.length} lines) ---`);
      if (headLines.length <= 15) {
        console.log(headLines.join('\n'));
      } else {
        console.log(headLines.slice(0, 10).join('\n'));
        console.log(`... [${headLines.length - 15} lines truncated] ...`);
        console.log(headLines.slice(-5).join('\n'));
      }
      console.log(`--- origin/tri (${triLines.length} lines) ---`);
      if (triLines.length <= 15) {
        console.log(triLines.join('\n'));
      } else {
        console.log(triLines.slice(0, 10).join('\n'));
        console.log(`... [${triLines.length - 15} lines truncated] ...`);
        console.log(triLines.slice(-5).join('\n'));
      }
      console.log('===================================');
    } else {
      if (inHead) {
        headLines.push(line);
      } else if (inTri) {
        triLines.push(line);
      }
    }
  }
});
