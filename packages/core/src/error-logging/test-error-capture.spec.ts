import { describe, it, expect, beforeEach } from 'vitest';
import { TestErrorCapture, getPackageNameFromUrl, createTestWrapper } from './test-error-capture.js';
import { ErrorLogger } from './error-logger.js';

describe('TestErrorCapture', () => {
  beforeEach(() => {
    ErrorLogger.clearErrors();
  });

  describe('withErrorLogging', () => {
    it('should log error and re-throw for failed async test', async () => {
      const testError = new Error('Async test failed');
      const context = {
        testFile: 'async.spec.ts',
        testName: 'async test',
        package: 'core',
      };

      const testFn = async () => {
        throw testError;
      };

      await expect(TestErrorCapture.withErrorLogging(testFn, context)).rejects.toThrow('Async test failed');

      const errors = ErrorLogger.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Async test failed');
      expect(errors[0].context.testFile).toBe('async.spec.ts');
      expect(errors[0].context.testName).toBe('async test');
      expect(errors[0].context.package).toBe('core');
    });

    it('should return result for successful async test', async () => {
      const testFn = async () => {
        return 'success';
      };

      const result = await TestErrorCapture.withErrorLogging(testFn, {});
      expect(result).toBe('success');
      expect(ErrorLogger.getErrors()).toHaveLength(0);
    });

    it('should handle sync function in async wrapper', async () => {
      const testFn = () => {
        return 'sync result';
      };

      const result = await TestErrorCapture.withErrorLogging(testFn, {});
      expect(result).toBe('sync result');
      expect(ErrorLogger.getErrors()).toHaveLength(0);
    });
  });

  describe('withErrorLoggingSync', () => {
    it('should log error and re-throw for failed sync test', () => {
      const testError = new Error('Sync test failed');
      const context = {
        testFile: 'sync.spec.ts',
        testName: 'sync test',
        package: 'core',
      };

      const testFn = () => {
        throw testError;
      };

      expect(() => TestErrorCapture.withErrorLoggingSync(testFn, context)).toThrow('Sync test failed');

      const errors = ErrorLogger.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Sync test failed');
      expect(errors[0].context.testFile).toBe('sync.spec.ts');
      expect(errors[0].context.testName).toBe('sync test');
      expect(errors[0].context.package).toBe('core');
    });

    it('should return result for successful sync test', () => {
      const testFn = () => {
        return 'sync success';
      };

      const result = TestErrorCapture.withErrorLoggingSync(testFn, {});
      expect(result).toBe('sync success');
      expect(ErrorLogger.getErrors()).toHaveLength(0);
    });
  });

  describe('createTestContext', () => {
    it('should create proper test context', () => {
      const context = TestErrorCapture.createTestContext('test.spec.ts', 'core');
      
      expect(context).toEqual({
        testFile: 'test.spec.ts',
        package: 'core',
        command: 'vitest',
      });
    });
  });
});

describe('getPackageNameFromUrl', () => {
  it('should extract package name from file URL', () => {
    const url = 'file:///path/to/project/packages/core/src/test.spec.ts';
    const packageName = getPackageNameFromUrl(url);
    expect(packageName).toBe('core');
  });

  it('should return unknown for URLs without package structure', () => {
    const url = 'file:///path/to/project/src/test.spec.ts';
    const packageName = getPackageNameFromUrl(url);
    expect(packageName).toBe('unknown');
  });

  it('should handle different package names', () => {
    const url = 'file:///path/to/project/packages/github-actions/src/test.spec.ts';
    const packageName = getPackageNameFromUrl(url);
    expect(packageName).toBe('github-actions');
  });
});

describe('createTestWrapper', () => {
  beforeEach(() => {
    ErrorLogger.clearErrors();
  });

  it('should create wrapper with proper context', async () => {
    const wrapper = createTestWrapper('test.spec.ts', 'core');
    
    const testError = new Error('Wrapper test failed');
    const testFn = async () => {
      throw testError;
    };

    await expect(wrapper.withErrorLogging(testFn, 'wrapper test')).rejects.toThrow('Wrapper test failed');

    const errors = ErrorLogger.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].context.testFile).toBe('test.spec.ts');
    expect(errors[0].context.package).toBe('core');
    expect(errors[0].context.testName).toBe('wrapper test');
    expect(errors[0].context.command).toBe('vitest');
  });

  it('should handle sync wrapper', () => {
    const wrapper = createTestWrapper('sync.spec.ts', 'cli');
    
    const testError = new Error('Sync wrapper failed');
    const testFn = () => {
      throw testError;
    };

    expect(() => wrapper.withErrorLoggingSync(testFn, 'sync wrapper test')).toThrow('Sync wrapper failed');

    const errors = ErrorLogger.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].context.testFile).toBe('sync.spec.ts');
    expect(errors[0].context.package).toBe('cli');
    expect(errors[0].context.testName).toBe('sync wrapper test');
  });
});