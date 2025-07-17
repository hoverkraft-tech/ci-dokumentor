#!/usr/bin/env node
/**
 * Enhanced CI test runner with error logging
 */

import { spawn } from 'child_process';
import { ErrorLogger } from '@ci-dokumentor/core';

async function runTests() {
  console.log('🚀 Starting CI test run with enhanced error logging...\n');
  
  // Clear any existing errors
  ErrorLogger.clearErrors();
  
  const testProcess = spawn('pnpm', ['run', 'test:ci'], {
    stdio: 'inherit',
    shell: true,
  });
  
  return new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      console.log('\n' + '='.repeat(80));
      console.log('📊 CI Test Run Summary');
      console.log('='.repeat(80));
      
      if (code === 0) {
        console.log('✅ All tests passed!');
        console.log(ErrorLogger.generateErrorReport());
      } else {
        console.log(`❌ Tests failed with exit code: ${code}`);
        console.log(ErrorLogger.generateErrorReport());
      }
      
      console.log('='.repeat(80));
      
      resolve(code);
    });
    
    testProcess.on('error', (error) => {
      ErrorLogger.logError(error, {
        command: 'ci-test-runner',
        errorType: 'ProcessError',
        additionalInfo: {
          source: 'test_runner',
        },
      });
      reject(error);
    });
  });
}

runTests().catch(console.error);