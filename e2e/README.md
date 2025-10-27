# AI Ad Yuugen SDK - End-to-End Tests

This directory contains comprehensive end-to-end tests for the AI Ad Yuugen SDK, covering all major functionality, cross-browser compatibility, responsive behavior, and privacy compliance.

## Overview

The E2E test suite validates:

- ✅ **Complete ad serving workflow** - Full ad request, display, and interaction cycle
- ✅ **SDK integration** - Integration with vanilla JS, React, Vue, and Angular applications
- ✅ **Cross-browser compatibility** - Testing across Chromium, Firefox, and WebKit
- ✅ **Responsive behavior** - Adaptive layouts across desktop, tablet, and mobile viewports
- ✅ **Privacy compliance** - GDPR, CCPA, and consent management workflows
- ✅ **Performance validation** - Load times, request speeds, and resource usage
- ✅ **Error handling** - Graceful degradation and recovery scenarios
- ✅ **Accessibility** - Keyboard navigation, touch targets, and screen reader support

## Test Structure

```
e2e/
├── tests/                          # Test specifications
│   ├── ad-serving-workflow.spec.ts      # Core ad serving functionality
│   ├── sdk-integration.spec.ts          # Framework integration tests
│   ├── cross-browser-compatibility.spec.ts # Browser compatibility
│   ├── responsive-behavior.spec.ts      # Responsive design tests
│   ├── privacy-compliance.spec.ts       # Privacy and consent tests
│   └── comprehensive-integration.spec.ts # Full integration scenarios
├── test-app/                       # Test application
│   ├── index.html                       # Multi-framework test interface
│   └── app.js                          # Test application logic
├── utils/                          # Test utilities
│   └── test-helpers.ts                  # Reusable test functions
├── playwright.config.ts            # Playwright configuration
└── package.json                    # E2E test dependencies
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Python 3 (for test server)

### Installation

```bash
# Install E2E test dependencies
cd e2e
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all E2E tests
npm test

