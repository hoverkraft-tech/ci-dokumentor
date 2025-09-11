import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import type { FormatterService } from '../src/formatter/formatter.service.js';

export interface FormatterServiceDefaults {
    getFormatterAdapterForFile: ReturnType<FormatterService['getFormatterAdapterForFile']>
}

export class FormatterServiceMockFactory {
    static create(defaults?: Partial<FormatterServiceDefaults>): Mocked<FormatterService> {
        const mock = {
            getFormatterAdapterForFile: vi.fn() as Mocked<FormatterService['getFormatterAdapterForFile']>,
        } as Mocked<FormatterService>;

        if (defaults?.getFormatterAdapterForFile !== undefined) {
            mock.getFormatterAdapterForFile.mockReturnValue(defaults.getFormatterAdapterForFile);
        }

        return mock;
    }
}