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
import { ConsoleMockFactory, MockedConsole } from '../../__tests__/console-mock.factory.js';

describe('CLI', () => {
  const originalArgv = process.argv.slice();
  let consoleMock: MockedConsole;
  let processExitSpy: MockInstance<typeof process.exit>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    resetGlobalContainer();

    // Mock console methods
    consoleMock = ConsoleMockFactory.create();

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
      expect(consoleMock.error).not.toHaveBeenCalled();
      expect(consoleMock.debug).not.toHaveBeenCalled();

      expect(consoleMock.info).toBeCalledTimes(1);
      expect(consoleMock.info.mock.calls[0][0]).toMatchSnapshot();

      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should display generate command usage', async () => {
      // Mock process.argv to simulate generate command
      process.argv = ['node', 'ci-dokumentor', 'help', 'generate'];

      // Act
      await expect(cli()).rejects.toThrow("process.exit: 0");

      // Assert
      expect(consoleMock.error).not.toHaveBeenCalled();
      expect(consoleMock.debug).not.toHaveBeenCalled();

      expect(consoleMock.info.mock.calls[0][0]).toMatchSnapshot();

      expect(processExitSpy).toHaveBeenCalledWith(0);
    });
  });
});
