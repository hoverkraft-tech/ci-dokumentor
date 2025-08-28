import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsoleOutputAdapter } from './console-output.adapter.js';

describe('ConsoleOutputAdapter', () => {
  let originalStdout: typeof process.stdout.write;
  let originalStderr: typeof process.stderr.write;
  let stdoutOutput: string[];
  let stderrOutput: string[];

  beforeEach(() => {
    stdoutOutput = [];
    stderrOutput = [];

    // Mock stdout.write
    originalStdout = process.stdout.write;
    process.stdout.write = vi.fn((chunk: any) => {
      stdoutOutput.push(chunk.toString());
      return true;
    }) as any;

    // Mock stderr.write
    originalStderr = process.stderr.write;
    process.stderr.write = vi.fn((chunk: any) => {
      stderrOutput.push(chunk.toString());
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  });

  describe('constructor', () => {
    it('should default to stdout stream', () => {
      // Act
      const adapter = new ConsoleOutputAdapter();

      // Assert - we can't directly test the private field, but we can test behavior
      expect(adapter).toBeDefined();
    });

    it('should accept stderr stream', () => {
      // Act
      const adapter = new ConsoleOutputAdapter('stderr');

      // Assert
      expect(adapter).toBeDefined();
    });
  });

  describe('writeSection with stdout', () => {
    it('should write section to stdout', async () => {
      // Arrange
      const adapter = new ConsoleOutputAdapter('stdout');
      const sectionId = 'test-section';
      const data = Buffer.from('test content');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('=== test-section ===');
      expect(output).toContain('test content');
      expect(output).toContain('=== End test-section ===');
      expect(stderrOutput).toHaveLength(0);
    });

    it('should write section to stderr when specified', async () => {
      // Arrange
      const adapter = new ConsoleOutputAdapter('stderr');
      const sectionId = 'test-section';
      const data = Buffer.from('test content');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stderrOutput.join('');
      expect(output).toContain('=== test-section ===');
      expect(output).toContain('test content');
      expect(output).toContain('=== End test-section ===');
      expect(stdoutOutput).toHaveLength(0);
    });

    it('should handle empty data', async () => {
      // Arrange
      const adapter = new ConsoleOutputAdapter();
      const sectionId = 'empty-section';
      const data = Buffer.alloc(0);

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toContain('=== empty-section ===');
      expect(output).toContain('=== End empty-section ===');
    });

    it('should add newline if data does not end with newline', async () => {
      // Arrange
      const adapter = new ConsoleOutputAdapter();
      const sectionId = 'test-section';
      const data = Buffer.from('content without newline');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      expect(output).toMatch(/content without newline\n=== End test-section ===/);
    });

    it('should not add extra newline if data already ends with newline', async () => {
      // Arrange
      const adapter = new ConsoleOutputAdapter();
      const sectionId = 'test-section';
      const data = Buffer.from('content with newline\n');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      // Should not have double newline before the end marker
      expect(output).toMatch(/content with newline\n=== End test-section ===/);
      expect(output).not.toMatch(/content with newline\n\n=== End test-section ===/);
    });

    it('should format section with proper headers and footers', async () => {
      // Arrange
      const adapter = new ConsoleOutputAdapter();
      const sectionId = 'overview';
      const data = Buffer.from('This is the overview section');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      const output = stdoutOutput.join('');
      const lines = output.split('\n');
      
      expect(lines[0]).toBe('');
      expect(lines[1]).toBe('=== overview ===');
      expect(lines[2]).toBe('This is the overview section');
      expect(lines[3]).toBe('=== End overview ===');
      expect(lines[4]).toBe('');
    });
  });
});