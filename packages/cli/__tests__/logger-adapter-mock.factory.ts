import { LoggerAdapter } from "../src/lib/logger/adapters/logger.adapter.js";
import type { Mocked } from "vitest";

type LoggerAdapterDefaults = Partial<{
    getFormat: ReturnType<LoggerAdapter['getFormat']>;
    info: ReturnType<LoggerAdapter['info']>;
    debug: ReturnType<LoggerAdapter['debug']>;
    warn: ReturnType<LoggerAdapter['warn']>;
    error: ReturnType<LoggerAdapter['error']>;
    result: ReturnType<LoggerAdapter['result']>;
}>;

export class LoggerAdapterMockFactory {
    static create(defaults?: LoggerAdapterDefaults): Mocked<LoggerAdapter> {
        const mock = {
            getFormat: vi.fn() as Mocked<LoggerAdapter['getFormat']>,
            info: vi.fn() as Mocked<LoggerAdapter['info']>,
            debug: vi.fn() as Mocked<LoggerAdapter['debug']>,
            warn: vi.fn() as Mocked<LoggerAdapter['warn']>,
            error: vi.fn() as Mocked<LoggerAdapter['error']>,
            result: vi.fn() as Mocked<LoggerAdapter['result']>,
        } as Mocked<LoggerAdapter>;

        if (defaults?.getFormat) {
            mock.getFormat.mockReturnValue(defaults.getFormat);
        }
        if (defaults?.info) {
            mock.info.mockReturnValue(defaults.info);
        }
        if (defaults?.debug) {
            mock.debug.mockReturnValue(defaults.debug);
        }
        if (defaults?.warn) {
            mock.warn.mockReturnValue(defaults.warn);
        }
        if (defaults?.error) {
            mock.error.mockReturnValue(defaults.error);
        }
        if (defaults?.result) {
            mock.result.mockReturnValue(defaults.result);
        }

        return mock;
    }
}
