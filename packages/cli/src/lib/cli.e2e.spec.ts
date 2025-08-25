import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  MockInstance,
} from 'vitest';
import { cli } from './cli.js';

describe('CLI', () => {
  const originalArgv = process.argv.slice();
  let consoleLogSpy: MockInstance<typeof console.log>;
  let consoleErrorSpy: MockInstance<typeof console.error>;
  let processExitSpy: MockInstance<typeof process.exit>;

  beforeEach(() => {
    // Reset console mocks
    vi.clearAllMocks();

    // Mock console.log to capture output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation - intentionally empty
    });

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation - intentionally empty
    });

    const processExitMock = ((code?: number | string | null | undefined) => {
      throw new Error('process.exit: ' + code);
    }) as unknown as typeof process.exit;

    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(processExitMock);
  });

  afterEach(() => {
    vi.resetAllMocks();
    process.argv = originalArgv;
  });

  describe('cli function', () => {
    it('should create and run CLI application', async () => {
      // Arrange
      // Mock process.argv to simulate help command
      process.argv = ['node', 'ci-dokumentor', 'help'];

      // Act
      await expect(cli()).rejects.toThrow("process.exit: 0");

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage:')
      );
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });
  });
});
