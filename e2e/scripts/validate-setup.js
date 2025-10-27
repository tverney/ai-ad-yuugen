#!/usr/bin/env node

/**
 * Validation script for E2E test setup
 * Checks that all required components are properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating E2E test setup...\n');

const checks = [
  {
    name: 'Node.js version',
    check: () => {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      if (major < 18) {
        throw new Error(`Node.js 18+ required, found ${version}`);
      }
      return `✅ Node.js ${version}`;
    }
  },
  {
    name: 'Package.json exists',
    check: () => {
      if (!fs.existsSync(path.join(__dirname, '../package.json'))) {
        throw new Error('package.json not found');
      }
      return '✅ package.json found';
    }
  },
  {
    name: 'Playwright config exists',
    check: () => {
      if (!fs.existsSync(path.join(__dirname, '../playwright.config.ts'))) {
        throw new Error('playwright.config.ts not found');
      }
      return '✅ Playwright configuration found';
    }
  },
  {
    name: 'Test files exist',
    check: () => {
      const testDir = path.join(__dirname, '../tests');
      if (!fs.existsSync(testDir)) {
        throw new Error('tests directory not found');
      }
      
      const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.spec.ts'));
      if (testFiles.length === 0) {
        throw new Error('No test files found');
      }
      
      return `✅ ${testFiles.length} test files found`;
    }
  },
  {
    name: 'Test application exists',
    check: () => {
      const testAppDir = path.join(__dirname, '../test-app');
      if (!fs.existsSync(testAppDir)) {
        throw new Error('test-app directory not found');
      }
      
      if (!fs.existsSync(path.join(testAppDir, 'index.html'))) {
        throw new Error('test-app/index.html not found');
      }
      
      if (!fs.existsSync(path.join(testAppDir, 'app.js'))) {
        throw new Error('test-app/app.js not found');
      }
      
      return '✅ Test application files found';
    }
  },
  {
    name: 'Test utilities exist',
    check: () => {
      const utilsDir = path.join(__dirname, '../utils');
      if (!fs.existsSync(utilsDir)) {
        throw new Error('utils directory not found');
      }
      
      if (!fs.existsSync(path.join(utilsDir, 'test-helpers.ts'))) {
        throw new Error('utils/test-helpers.ts not found');
      }
      
      return '✅ Test utilities found';
    }
  },
  {
    name: 'Dependencies installed',
    check: () => {
      if (!fs.existsSync(path.join(__dirname, '../node_modules'))) {
        throw new Error('node_modules not found - run npm install');
      }
      return '✅ Dependencies installed';
    }
  },
  {
    name: 'Playwright browsers',
    check: () => {
      try {
        execSync('npx playwright --version', { 
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe' 
        });
        return '✅ Playwright available';
      } catch (error) {
        throw new Error('Playwright not available - run npx playwright install');
      }
    }
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    const result = check.check();
    console.log(result);
    passed++;
  } catch (error) {
    console.log(`❌ ${check.name}: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Validation Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  console.log('\n🔧 Setup Issues Found:');
  console.log('Please resolve the failed checks before running E2E tests.');
  console.log('\nQuick fixes:');
  console.log('- Install dependencies: npm install');
  console.log('- Install Playwright browsers: npx playwright install');
  console.log('- Ensure Node.js 18+ is installed');
  process.exit(1);
} else {
  console.log('\n🎉 E2E test setup is valid!');
  console.log('\nYou can now run:');
  console.log('- npm test (run all tests)');
  console.log('- npm run test:ui (run with UI)');
  console.log('- npm run test:headed (run with visible browser)');
  console.log('- npm run test:debug (debug mode)');
}