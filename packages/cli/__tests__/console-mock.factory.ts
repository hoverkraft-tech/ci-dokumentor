import type { Mocked } from "vitest";

export class ConsoleMockFactory {

    static create(): Mocked<Console> {

        // Mock console.log to capture output
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
            // Mock implementation - intentionally empty
        });

        const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
            // Mock implementation - intentionally empty
        });

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Mock implementation - intentionally empty
        });

        return {
            log: consoleLogSpy,
            debug: consoleDebugSpy,
            error: consoleErrorSpy,
        } as Mocked<Console>
    }
}