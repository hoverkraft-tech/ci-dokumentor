import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TextLoggerAdapter } from './text-logger.adapter.js';
import { ConsoleMockFactory, MockedConsole } from '../../../../__tests__/console-mock.factory.js';

describe('TextLoggerAdapter', () => {
  let textLoggerAdapter: TextLoggerAdapter;
  let consoleMock: MockedConsole;

  beforeEach(() => {
    textLoggerAdapter = new TextLoggerAdapter();
    consoleMock = ConsoleMockFactory.create();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFormat', () => {
    it('should return "text" as the format', () => {
      expect(textLoggerAdapter.getFormat()).toBe('text');
    });
  });

  describe('debug', () => {
    it('should log debug message with emoji prefix', () => {
      const message = 'Debug message';
      textLoggerAdapter.debug(message);

      expect(consoleMock.debug).toHaveBeenCalledWith('🐛 Debug message');
    });
  });

  describe('info', () => {
    it('should log info message without prefix', () => {
      const message = 'Info message';
      textLoggerAdapter.info(message);

      expect(consoleMock.info).toHaveBeenCalledWith('Info message');
    });
  });

  describe('warn', () => {
    it('should log warning message with emoji prefix', () => {
      const message = 'Warning message';
      textLoggerAdapter.warn(message);

      expect(consoleMock.warn).toHaveBeenCalledWith('⚠ Warning message');
    });
  });

  describe('error', () => {
    it('should log error message with emoji prefix', () => {
      const message = 'Error message';
      textLoggerAdapter.error(message);

      expect(consoleMock.error).toHaveBeenCalledWith('❌ Error message');
    });
  });

  describe('result', () => {
    it('should log object result with JSON formatting', () => {
      const data = { key: 'value', number: 42 };
      textLoggerAdapter.result(data);

      expect(consoleMock.info).toHaveBeenNthCalledWith(1, '✅ Result:');
      expect(consoleMock.info).toHaveBeenNthCalledWith(2, '   - key: value');
      expect(consoleMock.info).toHaveBeenNthCalledWith(3, '   - number: 42');
    });

    it('should log string result with simple format', () => {
      const data = 'Simple result';
      textLoggerAdapter.result(data);

      expect(consoleMock.info).toHaveBeenCalledWith('✅ Result: Simple result');
    });

    it('should log number result with simple format', () => {
      const data = 123;
      textLoggerAdapter.result(data);

      expect(consoleMock.info).toHaveBeenCalledWith('✅ Result: 123');
    });

    it('should log null result with simple format', () => {
      const data = null;
      textLoggerAdapter.result(data);

      expect(consoleMock.info).toHaveBeenCalledWith('✅ Result: null');
    });

    it('should log array result with JSON formatting', () => {
      const data = [1, 2, 3];
      textLoggerAdapter.result(data);

      expect(consoleMock.info).toHaveBeenNthCalledWith(1, '✅ Result:');
      expect(consoleMock.info).toHaveBeenNthCalledWith(2, '   - 1');
      expect(consoleMock.info).toHaveBeenNthCalledWith(3, '   - 2');
      expect(consoleMock.info).toHaveBeenNthCalledWith(4, '   - 3');
    });
  });
});