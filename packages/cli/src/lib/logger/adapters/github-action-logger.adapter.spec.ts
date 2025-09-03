import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubActionLoggerAdapter } from './github-action-logger.adapter.js';
import { ConsoleMockFactory, MockedConsole } from '../../../../__tests__/console-mock.factory.js';
import mockFs from 'mock-fs';
import { readFileSync } from 'fs';

describe('GitHubActionLoggerAdapter', () => {
  let githubActionLoggerAdapter: GitHubActionLoggerAdapter;
  let consoleMock: MockedConsole;
  let githubOutputPath: string;

  beforeEach(() => {
    githubOutputPath = `/tmp/ci-dokumentor-test-output.txt`;
    // Use mock-fs to create a virtual file for GITHUB_OUTPUT
    mockFs({ [githubOutputPath]: '' });

    githubActionLoggerAdapter = new GitHubActionLoggerAdapter(githubOutputPath);
    consoleMock = ConsoleMockFactory.create();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockFs.restore();
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

      expect(consoleMock.error).toHaveBeenCalledWith('::debug::Debug message');
    });
  });

  describe('info', () => {
    it('should log info message without GitHub Actions command', () => {
      const message = 'Info message';
      githubActionLoggerAdapter.info(message);

      expect(consoleMock.log).toHaveBeenCalledWith('Info message');
    });
  });

  describe('warn', () => {
    it('should log warning message with GitHub Actions warning command', () => {
      const message = 'Warning message';
      githubActionLoggerAdapter.warn(message);

      expect(consoleMock.error).toHaveBeenCalledWith('::warning::Warning message');
    });
  });

  describe('error', () => {
    it('should log error message with GitHub Actions error command', () => {
      const message = 'Error message';
      githubActionLoggerAdapter.error(message);

      expect(consoleMock.error).toHaveBeenCalledWith('::error::Error message');
    });
  });

  describe('result', () => {
    it('should write object result to GITHUB_OUTPUT file', () => {
      const data = { key: 'value', number: 42, nested: { prop: 'test' } };
      githubActionLoggerAdapter.result(data);

      const contents = readFileSync(githubOutputPath, { encoding: 'utf8' });
      expect(contents).toContain('key=value\n');
      expect(contents).toContain('number=42\n');
      expect(contents).toContain('nested={"prop":"test"}\n');
    });

    it('should write string result to GITHUB_OUTPUT file', () => {
      const data = 'Simple result';
      githubActionLoggerAdapter.result(data);
      const contents = readFileSync(githubOutputPath, { encoding: 'utf8' });
      expect(contents).toContain('result=Simple result\n');
    });

    it('should write number result to GITHUB_OUTPUT file', () => {
      const data = 123;
      githubActionLoggerAdapter.result(data);
      const contents = readFileSync(githubOutputPath, { encoding: 'utf8' });
      expect(contents).toContain('result=123\n');
    });

    it('should write null result to GITHUB_OUTPUT file', () => {
      const data = null;
      githubActionLoggerAdapter.result(data);
      const contents = readFileSync(githubOutputPath, { encoding: 'utf8' });
      expect(contents).toContain('result=null\n');
    });

    it('should write boolean result to GITHUB_OUTPUT file', () => {
      const data = true;
      githubActionLoggerAdapter.result(data);
      const contents = readFileSync(githubOutputPath, { encoding: 'utf8' });
      expect(contents).toContain('result=true\n');
    });

    it('should write array result to GITHUB_OUTPUT file', () => {
      const data = [1, 2, 3];
      githubActionLoggerAdapter.result(data);
      const contents = readFileSync(githubOutputPath, { encoding: 'utf8' });
      expect(contents).toContain('result=[1,2,3]\n');
    });

    it('should handle object with string values', () => {
      const data = {
        status: 'success',
        message: 'Operation completed',
        count: '5'
      };
      githubActionLoggerAdapter.result(data);
      const contents = readFileSync(githubOutputPath, { encoding: 'utf8' });
      expect(contents).toContain('status=success\n');
      expect(contents).toContain('message=Operation completed\n');
      expect(contents).toContain('count=5\n');
    });

    it('should handle empty object', () => {
      const data = {};
      githubActionLoggerAdapter.result(data);
      const contents = readFileSync(githubOutputPath, { encoding: 'utf8' });
      expect(contents).toBe('');
    });
  });
});