import { describe, it, expect, vi } from 'vitest';
import type { LoggerAdapter } from './logger.adapter.js';
import { LOGGER_ADAPTER_IDENTIFIER } from './logger.adapter.js';

describe('LoggerAdapter', () => {
  describe('interface contract', () => {
    it('should define the expected interface for logger adapters', () => {
      // Create a mock implementation of the LoggerAdapter interface
      const mockLoggerAdapter: LoggerAdapter = {
        getFormat: vi.fn().mockReturnValue('mock'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
      };

      // Verify the interface has all required methods
      expect(mockLoggerAdapter.getFormat).toBeDefined();
      expect(mockLoggerAdapter.debug).toBeDefined();
      expect(mockLoggerAdapter.info).toBeDefined();
      expect(mockLoggerAdapter.warn).toBeDefined();
      expect(mockLoggerAdapter.error).toBeDefined();
      expect(mockLoggerAdapter.result).toBeDefined();
    });

    it('should have getFormat method that returns a string', () => {
      const mockLoggerAdapter: LoggerAdapter = {
        getFormat: vi.fn().mockReturnValue('test-format'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
      };

      const format = mockLoggerAdapter.getFormat();
      expect(typeof format).toBe('string');
      expect(format).toBe('test-format');
    });

    it('should have debug method that accepts a string message', () => {
      const mockLoggerAdapter: LoggerAdapter = {
        getFormat: vi.fn().mockReturnValue('mock'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
      };

      mockLoggerAdapter.debug('debug message');
      expect(mockLoggerAdapter.debug).toHaveBeenCalledWith('debug message');
    });

    it('should have info method that accepts a string message', () => {
      const mockLoggerAdapter: LoggerAdapter = {
        getFormat: vi.fn().mockReturnValue('mock'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
      };

      mockLoggerAdapter.info('info message');
      expect(mockLoggerAdapter.info).toHaveBeenCalledWith('info message');
    });

    it('should have warn method that accepts a string message', () => {
      const mockLoggerAdapter: LoggerAdapter = {
        getFormat: vi.fn().mockReturnValue('mock'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
      };

      mockLoggerAdapter.warn('warning message');
      expect(mockLoggerAdapter.warn).toHaveBeenCalledWith('warning message');
    });

    it('should have error method that accepts a string message', () => {
      const mockLoggerAdapter: LoggerAdapter = {
        getFormat: vi.fn().mockReturnValue('mock'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
      };

      mockLoggerAdapter.error('error message');
      expect(mockLoggerAdapter.error).toHaveBeenCalledWith('error message');
    });

    it('should have result method that accepts unknown data', () => {
      const mockLoggerAdapter: LoggerAdapter = {
        getFormat: vi.fn().mockReturnValue('mock'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
      };

      const testData = { key: 'value', number: 42 };
      mockLoggerAdapter.result(testData);
      expect(mockLoggerAdapter.result).toHaveBeenCalledWith(testData);
    });

    it('should handle various data types in result method', () => {
      const mockLoggerAdapter: LoggerAdapter = {
        getFormat: vi.fn().mockReturnValue('mock'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
      };

      // Test different data types
      mockLoggerAdapter.result('string');
      mockLoggerAdapter.result(123);
      mockLoggerAdapter.result(true);
      mockLoggerAdapter.result(null);
      mockLoggerAdapter.result(undefined);
      mockLoggerAdapter.result({ object: 'data' });
      mockLoggerAdapter.result([1, 2, 3]);

      expect(mockLoggerAdapter.result).toHaveBeenCalledTimes(7);
    });
  });

  describe('LOGGER_ADAPTER_IDENTIFIER', () => {
    it('should export the logger adapter identifier symbol', () => {
      expect(LOGGER_ADAPTER_IDENTIFIER).toBeDefined();
      expect(typeof LOGGER_ADAPTER_IDENTIFIER).toBe('symbol');
    });

    it('should have a descriptive symbol description', () => {
      expect(LOGGER_ADAPTER_IDENTIFIER.toString()).toBe('Symbol(LoggerAdapter)');
    });
  });

  describe('type checking', () => {
    it('should allow implementations with additional properties', () => {
      // This test verifies that the interface doesn't prevent additional properties
      const extendedAdapter: LoggerAdapter & { customMethod: () => void } = {
        getFormat: vi.fn().mockReturnValue('extended'),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        result: vi.fn(),
        customMethod: vi.fn(),
      };

      expect(extendedAdapter.customMethod).toBeDefined();
      expect(extendedAdapter.getFormat()).toBe('extended');
    });

    it('should enforce return type of getFormat', () => {
      const adapter: LoggerAdapter = {
        getFormat: () => 'format-name',
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        result: () => {},
      };

      const format = adapter.getFormat();
      // TypeScript ensures this is a string at compile time
      expect(typeof format).toBe('string');
    });
  });
});