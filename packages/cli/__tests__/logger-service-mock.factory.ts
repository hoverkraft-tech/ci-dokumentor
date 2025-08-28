import { Mocked } from "vitest";
import { LoggerService } from "../src/lib/logger/logger.service.js";

type LoggerServiceDefaults = Partial<{
    getSupportedFormats: ReturnType<LoggerService['getSupportedFormats']>;
    info: ReturnType<LoggerService['info']>;
    debug: ReturnType<LoggerService['debug']>;
    warn: ReturnType<LoggerService['warn']>;
    error: ReturnType<LoggerService['error']>;
    result: ReturnType<LoggerService['result']>;
}>;

export class LoggerServiceMockFactory {
    static create(defaults?: LoggerServiceDefaults): Mocked<LoggerService> {
        const mock = {
            getSupportedFormats: vi.fn() as Mocked<LoggerService['getSupportedFormats']>,
            info: vi.fn() as Mocked<LoggerService['info']>,
            debug: vi.fn() as Mocked<LoggerService['debug']>,
            warn: vi.fn() as Mocked<LoggerService['warn']>,
            error: vi.fn() as Mocked<LoggerService['error']>,
            result: vi.fn() as Mocked<LoggerService['result']>,
        } as Mocked<LoggerService>;

        if (defaults?.getSupportedFormats) {
            mock.getSupportedFormats = vi.fn().mockReturnValue(defaults.getSupportedFormats);
        }

        if (defaults?.info) {
            mock.info = vi.fn().mockImplementation(defaults.info);
        }

        if (defaults?.debug) {
            mock.debug = vi.fn().mockImplementation(defaults.debug);
        }

        if (defaults?.warn) {
            mock.warn = vi.fn().mockImplementation(defaults.warn);
        }

        if (defaults?.error) {
            mock.error = vi.fn().mockImplementation(defaults.error);
        }

        if (defaults?.result) {
            mock.result = vi.fn().mockImplementation(defaults.result);
        }

        return mock;
    }
}
