import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoggerService } from './logger.service.js';
import { TextLoggerAdapter } from './adapters/text-logger.adapter.js';
import { JsonLoggerAdapter } from './adapters/json-logger.adapter.js';
import { GitHubActionLoggerAdapter } from './adapters/github-action-logger.adapter.js';
import type { LoggerAdapter } from './adapters/logger.adapter.js';

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let textAdapter: LoggerAdapter;
  let jsonAdapter: LoggerAdapter;
  let githubActionAdapter: LoggerAdapter;
  let mockAdapters: LoggerAdapter[];

  beforeEach(() => {
    // Create mock adapters
    textAdapter = {
      getFormat: vi.fn().mockReturnValue('text'),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      result: vi.fn(),
    };

    jsonAdapter = {
      getFormat: vi.fn().mockReturnValue('json'),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      result: vi.fn(),
    };

    githubActionAdapter = {
      getFormat: vi.fn().mockReturnValue('github-action'),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      result: vi.fn(),
    };

    mockAdapters = [textAdapter, jsonAdapter, githubActionAdapter];
    loggerService = new LoggerService(mockAdapters);
  });

  describe('getSupportedFormats', () => {
    it('should return all supported formats from adapters', () => {
      const formats = loggerService.getSupportedFormats();
      
      expect(formats).toEqual(['text', 'json', 'github-action']);
    });

    it('should call getFormat on each adapter', () => {
      loggerService.getSupportedFormats();
      
      expect(textAdapter.getFormat).toHaveBeenCalled();
      expect(jsonAdapter.getFormat).toHaveBeenCalled();
      expect(githubActionAdapter.getFormat).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should use first adapter when format is undefined', () => {
      const message = 'Debug message';
      loggerService.debug(message, undefined);
      
      expect(textAdapter.debug).toHaveBeenCalledWith(message);
    });

    it('should use specific adapter when format is provided', () => {
      const message = 'Debug message';
      loggerService.debug(message, 'json');
      
      expect(jsonAdapter.debug).toHaveBeenCalledWith(message);
    });

    it('should throw error for unsupported format', () => {
      const message = 'Debug message';
      
      expect(() => loggerService.debug(message, 'unsupported')).toThrow('Unsupported output format: unsupported');
    });
  });

  describe('info', () => {
    it('should use first adapter when format is undefined', () => {
      const message = 'Info message';
      loggerService.info(message, undefined);
      
      expect(textAdapter.info).toHaveBeenCalledWith(message);
    });

    it('should use specific adapter when format is provided', () => {
      const message = 'Info message';
      loggerService.info(message, 'github-action');
      
      expect(githubActionAdapter.info).toHaveBeenCalledWith(message);
    });

    it('should throw error for unsupported format', () => {
      const message = 'Info message';
      
      expect(() => loggerService.info(message, 'invalid')).toThrow('Unsupported output format: invalid');
    });
  });

  describe('warn', () => {
    it('should use first adapter when format is undefined', () => {
      const message = 'Warning message';
      loggerService.warn(message, undefined);
      
      expect(textAdapter.warn).toHaveBeenCalledWith(message);
    });

    it('should use specific adapter when format is provided', () => {
      const message = 'Warning message';
      loggerService.warn(message, 'text');
      
      expect(textAdapter.warn).toHaveBeenCalledWith(message);
    });

    it('should throw error for unsupported format', () => {
      const message = 'Warning message';
      
      expect(() => loggerService.warn(message, 'unknown')).toThrow('Unsupported output format: unknown');
    });
  });

  describe('error', () => {
    it('should use first adapter when format is undefined', () => {
      const message = 'Error message';
      loggerService.error(message, undefined);
      
      expect(textAdapter.error).toHaveBeenCalledWith(message);
    });

    it('should use specific adapter when format is provided', () => {
      const message = 'Error message';
      loggerService.error(message, 'json');
      
      expect(jsonAdapter.error).toHaveBeenCalledWith(message);
    });

    it('should throw error for unsupported format', () => {
      const message = 'Error message';
      
      expect(() => loggerService.error(message, 'nonexistent')).toThrow('Unsupported output format: nonexistent');
    });
  });

  describe('result', () => {
    it('should use first adapter when format is undefined', () => {
      const data = { key: 'value' };
      loggerService.result(data, undefined);
      
      expect(textAdapter.result).toHaveBeenCalledWith(data);
    });

    it('should use specific adapter when format is provided', () => {
      const data = { key: 'value' };
      loggerService.result(data, 'github-action');
      
      expect(githubActionAdapter.result).toHaveBeenCalledWith(data);
    });

    it('should throw error for unsupported format', () => {
      const data = { key: 'value' };
      
      expect(() => loggerService.result(data, 'badformat')).toThrow('Unsupported output format: badformat');
    });
  });

  describe('getLogger private method', () => {
    it('should handle case where no adapters are provided', () => {
      const emptyLoggerService = new LoggerService([]);
      
      expect(() => emptyLoggerService.debug('test', undefined)).toThrow('Cannot read properties of undefined');
    });
  });

  describe('integration with real adapters', () => {
    let realLoggerService: LoggerService;

    beforeEach(() => {
      const realAdapters = [
        new TextLoggerAdapter(),
        new JsonLoggerAdapter(),
        new GitHubActionLoggerAdapter(),
      ];
      realLoggerService = new LoggerService(realAdapters);
    });

    it('should return correct formats from real adapters', () => {
      const formats = realLoggerService.getSupportedFormats();
      
      expect(formats).toEqual(['text', 'json', 'github-action']);
    });

    it('should use text adapter as default', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      realLoggerService.info('test message', undefined);
      
      expect(consoleSpy).toHaveBeenCalledWith('test message');
      consoleSpy.mockRestore();
    });
  });
});