# Run tests with browser UI
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run specific test file
npx playwright test ad-serving-workflow.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# Debug tests
npm run test:debug
```

### Test Reports

```bash
# View test report
npm run test:report
```

## Test Categories

### 1. Ad Serving Workflow Tests

**File:** `ad-serving-workflow.spec.ts`

Tests the complete ad serving pipeline:
- Banner ad requests and display
- Interstitial ad presentation
- Ad interaction tracking
- Performance metrics collection
- Error handling and fallbacks
- Multiple ad request scenarios

### 2. SDK Integration Tests

**File:** `sdk-integration.spec.ts`

Validates SDK integration across frameworks:
- Vanilla JavaScript integration
- React component integration
- Vue component integration  
- Angular component integration
- Consistent API behavior
- Context analysis functionality
- Error handling across frameworks

### 3. Cross-Browser Compatibility Tests

**File:** `cross-browser-compatibility.spec.ts`

Ensures functionality across browsers:
- Chromium/Chrome compatibility
- Firefox compatibility
- WebKit/Safari compatibility
- Modern JavaScript feature support
- Local/session storage functionality
- Network condition handling
- Browser-specific privacy settings

### 4. Responsive Behavior Tests

**File:** `responsive-behavior.spec.ts`

Validates responsive design:
- Desktop viewport adaptation (1920x1080, 1366x768)
- Tablet viewport adaptation (1024x768, 768x1024)
- Mobile viewport adaptation (414x896, 375x667, 320x568)
- Orientation change handling
- Touch target sizing
- Text scaling support
- High DPI display support

### 5. Privacy Compliance Tests

**File:** `privacy-compliance.spec.ts`

Ensures privacy regulation compliance:
- GDPR consent workflows
- CCPA compliance ("Do Not Sell")
- Complete opt-out functionality
- Consent persistence
- Privacy violation handling
- Jurisdiction-specific requirements
- Cross-framework consent consistency

### 6. Comprehensive Integration Tests

**File:** `comprehensive-integration.spec.ts`

End-to-end scenarios combining all features:
- Full user journey testing
- Performance under load
- Real-world usage patterns
- Security and privacy validation
- Accessibility compliance
- Data consistency across framework switches

## Test Application

The test application (`test-app/`) provides a comprehensive interface for testing all SDK features:

### Features

- **Multi-framework support** - Switch between vanilla JS, React, Vue, and Angular
- **Privacy controls** - Interactive consent management interface
- **Performance metrics** - Real-time SDK and ad performance monitoring
- **Ad formats** - Banner, native, and interstitial ad testing
- **Responsive design** - Adaptive layout for all screen sizes

### Usage

The test application automatically starts when running E2E tests, but can also be run standalone:

```bash
cd e2e
npm run dev:test-app
# Visit http://localhost:3000
```

## Configuration

### Playwright Configuration

Key configuration options in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

### Environment Variables

- `CI=true` - Enables CI-specific settings (retries, parallel execution)
- `DEBUG=1` - Enables debug logging
- `HEADLESS=false` - Runs tests in headed mode

## Performance Thresholds

The tests validate performance against these thresholds:

- **SDK Initialization:** < 5 seconds
- **Ad Request Time:** < 2 seconds  
- **Framework Switch Time:** < 3 seconds
- **Touch Target Size:** ≥ 44px (iOS/Android standards)

## Continuous Integration

The E2E tests run automatically on:

- **Pull Requests** - Full test suite on all browsers
- **Main Branch Pushes** - Complete validation
- **Daily Schedule** - Regression testing at 2 AM UTC
- **Manual Triggers** - On-demand test execution

### CI Jobs

1. **Cross-browser Tests** - Chromium, Firefox, WebKit on Node 18/20
2. **Mobile Tests** - Mobile Chrome and Safari simulation
3. **Performance Tests** - Load time and responsiveness validation
4. **Accessibility Tests** - WCAG compliance and keyboard navigation

## Debugging

### Local Debugging

```bash
# Run specific test in debug mode
npx playwright test --debug ad-serving-workflow.spec.ts

# Run with browser visible
npx playwright test --headed

# Generate trace files
npx playwright test --trace on
```

### CI Debugging

Test artifacts are automatically uploaded on failure:
- Screenshots of failed tests
- Video recordings of test runs
- Trace files for detailed debugging
- Test reports with timing information

## Best Practices

### Writing Tests

1. **Use test helpers** - Leverage `test-helpers.ts` for common operations
2. **Test isolation** - Each test should be independent
3. **Clear assertions** - Use descriptive expect messages
4. **Performance awareness** - Include timing validations
5. **Error scenarios** - Test both success and failure paths

### Maintenance

1. **Regular updates** - Keep Playwright and dependencies current
2. **Browser updates** - Test with latest browser versions
3. **Performance monitoring** - Track test execution times
4. **Flaky test management** - Investigate and fix unstable tests

## Troubleshooting

### Common Issues

**Tests timing out:**
```bash
# Increase timeout in playwright.config.ts
timeout: 60000 // 60 seconds
```

**Browser installation issues:**
```bash
# Reinstall browsers
npx playwright install --force
```

**Port conflicts:**
```bash
# Change ports in playwright.config.ts
baseURL: 'http://localhost:3001'
```

**Test server startup:**
```bash
# Manually start servers for debugging
npm run dev:server &
npm run dev:test-app &
```

### Getting Help

- Check test reports: `npm run test:report`
- Review trace files for detailed execution steps
- Enable debug logging: `DEBUG=1 npm test`
- Examine CI artifacts for failure analysis

## Contributing

When adding new E2E tests:

1. Follow existing test patterns and structure
2. Use the test helpers for common operations
3. Include both positive and negative test cases
4. Validate performance and accessibility
5. Test across all supported frameworks
6. Update documentation for new test scenarios

For questions or issues, please refer to the main project documentation or create an issue in the repository.