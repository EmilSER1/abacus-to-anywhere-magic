const fs = require('fs');
const path = require('path');

// Copy turar_full.json
const turarSource = path.join(__dirname, '../src/data/turar_full.json');
const turarDest = path.join(__dirname, '../public/turar_full.json');

// Copy combined_floors.json  
const floorsSource = path.join(__dirname, '../src/data/combined_floors.json');
const floorsDest = path.join(__dirname, '../public/combined_floors.json');

try {
  fs.copyFileSync(turarSource, turarDest);
  console.log('Copied turar_full.json to public folder');
  
  fs.copyFileSync(floorsSource, floorsDest);
  console.log('Copied combined_floors.json to public folder');
} catch (error) {
  console.error('Error copying files:', error);
}