const fs = require('fs');
const path = require('path');

const file = 'backend/Data/AppDbContext.cs';
const filePath = path.join('m:/SmartDorm', file);
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let inHead = false;
let inTri = false;
let headLines = [];
let triLines = [];
let count = 0;

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
    count++;
    if (count === 1) {
      console.log(`\nConflict around line ${i + 1}:`);
      console.log(`--- HEAD (${headLines.length} lines) ---`);
      console.log(headLines.join('\n'));
      console.log(`--- origin/tri (${triLines.length} lines) ---`);
      console.log(triLines.join('\n'));
      console.log('===================================');
    }
  } else {
    if (inHead) {
      headLines.push(line);
    } else if (inTri) {
      triLines.push(line);
    }
  }
}
