import type { Mocked } from "vitest";

export type MockedConsole = Mocked<Pick<Console, 'info' | 'debug' | 'error'>>;

export class ConsoleMockFactory {

    static create(): MockedConsole {
        const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {
            // Mock implementation - intentionally empty
        });

        const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
            // Mock implementation - intentionally empty
        });

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Mock implementation - intentionally empty
        });

        return {
            info: consoleInfoSpy as Mocked<Console>['info'],
            debug: consoleDebugSpy as Mocked<Console>['debug'],
            error: consoleErrorSpy as Mocked<Console>['error'],
        }
    }
}