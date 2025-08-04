import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { cli } from './cli.js';

describe('CLI', () => {
  const originalArgv = process.argv.slice();
  let consoleLogSpy: MockInstance<typeof console.log>;
  let processExitSpy: MockInstance<typeof process.exit>;

  beforeEach(() => {
    // Reset console mocks
    vi.clearAllMocks();

    // Mock console.log to capture output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation - intentionally empty
    });

    const processExitMock = (() => {
      // Do nothing on exit
    }) as unknown as typeof process.exit;

    processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(processExitMock);
  });

  afterEach(() => {
    vi.resetAllMocks();
    process.argv = originalArgv;
  });

  describe('cli function', () => {
    it('should create and run CLI application', async () => {
      // Arrange
      // Mock process.argv to simulate version command instead of help
      process.argv = ['node', 'ci-dokumentor', '--version'];

      // Act
      await cli();

      // Assert - version output goes to console.log via writeOut configuration
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('0.0.1'));
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

  });
});
