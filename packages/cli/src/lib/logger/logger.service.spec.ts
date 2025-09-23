import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import { LoggerAdapterMockFactory } from '../../../__tests__/logger-adapter-mock.factory.js';
import { LoggerService } from './logger.service.js';
import type { LoggerAdapter } from './adapters/logger.adapter.js';

describe('LoggerService', () => {
  let loggerAdapter1: Mocked<LoggerAdapter>;
  let loggerAdapter2: Mocked<LoggerAdapter>;
  let loggerService: LoggerService;

  beforeEach(() => {
    loggerAdapter1 = LoggerAdapterMockFactory.create({
      getFormat: 'test-1',
    });
    loggerAdapter2 = LoggerAdapterMockFactory.create({
      getFormat: 'test-2',
    });

    loggerService = new LoggerService([loggerAdapter1, loggerAdapter2]);
  });

  describe('getSupportedFormats', () => {
    it('should return all supported formats from adapters', () => {
      const formats = loggerService.getSupportedFormats();

      expect(formats).toEqual(['test-1', 'test-2']);
    });

    it('should call getFormat on each adapter', () => {
      loggerService.getSupportedFormats();

      expect(loggerAdapter1.getFormat).toHaveBeenCalled();
      expect(loggerAdapter2.getFormat).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should use first adapter when format is undefined', () => {
      const message = 'Debug message';
      loggerService.debug(message, undefined);

      expect(loggerAdapter1.debug).toHaveBeenCalledWith(message);
    });

    it('should use specific adapter when format is provided', () => {
      const message = 'Debug message';
      loggerService.debug(message, 'test-2');

      expect(loggerAdapter2.debug).toHaveBeenCalledWith(message);
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

      expect(loggerAdapter1.info).toHaveBeenCalledWith(message);
    });

    it('should use specific adapter when format is provided', () => {
      const message = 'Info message';
      loggerService.info(message, 'test-2');

      expect(loggerAdapter2.info).toHaveBeenCalledWith(message);
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

      expect(loggerAdapter1.warn).toHaveBeenCalledWith(message);
    });

    it('should use specific adapter when format is provided', () => {
      const message = 'Warning message';
      loggerService.warn(message, 'test-2');

      expect(loggerAdapter2.warn).toHaveBeenCalledWith(message);
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

      expect(loggerAdapter1.error).toHaveBeenCalledWith(message);
    });

    it('should use specific adapter when format is provided', () => {
      const message = 'Error message';
      loggerService.error(message, 'test-2');

      expect(loggerAdapter2.error).toHaveBeenCalledWith(message);
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

      expect(loggerAdapter1.result).toHaveBeenCalledWith(data);
    });

    it('should use specific adapter when format is provided', () => {
      const data = { key: 'value' };
      loggerService.result(data, 'test-2');

      expect(loggerAdapter2.result).toHaveBeenCalledWith(data);
    });

    it('should throw error for unsupported format', () => {
      const data = { key: 'value' };

      expect(() => loggerService.result(data, 'badformat')).toThrow('Unsupported output format: badformat');
    });
  });

  describe('getLogger private method', () => {
    it('should handle case where no adapters are provided', () => {
      const emptyLoggerService = new LoggerService([]);

      expect(() => emptyLoggerService.debug('test', undefined)).toThrow("No logger adapters are configured");
    });
  });
});