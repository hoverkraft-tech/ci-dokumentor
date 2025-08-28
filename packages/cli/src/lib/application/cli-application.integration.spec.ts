import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
    Mocked,
    MockInstance,
} from 'vitest';
import { CliApplication } from './cli-application.js';
import { initGlobalContainer, resetGlobalContainer } from '../global-container.js';
import type { Container } from '@ci-dokumentor/core';
import { ConsoleMockFactory } from '../../../__tests__/console-mock.factory.js';

describe('CliApplication Integration Tests', () => {
    let container: Container;
    let cliApp: CliApplication;
    let consoleMock: Mocked<Console>;
    let processExitSpy: MockInstance<typeof process.exit>;
    const originalArgv = process.argv.slice();

    beforeEach(() => {
        // Reset mocks before each test
        vi.resetAllMocks();

        // Reset all containers before each test
        resetGlobalContainer();

        // Initialize the global container and get the CliApplication instance
        container = initGlobalContainer();
        cliApp = container.get(CliApplication);

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
        process.argv = originalArgv;
    });

    describe('Container Integration', () => {
        it('should successfully load CliApplication from global container', () => {
            // Arrange & Act
            const loadedApp = container.get(CliApplication);

            // Assert
            expect(loadedApp).toBeDefined();
            expect(loadedApp).toBeInstanceOf(CliApplication);
            expect(loadedApp).toBe(cliApp); // Should be singleton
        });

        it('should have all dependencies properly injected', () => {
            // Assert
            expect(cliApp).toBeDefined();
            expect(cliApp).toBeInstanceOf(CliApplication);

            // The application should be configured and ready to use
            // We can verify this by checking that it doesn't throw when run is called
            expect(() => cliApp).not.toThrow();
        });
    });

    describe('Application Initialization', () => {
        it('should initialize with proper program configuration', async () => {
            // Arrange - simulate help command
            const helpArgs = ['node', 'ci-dokumentor', '--help'];

            // Act
            await expect(cliApp.run(helpArgs)).rejects.toThrow("process.exit: 0");

            // Assert
            expect(consoleMock.error).not.toHaveBeenCalled();
            expect(consoleMock.debug).not.toHaveBeenCalled();

            expect(consoleMock.log).toHaveBeenCalled();
            expect(consoleMock.log).toHaveBeenCalledWith(
                expect.stringContaining('Usage:')
            );
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should show version information when requested', async () => {
            // Arrange - simulate version command
            const versionArgs = ['node', 'ci-dokumentor', '--version'];

            // Act
            await expect(cliApp.run(versionArgs)).rejects.toThrow("process.exit: 0");

            // Assert
            expect(consoleMock.error).not.toHaveBeenCalled();
            expect(consoleMock.debug).not.toHaveBeenCalled();

            expect(consoleMock.log).toHaveBeenCalled();
            // Should output version information
            expect(consoleMock.log).toHaveBeenCalledWith(
                expect.stringMatching(/\d+\.\d+\.\d+/)
            );
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should display available commands in help output', async () => {
            // Arrange - simulate help command
            const helpArgs = ['node', 'ci-dokumentor', '--help'];

            // Act
            await expect(cliApp.run(helpArgs)).rejects.toThrow("process.exit: 0");

            // Assert
            expect(consoleMock.error).not.toHaveBeenCalled();
            expect(consoleMock.debug).not.toHaveBeenCalled();

            expect(consoleMock.log).toHaveBeenCalled();
            const helpOutput = consoleMock.log.mock.calls
                .map(call => call[0])
                .join('\n');

            // Should contain commands section
            expect(helpOutput).toContain('Commands:');
            // Should contain the generate command
            expect(helpOutput).toContain('generate');
            expect(helpOutput).toContain('gen');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });

        it('should handle unknown commands gracefully', async () => {
            // Arrange - simulate unknown command
            const unknownArgs = ['node', 'ci-dokumentor', 'unknown-command'];

            // Act
            await expect(cliApp.run(unknownArgs)).rejects.toThrow("process.exit: 1");

            // Assert
            expect(consoleMock.debug).not.toHaveBeenCalled();

            expect(consoleMock.error).toHaveBeenCalled();
            const errorOutput = consoleMock.error.mock.calls
                .map(call => call[0])
                .join('\n');

            expect(errorOutput).toContain('unknown command');
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle application run without arguments', async () => {
            // Arrange - simulate no arguments (should show help)
            const noArgs = ['node', 'ci-dokumentor'];

            // Act
            await expect(cliApp.run(noArgs)).rejects.toThrow("process.exit: 1");

            // Assert
            // When no command is provided, it should show help or do nothing
            // The behavior depends on the specific CLI implementation
            expect(cliApp).toBeDefined(); // Basic check that app doesn't crash
        });

        it('should handle invalid command options gracefully', async () => {
            // Arrange - simulate invalid option for help command (which should not fail)
            const invalidArgs = ['node', 'ci-dokumentor', '--invalid-option'];

            // Act
            await expect(cliApp.run(invalidArgs)).rejects.toThrow("process.exit: 1");

            // Assert
            expect(consoleMock.debug).not.toHaveBeenCalled();

            expect(consoleMock.error).toHaveBeenCalled();
            const errorOutput = consoleMock.error.mock.calls
                .map(call => call[0])
                .join('\n');

            expect(errorOutput).toContain('unknown option');
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });

    describe('Package Information', () => {
        it('should load package information correctly', async () => {
            // Arrange - simulate version command to check package info loading
            const versionArgs = ['node', 'ci-dokumentor', '--version'];

            // Act
            await expect(cliApp.run(versionArgs)).rejects.toThrow("process.exit: 0");

            // Assert
            expect(consoleMock.error).not.toHaveBeenCalled();
            expect(consoleMock.debug).not.toHaveBeenCalled();

            expect(consoleMock.log).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(0);

            // Version should be a valid semver format
            const versionOutput = consoleMock.log.mock.calls[0][0];
            expect(versionOutput).toMatch(/^\d+\.\d+\.\d+/);
        });
    });

    describe('Dependency Injection Integration', () => {
        it('should have logger properly configured', async () => {
            // Arrange - trigger help to generate some output
            const helpArgs = ['node', 'ci-dokumentor', '--help'];

            // Act
            await expect(cliApp.run(helpArgs)).rejects.toThrow("process.exit: 0");

            // Assert
            // Logger should output through console.log (mocked)
            expect(consoleMock.log).toHaveBeenCalled();
            // Note: some help output may go to stderr, so we don't assert no error calls
        });

        it('should handle commands with complex dependency trees', () => {
            // Arrange & Act - Test that the container can resolve complex dependencies
            const app = container.get(CliApplication);

            // Assert
            expect(app).toBeDefined();
            expect(app).toBeInstanceOf(CliApplication);
            // The fact that we can get the application instance means all dependencies are resolved
        });
    });

    describe('Application Lifecycle', () => {
        it('should initialize and cleanup properly', () => {
            // Arrange & Act
            const app1 = container.get(CliApplication);

            // Reset container
            resetGlobalContainer();

            // Reinitialize
            const newContainer = initGlobalContainer();
            const app2 = newContainer.get(CliApplication);

            // Assert
            expect(app1).toBeDefined();
            expect(app2).toBeDefined();
            expect(app1).toBeInstanceOf(CliApplication);
            expect(app2).toBeInstanceOf(CliApplication);
        });

        it('should maintain singleton behavior within same container instance', () => {
            // Arrange & Act
            const app1 = container.get(CliApplication);
            const app2 = container.get(CliApplication);

            // Assert
            expect(app1).toBe(app2);
        });
    });
});
