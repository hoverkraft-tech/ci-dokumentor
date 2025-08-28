import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GithubActionOutputAdapter } from './github-action-output.adapter.js';

describe('GithubActionOutputAdapter', () => {
  let originalStdout: typeof process.stdout.write;
  let stdoutOutput: string[];

  beforeEach(() => {
    stdoutOutput = [];

    // Mock stdout.write
    originalStdout = process.stdout.write;
    process.stdout.write = vi.fn((chunk: any) => {
      stdoutOutput.push(chunk.toString());
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stdout.write = originalStdout;
  });

  describe('writeSection', () => {
    it('should write GitHub Actions output format', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const sectionId = 'overview';
      const data = Buffer.from('This is the overview section');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('::set-output name=overview::This is the overview section');
      expect(output).toContain('::group::📝 overview');
      expect(output).toContain('This is the overview section');
      expect(output).toContain('::endgroup::');
    });

    it('should escape special characters for GitHub Actions output', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const sectionId = 'test';
      const data = Buffer.from('Content with\nnewlines\rand%percent');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('::set-output name=test::Content with%0Anewlines%0Dand%25percent');
    });

    it('should handle empty content', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const sectionId = 'empty';
      const data = Buffer.alloc(0);

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('::set-output name=empty::');
      // Should not create group for empty content
      expect(output).not.toContain('::group::');
      expect(output).not.toContain('::endgroup::');
    });

    it('should handle whitespace-only content', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const sectionId = 'whitespace';
      const data = Buffer.from('   \n  \t  ');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('::set-output name=whitespace::');
      // Should not create group for whitespace-only content
      expect(output).not.toContain('::group::');
      expect(output).not.toContain('::endgroup::');
    });

    it('should add newline if content does not end with one', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const sectionId = 'no-newline';
      const data = Buffer.from('content without newline');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toMatch(/content without newline\n::endgroup::/);
    });

    it('should not add extra newline if content already ends with one', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const sectionId = 'with-newline';
      const data = Buffer.from('content with newline\n');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toMatch(/content with newline\n::endgroup::/);
      expect(output).not.toMatch(/content with newline\n\n::endgroup::/);
    });

    it('should write multiple sections', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();

      // Act
      await adapter.writeSection('section1', Buffer.from('Content 1'));
      await adapter.writeSection('section2', Buffer.from('Content 2'));

      // Assert
      const output = stdoutOutput.join('');
      
      expect(output).toContain('::set-output name=section1::Content 1');
      expect(output).toContain('::group::📝 section1');
      expect(output).toContain('Content 1');
      
      expect(output).toContain('::set-output name=section2::Content 2');
      expect(output).toContain('::group::📝 section2');
      expect(output).toContain('Content 2');
      
      // Should have two endgroup commands
      const endGroupCount = (output.match(/::endgroup::/g) || []).length;
      expect(endGroupCount).toBe(2);
    });
  });

  describe('escapeGitHubActionsData', () => {
    it('should escape percent signs first', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const data = Buffer.from('%0A'); // This contains both % and the result of \n escaping

      // Act
      await adapter.writeSection('test', data);

      // Assert
      const output = stdoutOutput.join('');
      // % should be escaped to %25, then 0A should remain as 0A
      expect(output).toContain('::set-output name=test::%250A');
    });

    it('should escape newlines to %0A', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const data = Buffer.from('line1\nline2');

      // Act
      await adapter.writeSection('test', data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('::set-output name=test::line1%0Aline2');
    });

    it('should escape carriage returns to %0D', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const data = Buffer.from('line1\rline2');

      // Act
      await adapter.writeSection('test', data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('::set-output name=test::line1%0Dline2');
    });

    it('should escape all special characters together', async () => {
      // Arrange
      const adapter = new GithubActionOutputAdapter();
      const data = Buffer.from('100%\r\n complete');

      // Act
      await adapter.writeSection('test', data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('::set-output name=test::100%25%0D%0A complete');
    });
  });
});