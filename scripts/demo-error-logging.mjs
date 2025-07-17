#!/usr/bin/env node
/**
 * Test script to demonstrate error logging improvements
 */

import { ErrorLogger } from '../packages/core/dist/index.js';
import { TestErrorCapture } from '../packages/core/dist/index.js';

console.log('🔍 Demonstrating Error Logging Improvements\n');

// Simulate some test errors
function simulateTestErrors() {
  console.log('📝 Simulating test errors...');
  
  // Simulate a test error in the core package
  const coreError = new Error('Core service initialization failed');
  ErrorLogger.logError(coreError, {
    testFile: 'src/core/service.spec.ts',
    testName: 'should initialize core service',
    package: 'core',
    command: 'vitest',
    additionalInfo: {
      duration: 150,
      retry: 0,
      expectedValue: 'initialized',
      actualValue: 'undefined',
    },
  });

  // Simulate a test error in the CLI package
  const cliError = new Error('CLI command parsing failed');
  ErrorLogger.logError(cliError, {
    testFile: 'src/cli/command.spec.ts',
    testName: 'should parse command arguments',
    package: 'cli',
    command: 'vitest',
    additionalInfo: {
      duration: 75,
      retry: 1,
      commandArgs: ['--help'],
      expectedOutput: 'Usage: ci-dokumentor',
      actualOutput: 'Cannot read properties of undefined',
    },
  });

  // Simulate a test error in the github-actions package
  const githubError = new Error('GitHub Actions parser failed');
  ErrorLogger.logError(githubError, {
    testFile: 'src/github-actions/parser.spec.ts',
    testName: 'should parse workflow file',
    package: 'github-actions',
    command: 'vitest',
    additionalInfo: {
      duration: 200,
      retry: 0,
      inputFile: 'test-workflow.yml',
      parsingStage: 'job_parsing',
    },
  });
}

// Demonstrate test error capture
function demonstrateTestErrorCapture() {
  console.log('⚡ Testing error capture wrapper...');
  
  const wrapper = TestErrorCapture.createTestContext('demo.spec.ts', 'demo');
  
  try {
    TestErrorCapture.withErrorLoggingSync(() => {
      throw new Error('Wrapped test error');
    }, {
      ...wrapper,
      testName: 'demo test with wrapper',
      additionalInfo: {
        wrapperDemo: true,
      },
    });
  } catch (error) {
    // Expected to catch the error
    console.log('✓ Error captured and logged successfully');
  }
}

// Run demonstrations
simulateTestErrors();
demonstrateTestErrorCapture();

// Generate comprehensive error report
console.log('\n' + '='.repeat(80));
console.log('📊 Enhanced Error Report');
console.log('='.repeat(80));
console.log(ErrorLogger.generateErrorReport());
console.log('='.repeat(80));

// Show individual error details
console.log('\n📋 Individual Error Details:');
const errors = ErrorLogger.getErrors();
errors.forEach((error, index) => {
  console.log(`\n${index + 1}. ${error.message}`);
  console.log(`   Package: ${error.context.package}`);
  console.log(`   Test: ${error.context.testName}`);
  console.log(`   File: ${error.context.testFile}`);
  console.log(`   Timestamp: ${error.context.timestamp}`);
  if (error.context.additionalInfo) {
    console.log(`   Additional Info: ${JSON.stringify(error.context.additionalInfo, null, 2)}`);
  }
});

console.log('\n✅ Error logging demonstration complete!');
console.log(`📈 Total errors logged: ${errors.length}`);