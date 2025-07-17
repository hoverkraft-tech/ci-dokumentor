#!/usr/bin/env node
/**
 * Test runner that demonstrates enhanced error logging for the actual failing CLI test
 */

import { spawn } from 'child_process';
import { ErrorLogger } from '../packages/core/dist/index.js';
import { createWriteStream } from 'fs';
import { join } from 'path';

async function runFailingTest() {
  console.log('🔍 Running failing CLI test with enhanced error logging...\n');
  
  // Clear any existing errors
  ErrorLogger.clearErrors();
  
  // Create log file
  const logPath = join(process.cwd(), 'failing-test-output.log');
  const logStream = createWriteStream(logPath);
  
  return new Promise((resolve, reject) => {
    // Run the specific failing test
    const testProcess = spawn('npx', ['vitest', 'run', 'src/lib/cli.spec.ts'], {
      cwd: join(process.cwd(), 'packages/cli'),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });
    
    let stdout = '';
    let stderr = '';
    
    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      logStream.write(output);
      process.stdout.write(output);
    });
    
    testProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      logStream.write(output);
      process.stderr.write(output);
    });
    
    testProcess.on('close', (code) => {
      logStream.end();
      
      console.log('\n' + '='.repeat(80));
      console.log('🚨 Enhanced Error Analysis for Failed Test');
      console.log('='.repeat(80));
      
      if (code !== 0) {
        console.log(`❌ Test failed with exit code: ${code}`);
        
        // Analyze the error output
        const errorLines = stderr.split('\n').filter(line => line.includes('Error:') || line.includes('TypeError:'));
        
        if (errorLines.length > 0) {
          console.log('\n📋 Detected Error Patterns:');
          errorLines.forEach((line, index) => {
            console.log(`  ${index + 1}. ${line.trim()}`);
          });
        }
        
        // Look for specific error patterns in stdout
        const failedTests = stdout.match(/✘\s+.*?\s+→\s+(.*)/g);
        if (failedTests) {
          console.log('\n🧪 Failed Test Details:');
          failedTests.forEach((match, index) => {
            console.log(`  ${index + 1}. ${match.trim()}`);
          });
        }
        
        // Extract stack trace information
        const stackLines = stdout.split('\n').filter(line => line.includes('❯') || line.includes('at '));
        if (stackLines.length > 0) {
          console.log('\n📍 Stack Trace Summary:');
          stackLines.slice(0, 5).forEach((line, index) => {
            console.log(`  ${index + 1}. ${line.trim()}`);
          });
        }
        
        // Provide suggestions
        console.log('\n💡 Suggested Actions:');
        if (stdout.includes('_executableHandler')) {
          console.log('  - Check CLI command initialization');
          console.log('  - Verify Commander.js setup');
          console.log('  - Review command registration process');
        }
        
        if (stdout.includes('Cannot read properties of undefined')) {
          console.log('  - Check for null/undefined values in command handling');
          console.log('  - Add proper error handling for edge cases');
          console.log('  - Validate command arguments before processing');
        }
      } else {
        console.log('✅ Test passed successfully!');
      }
      
      console.log('\n📊 Test Execution Summary:');
      console.log(`  - Exit Code: ${code}`);
      console.log(`  - Output Length: ${stdout.length} characters`);
      console.log(`  - Error Length: ${stderr.length} characters`);
      console.log(`  - Log File: ${logPath}`);
      
      console.log('='.repeat(80));
      
      resolve(code);
    });
    
    testProcess.on('error', (error) => {
      logStream.end();
      console.error('Process error:', error);
      reject(error);
    });
  });
}

runFailingTest().catch(console.error);