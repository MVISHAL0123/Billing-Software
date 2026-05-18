#!/usr/bin/env node

/**
 * MMK Billing Software - Electron Builder Script
 * Creates Windows standalone executable (.exe)
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 MMK Billing Software - Electron App Builder');
console.log('================================================\n');

// Check if electron-builder is installed
try {
  require.resolve('electron-builder');
  console.log('✅ electron-builder found');
} catch (e) {
  console.log('❌ Installing electron-builder...');
  require('child_process').execSync('npm install electron-builder --save-dev', { stdio: 'inherit' });
}

console.log('\n✅ Setup ready for building!');
console.log('\nNext steps:');
console.log('1. Run: npm run build:app');
console.log('2. Executable will be in: dist/MMK-Billing-Software-Setup.exe');
console.log('\n');
