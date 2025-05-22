// Simple test script to verify the application configuration

const fs = require('fs');
const path = require('path');

// Check if .env file exists
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.error('Error: .env file is missing');
  process.exit(1);
}

// Check if .env file contains URL
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
if (!envContent.includes('URL=')) {
  console.error('Error: URL is not defined in .env file');
  process.exit(1);
}

// Check if index.js exists
if (!fs.existsSync(path.join(__dirname, 'index.js'))) {
  console.error('Error: index.js file is missing');
  process.exit(1);
}

// Check if package.json exists and has required fields
const packageJson = require('./package.json');
if (!packageJson.main || packageJson.main !== 'index.js') {
  console.error('Error: package.json does not have correct main field');
  process.exit(1);
}

if (!packageJson.scripts || !packageJson.scripts.start || !packageJson.scripts.build) {
  console.error('Error: package.json does not have required scripts');
  process.exit(1);
}

if (!packageJson.dependencies || !packageJson.dependencies.electron || !packageJson.dependencies.dotenv) {
  console.error('Error: package.json does not have required dependencies');
  process.exit(1);
}

// Check if icons directory exists and has required files
if (!fs.existsSync(path.join(__dirname, 'icons'))) {
  console.error('Error: icons directory is missing');
  process.exit(1);
}

const requiredIcons = ['favicon.ico'];
for (const icon of requiredIcons) {
  if (!fs.existsSync(path.join(__dirname, 'icons', icon))) {
    console.error(`Error: Required icon ${icon} is missing`);
    process.exit(1);
  }
}

console.log('All checks passed! The application is configured correctly.');
console.log('To run the application, use: npm start');
console.log('To build the application, use: npm run build');
