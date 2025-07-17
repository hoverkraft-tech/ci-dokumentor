import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorLogger, ErrorContext } from './error-logger.js';

describe('ErrorLogger', () => {
  beforeEach(() => {
    ErrorLogger.clearErrors();
  });

  describe('logError', () => {
    it('should log an error with basic context', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        testFile: 'test.spec.ts',
        testName: 'sample test',
        package: 'core',
        command: 'vitest',
      };

      const result = ErrorLogger.logError(error, context);

      expect(result.message).toBe('Test error');
      expect(result.context.testFile).toBe('test.spec.ts');
      expect(result.context.testName).toBe('sample test');
      expect(result.context.package).toBe('core');
      expect(result.context.command).toBe('vitest');
      expect(result.context.timestamp).toBeTruthy();
      expect(result.context.errorType).toBe('Error');
      expect(result.formatted).toContain('❌ Error: Test error');
      expect(result.formatted).toContain('📁 Package: core');
      expect(result.formatted).toContain('🔧 Command: vitest');
    });

    it('should log an error with minimal context', () => {
      const error = new Error('Minimal error');
      
      const result = ErrorLogger.logError(error);

      expect(result.message).toBe('Minimal error');
      expect(result.context.timestamp).toBeTruthy();
      expect(result.context.errorType).toBe('Error');
      expect(result.formatted).toContain('❌ Error: Minimal error');
      expect(result.formatted).toContain('📁 Package: unknown');
      expect(result.formatted).toContain('🔧 Command: unknown');
    });

    it('should include stack trace in formatted output', () => {
      const error = new Error('Error with stack');
      
      const result = ErrorLogger.logError(error);

      expect(result.formatted).toContain('📋 Stack Trace:');
      expect(result.formatted).toContain('Error with stack');
    });

    it('should include additional info in formatted output', () => {
      const error = new Error('Error with additional info');
      const context: ErrorContext = {
        additionalInfo: {
          duration: 123,
          retry: 2,
          customData: 'test',
        },
      };

      const result = ErrorLogger.logError(error, context);

      expect(result.formatted).toContain('ℹ️  Additional Info:');
      expect(result.formatted).toContain('"duration": 123');
      expect(result.formatted).toContain('"retry": 2');
      expect(result.formatted).toContain('"customData": "test"');
    });
  });

  describe('getErrors', () => {
    it('should return empty array when no errors logged', () => {
      const errors = ErrorLogger.getErrors();
      expect(errors).toEqual([]);
    });

    it('should return all logged errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      ErrorLogger.logError(error1, { package: 'core' });
      ErrorLogger.logError(error2, { package: 'cli' });

      const errors = ErrorLogger.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('Error 1');
      expect(errors[1].message).toBe('Error 2');
    });
  });

  describe('clearErrors', () => {
    it('should clear all logged errors', () => {
      ErrorLogger.logError(new Error('Test error'));
      expect(ErrorLogger.getErrors()).toHaveLength(1);

      ErrorLogger.clearErrors();
      expect(ErrorLogger.getErrors()).toHaveLength(0);
    });
  });

  describe('generateErrorReport', () => {
    it('should return success message when no errors', () => {
      const report = ErrorLogger.generateErrorReport();
      expect(report).toBe('✅ No errors logged');
    });

    it('should generate a summary report for single error', () => {
      const error = new Error('Test error');
      ErrorLogger.logError(error, { package: 'core', testName: 'test' });

      const report = ErrorLogger.generateErrorReport();
      expect(report).toContain('🚨 Error Summary Report (1 errors)');
      expect(report).toContain('📦 Package: core (1 errors)');
      expect(report).toContain('1. Test error');
      expect(report).toContain('📁 Package: core');
    });

    it('should group errors by package', () => {
      ErrorLogger.logError(new Error('Core error 1'), { package: 'core' });
      ErrorLogger.logError(new Error('Core error 2'), { package: 'core' });
      ErrorLogger.logError(new Error('CLI error'), { package: 'cli' });

      const report = ErrorLogger.generateErrorReport();
      expect(report).toContain('🚨 Error Summary Report (3 errors)');
      expect(report).toContain('📦 Package: core (2 errors)');
      expect(report).toContain('📦 Package: cli (1 errors)');
      expect(report).toContain('1. Core error 1');
      expect(report).toContain('2. Core error 2');
      expect(report).toContain('1. CLI error');
    });

    it('should handle unknown package names', () => {
      ErrorLogger.logError(new Error('Unknown package error'));

      const report = ErrorLogger.generateErrorReport();
      expect(report).toContain('📦 Package: unknown (1 errors)');
    });
  });
});