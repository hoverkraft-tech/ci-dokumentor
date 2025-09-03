import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JsonLoggerAdapter } from './json-logger.adapter.js';

describe('JsonLoggerAdapter', () => {
  let jsonLoggerAdapter: JsonLoggerAdapter;
  let consoleInfoSpy: any;
  let consoleErrorSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    jsonLoggerAdapter = new JsonLoggerAdapter();
    
    // Mock console methods
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFormat', () => {
    it('should return "json" as the format', () => {
      expect(jsonLoggerAdapter.getFormat()).toBe('json');
    });
  });

  describe('debug', () => {
    it('should log debug message as JSON to stderr', () => {
      const message = 'Debug message';
      jsonLoggerAdapter.debug(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('{"level":"debug","message":"Debug message"}');
    });
  });

  describe('info', () => {
    it('should log info message as JSON to stdout', () => {
      const message = 'Info message';
      jsonLoggerAdapter.info(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith('{"level":"info","message":"Info message"}');
    });
  });

  describe('warn', () => {
    it('should log warning message as JSON to stderr', () => {
      const message = 'Warning message';
      jsonLoggerAdapter.warn(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('{"level":"warning","message":"Warning message"}');
    });
  });

  describe('error', () => {
    it('should log error message as JSON to stderr', () => {
      const message = 'Error message';
      jsonLoggerAdapter.error(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('{"level":"error","message":"Error message"}');
    });
  });

  describe('result', () => {
    it('should log result data as JSON object', () => {
      const data = { key: 'value', number: 42 };
      jsonLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith({ level: 'result', data: { key: 'value', number: 42 } });
    });

    it('should log string result as JSON object', () => {
      const data = 'Simple result';
      jsonLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith({ level: 'result', data: 'Simple result' });
    });

    it('should log number result as JSON object', () => {
      const data = 123;
      jsonLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith({ level: 'result', data: 123 });
    });

    it('should log null result as JSON object', () => {
      const data = null;
      jsonLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith({ level: 'result', data: null });
    });

    it('should log array result as JSON object', () => {
      const data = [1, 2, 3];
      jsonLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith({ level: 'result', data: [1, 2, 3] });
    });
  });
});