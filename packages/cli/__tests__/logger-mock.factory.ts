import { Logger } from "../src/lib/interfaces/logger.interface.js";
import type { Mocked } from "vitest";

export class LoggerMockFactory {
    static create(): Mocked<Logger> {
        return {
            info: vi.fn() as Mocked<Logger['info']>,
            debug: vi.fn() as Mocked<Logger['debug']>,
            error: vi.fn() as Mocked<Logger['error']>,
            log: vi.fn() as Mocked<Logger['log']>,
            warn: vi.fn() as Mocked<Logger['warn']>,
        } as Mocked<Logger>;
    }
}
