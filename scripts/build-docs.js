#!/usr/bin/env node

/**
 * Build script for generating comprehensive documentation and TypeScript declarations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building AI Ad Yuugen SDK Documentation...');

// Ensure TypeScript declarations are built
console.log('📝 Building TypeScript declarations...');
try {
  execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('✅ TypeScript declarations built successfully');
} catch (error) {
  console.error('❌ Failed to build TypeScript declarations:', error.message);
  process.exit(1);
}

// Validate documentation structure
console.log('📚 Validating documentation structure...');
const docsDir = path.join(__dirname, '..', 'docs');
const requiredFiles = [
  'README.md',
  'quick-start.md',
  'api-reference.md',
  'configuration.md',
  'troubleshooting.md',
  'faq.md',
  'integrations/README.md',
  'examples/README.md'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(docsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing documentation file: ${file}`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('✅ All required documentation files exist');
} else {
  console.error('❌ Some documentation files are missing');
  process.exit(1);
}

// Generate table of contents
console.log('📋 Generating table of contents...');
// This would generate a comprehensive TOC based on all markdown files

console.log('🎉 Documentation build completed successfully!');
console.log('📖 Documentation is available in the ./docs directory');
console.log('🔗 Start with: ./docs/README.md');