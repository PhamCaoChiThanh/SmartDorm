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
  let inConflict = false;
  let conflictLines = [];
  let conflictStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<<<<<<< HEAD')) {
      inConflict = true;
      conflictStart = i;
      conflictLines = [];
    }
    if (inConflict) {
      conflictLines.push(`${i + 1}: ${line}`);
    }
    if (line.includes('>>>>>>>')) {
      inConflict = false;
      console.log(`Lines ${conflictStart + 1} to ${i + 1}:`);
      console.log(conflictLines.join('\n'));
      console.log('-----------------------------------');
    }
  }
});
