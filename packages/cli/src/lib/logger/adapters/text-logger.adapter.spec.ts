import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TextLoggerAdapter } from './text-logger.adapter.js';

describe('TextLoggerAdapter', () => {
  let textLoggerAdapter: TextLoggerAdapter;
  let consoleDebugSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    textLoggerAdapter = new TextLoggerAdapter();
    
    // Mock console methods
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
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
      
      expect(consoleDebugSpy).toHaveBeenCalledWith('🐛 Debug message');
    });
  });

  describe('info', () => {
    it('should log info message without prefix', () => {
      const message = 'Info message';
      textLoggerAdapter.info(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith('Info message');
    });
  });

  describe('warn', () => {
    it('should log warning message with emoji prefix', () => {
      const message = 'Warning message';
      textLoggerAdapter.warn(message);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠ Warning message');
    });
  });

  describe('error', () => {
    it('should log error message with emoji prefix', () => {
      const message = 'Error message';
      textLoggerAdapter.error(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error message');
    });
  });

  describe('result', () => {
    it('should log object result with JSON formatting', () => {
      const data = { key: 'value', number: 42 };
      textLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Result:\n{\n  "key": "value",\n  "number": 42\n}');
    });

    it('should log string result with simple format', () => {
      const data = 'Simple result';
      textLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Result: Simple result');
    });

    it('should log number result with simple format', () => {
      const data = 123;
      textLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Result: 123');
    });

    it('should log null result with simple format', () => {
      const data = null;
      textLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Result: null');
    });

    it('should log array result with JSON formatting', () => {
      const data = [1, 2, 3];
      textLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Result:\n[\n  1,\n  2,\n  3\n]');
    });
  });
});