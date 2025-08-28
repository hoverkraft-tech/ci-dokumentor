import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JsonOutputAdapter, JsonOutput } from './json-output.adapter.js';
import { writeFile } from 'node:fs/promises';

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
}));

describe('JsonOutputAdapter', () => {
  let originalStdout: typeof process.stdout.write;
  let originalStderr: typeof process.stderr.write;
  let stdoutOutput: string[];
  let stderrOutput: string[];

  beforeEach(() => {
    stdoutOutput = [];
    stderrOutput = [];
    vi.clearAllMocks();

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

  describe('writeSection to file', () => {
    it('should write JSON output to file', async () => {
      // Arrange
      const filePath = '/path/to/output.json';
      const adapter = new JsonOutputAdapter(filePath);
      const sectionId = 'test-section';
      const data = Buffer.from('test content');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      expect(writeFile).toHaveBeenCalledOnce();
      const [path, content] = (writeFile as any).mock.calls[0];
      expect(path).toBe(filePath);
      
      const parsedOutput: JsonOutput = JSON.parse(content);
      expect(parsedOutput.sections[sectionId]).toBe('test content');
      expect(parsedOutput.metadata.format).toBe('json');
      expect(parsedOutput.metadata.timestamp).toBeDefined();
    });

    it('should accumulate multiple sections in file', async () => {
      // Arrange
      const filePath = '/path/to/output.json';
      const adapter = new JsonOutputAdapter(filePath);

      // Act
      await adapter.writeSection('section1', Buffer.from('content1'));
      await adapter.writeSection('section2', Buffer.from('content2'));

      // Assert
      expect(writeFile).toHaveBeenCalledTimes(2);
      const [, finalContent] = (writeFile as any).mock.calls[1];
      
      const parsedOutput: JsonOutput = JSON.parse(finalContent);
      expect(parsedOutput.sections.section1).toBe('content1');
      expect(parsedOutput.sections.section2).toBe('content2');
    });
  });

  describe('writeSection to stdout', () => {
    it('should write JSON output to stdout', async () => {
      // Arrange
      const adapter = new JsonOutputAdapter('stdout');
      const sectionId = 'test-section';
      const data = Buffer.from('test content');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      expect(stdoutOutput).toHaveLength(1);
      const output = stdoutOutput[0];
      
      const parsedOutput: JsonOutput = JSON.parse(output.trim());
      expect(parsedOutput.sections[sectionId]).toBe('test content');
      expect(parsedOutput.metadata.format).toBe('json');
      expect(stderrOutput).toHaveLength(0);
    });

    it('should accumulate sections before writing to stdout', async () => {
      // Arrange
      const adapter = new JsonOutputAdapter('stdout');

      // Act
      await adapter.writeSection('section1', Buffer.from('content1'));
      await adapter.writeSection('section2', Buffer.from('content2'));

      // Assert
      expect(stdoutOutput).toHaveLength(2);
      const finalOutput = stdoutOutput[1];
      
      const parsedOutput: JsonOutput = JSON.parse(finalOutput.trim());
      expect(parsedOutput.sections.section1).toBe('content1');
      expect(parsedOutput.sections.section2).toBe('content2');
    });
  });

  describe('writeSection to stderr', () => {
    it('should write JSON output to stderr', async () => {
      // Arrange
      const adapter = new JsonOutputAdapter('stderr');
      const sectionId = 'test-section';
      const data = Buffer.from('test content');

      // Act
      await adapter.writeSection(sectionId, data);

      // Assert
      expect(stderrOutput).toHaveLength(1);
      const output = stderrOutput[0];
      
      const parsedOutput: JsonOutput = JSON.parse(output.trim());
      expect(parsedOutput.sections[sectionId]).toBe('test content');
      expect(parsedOutput.metadata.format).toBe('json');
      expect(stdoutOutput).toHaveLength(0);
    });
  });

  describe('JSON format validation', () => {
    it('should produce valid JSON with proper structure', async () => {
      // Arrange
      const adapter = new JsonOutputAdapter('stdout');
      const now = Date.now();

      // Act
      await adapter.writeSection('overview', Buffer.from('Overview content'));

      // Assert
      const output = stdoutOutput[0];
      const parsedOutput: JsonOutput = JSON.parse(output.trim());
      
      expect(parsedOutput).toHaveProperty('sections');
      expect(parsedOutput).toHaveProperty('metadata');
      expect(parsedOutput.metadata).toHaveProperty('timestamp');
      expect(parsedOutput.metadata).toHaveProperty('format');
      expect(parsedOutput.metadata.format).toBe('json');
      
      // Timestamp should be recent
      const timestamp = new Date(parsedOutput.metadata.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(now);
    });

    it('should handle empty content', async () => {
      // Arrange
      const adapter = new JsonOutputAdapter('stdout');

      // Act
      await adapter.writeSection('empty', Buffer.alloc(0));

      // Assert
      const output = stdoutOutput[0];
      const parsedOutput: JsonOutput = JSON.parse(output.trim());
      
      expect(parsedOutput.sections.empty).toBe('');
    });

    it('should handle special characters in content', async () => {
      // Arrange
      const adapter = new JsonOutputAdapter('stdout');
      const specialContent = 'Content with "quotes", newlines\nand\ttabs';

      // Act
      await adapter.writeSection('special', Buffer.from(specialContent));

      // Assert
      const output = stdoutOutput[0];
      const parsedOutput: JsonOutput = JSON.parse(output.trim());
      
      expect(parsedOutput.sections.special).toBe(specialContent);
    });
  });
});