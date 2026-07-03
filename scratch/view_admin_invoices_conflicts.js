const fs = require('fs');
const path = require('path');

const file = 'frontend/app/admin/invoices/page.tsx';
const filePath = path.join('m:/SmartDorm', file);
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

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
    console.log(`\nConflict #${conflictIndex++} (around line ${i + 1}):`);
    console.log(`--- HEAD ---`);
    console.log(headLines.join('\n'));
    console.log(`--- origin/tri ---`);
    console.log(triLines.join('\n'));
    console.log('===================================');
  } else {
    if (inHead) {
      headLines.push(line);
    } else if (inTri) {
      triLines.push(line);
    }
  }
}
