import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import type { RendererService } from '../src/renderer/renderer.service.js';

export interface RendererServiceDefaults {
    readExistingContent: Awaited<ReturnType<RendererService['readExistingContent']>>
}

export class RendererServiceMockFactory {
    static create(defaults?: Partial<RendererServiceDefaults>): Mocked<RendererService> {
        const mock = {
            readExistingContent: vi.fn() as Mocked<RendererService['readExistingContent']>,
        } as Mocked<RendererService>;

        if (defaults?.readExistingContent !== undefined) {
            mock.readExistingContent.mockResolvedValue(defaults.readExistingContent);
        }

        return mock;
    }
}