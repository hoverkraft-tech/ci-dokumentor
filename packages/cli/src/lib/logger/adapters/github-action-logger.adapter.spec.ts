import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubActionLoggerAdapter } from './github-action-logger.adapter.js';

describe('GitHubActionLoggerAdapter', () => {
  let githubActionLoggerAdapter: GitHubActionLoggerAdapter;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    githubActionLoggerAdapter = new GitHubActionLoggerAdapter();
    
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFormat', () => {
    it('should return "github-action" as the format', () => {
      expect(githubActionLoggerAdapter.getFormat()).toBe('github-action');
    });
  });

  describe('debug', () => {
    it('should log debug message with GitHub Actions debug command', () => {
      const message = 'Debug message';
      githubActionLoggerAdapter.debug(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('::debug::Debug message');
    });
  });

  describe('info', () => {
    it('should log info message without GitHub Actions command', () => {
      const message = 'Info message';
      githubActionLoggerAdapter.info(message);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Info message');
    });
  });

  describe('warn', () => {
    it('should log warning message with GitHub Actions warning command', () => {
      const message = 'Warning message';
      githubActionLoggerAdapter.warn(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('::warning::Warning message');
    });
  });

  describe('error', () => {
    it('should log error message with GitHub Actions error command', () => {
      const message = 'Error message';
      githubActionLoggerAdapter.error(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('::error::Error message');
    });
  });

  describe('result', () => {
    it('should log object result as GitHub Actions set-output commands', () => {
      const data = { key: 'value', number: 42, nested: { prop: 'test' } };
      githubActionLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=key::value');
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=number::42');
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=nested::{"prop":"test"}');
    });

    it('should log string result as single set-output command', () => {
      const data = 'Simple result';
      githubActionLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=result::Simple result');
    });

    it('should log number result as single set-output command', () => {
      const data = 123;
      githubActionLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=result::123');
    });

    it('should log null result as single set-output command', () => {
      const data = null;
      githubActionLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=result::null');
    });

    it('should log boolean result as single set-output command', () => {
      const data = true;
      githubActionLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=result::true');
    });

    it('should handle object with string values', () => {
      const data = { 
        status: 'success', 
        message: 'Operation completed',
        count: '5'
      };
      githubActionLoggerAdapter.result(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=status::success');
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=message::Operation completed');
      expect(consoleLogSpy).toHaveBeenCalledWith('::set-output name=count::5');
    });

    it('should handle empty object', () => {
      const data = {};
      githubActionLoggerAdapter.result(data);
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});