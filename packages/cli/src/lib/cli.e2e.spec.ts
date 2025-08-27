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
import { resetGlobalContainer } from './global-container.js';

describe('CLI', () => {
  const originalArgv = process.argv.slice();
  let consoleLogSpy: MockInstance<typeof console.log>;
  let consoleDebugSpy: MockInstance<typeof console.debug>;
  let consoleErrorSpy: MockInstance<typeof console.error>;
  let processStdoutSpy: MockInstance<typeof process.stdout.write>;
  let processExitSpy: MockInstance<typeof process.exit>;

  beforeEach(() => {
    // Reset console mocks
    vi.clearAllMocks();

    resetGlobalContainer();

    // Mock console.log to capture output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation - intentionally empty
    });

    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
      // Mock implementation - intentionally empty
    });

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation - intentionally empty
    });

    processStdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => {
      // Mock implementation - intentionally empty
      return true;
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
    resetGlobalContainer();
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
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      expect(consoleLogSpy).toBeCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][0]).toMatchSnapshot();

      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should display generate command usage', async () => {
      // Mock process.argv to simulate generate command
      process.argv = ['node', 'ci-dokumentor', 'help', 'generate'];

      // Act
      await expect(cli()).rejects.toThrow("process.exit: 0");

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();

      expect(processStdoutSpy).toHaveBeenCalled();
      expect(processStdoutSpy.mock.calls[0][0]).toMatchSnapshot();

      expect(processExitSpy).toHaveBeenCalledWith(0);
    });
  });
});
