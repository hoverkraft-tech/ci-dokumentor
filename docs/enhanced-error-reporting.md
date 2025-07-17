# Enhanced CI Error Reporting

This document describes the enhanced error reporting system implemented to improve CI test functionality and error visibility.

## Overview

The enhanced error reporting system provides better visibility into CI test failures by:
- Capturing detailed error context
- Formatting errors in a structured, readable format
- Grouping errors by package for better organization
- Providing actionable suggestions for common error patterns

## Key Components

### 1. ErrorLogger (`packages/core/src/error-logging/error-logger.ts`)

Central error logging system that:
- Captures errors with rich context (package, test file, command, timestamps)
- Formats errors with emojis and clear categorization
- Groups errors by package for better organization
- Generates comprehensive error reports

```typescript
ErrorLogger.logError(error, {
  testFile: 'src/test.spec.ts',
  testName: 'should work',
  package: 'core',
  command: 'vitest',
  additionalInfo: { duration: 150, retry: 0 }
});
```

### 2. TestErrorCapture (`packages/core/src/error-logging/test-error-capture.ts`)

Wrapper utilities for test execution:
- Captures errors during test execution
- Provides context-aware error logging
- Maintains test failure behavior while logging

```typescript
TestErrorCapture.withErrorLogging(async () => {
  // Test code that might fail
}, { testName: 'my test', package: 'core' });
```

### 3. Enhanced Test Configuration

Updated Vitest configurations with:
- Extended timeouts for better error handling
- JSON and JUnit output formats
- Error logging setup files
- Enhanced coverage reporting

## Features

### Structured Error Reports

Before:
```
❌ Test failed
TypeError: Cannot read properties of undefined
```

After:
```
🚨 Error Summary Report (1 errors)
==================================

📦 Package: cli (1 errors)
  1. CLI command parsing failed
     📁 Package: cli
     🔧 Command: vitest
     📄 Test File: src/cli/command.spec.ts
     🧪 Test Name: should parse command arguments
     🕒 Timestamp: 2025-07-17T17:55:14.895Z
     📋 Stack Trace:
     TypeError: Cannot read properties of undefined (reading '_executableHandler')
         at Command._chainOrCall
         at Command._dispatchSubcommand
     ℹ️  Additional Info:
     {
       "duration": 75,
       "retry": 1,
       "expectedOutput": "Usage: ci-dokumentor",
       "actualOutput": "Cannot read properties of undefined"
     }
```

### Error Analysis and Suggestions

The system provides actionable suggestions for common error patterns:
- CLI command initialization issues
- Null/undefined reference errors
- Missing dependencies
- Configuration problems

### Package-based Organization

Errors are grouped by package, making it easy to identify which parts of the system are failing:
- `@ci-dokumentor/core` errors
- `@ci-dokumentor/cli` errors
- `@ci-dokumentor/github-actions` errors

## Usage

### Available Scripts

```bash
# Run tests with enhanced error logging demo
pnpm run test:demo

# Analyze failing CLI test with enhanced reporting
pnpm run test:failing

# Run CI tests with enhanced error reporting
pnpm run test:ci:enhanced
```

### Integration with Existing Tests

The error logging system is automatically integrated with existing test suites through:
- Vitest setup files
- Enhanced configuration
- Error capture wrappers

### Manual Error Logging

For custom error logging:

```typescript
import { ErrorLogger } from '@ci-dokumentor/core';

try {
  // Some operation that might fail
} catch (error) {
  ErrorLogger.logError(error, {
    testFile: 'src/my-test.spec.ts',
    testName: 'should handle errors',
    package: 'my-package',
    command: 'vitest',
    additionalInfo: {
      inputData: 'test data',
      expectedResult: 'success',
      actualResult: 'failure'
    }
  });
  
  // Generate report
  console.log(ErrorLogger.generateErrorReport());
}
```

## Technical Implementation

### Error Context Structure

```typescript
interface ErrorContext {
  testFile?: string;      // Test file path
  testName?: string;      // Test name
  package?: string;       // Package name
  command?: string;       // Command being executed
  timestamp?: string;     // Error timestamp
  errorType?: string;     // Error type
  additionalInfo?: Record<string, unknown>; // Custom context
}
```

### Error Report Format

The system generates structured reports with:
- Header with total error count
- Package-based grouping
- Individual error details
- Stack traces and context
- Actionable suggestions

## Benefits

1. **Better Debugging**: Rich context makes it easier to identify and fix issues
2. **Improved CI Visibility**: Clear error reports in CI logs
3. **Package Organization**: Errors grouped by package for better triage
4. **Actionable Insights**: Suggestions for common error patterns
5. **Comprehensive Context**: Full error context including timing and retry information

## Testing

The error logging system is fully tested with:
- 17 unit tests covering all functionality
- Integration tests with existing test suites
- Demonstration scripts showing capabilities
- No impact on existing test behavior

## Future Enhancements

Potential improvements:
- Integration with external monitoring systems
- Custom error pattern recognition
- Automated error categorization
- Performance impact analysis
- Error trend reporting