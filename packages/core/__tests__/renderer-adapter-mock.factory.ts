import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import type { RendererAdapter } from '../src/renderer/renderer.adapter.js';

export interface RendererAdapterDefaults {
    initialize: Awaited<ReturnType<RendererAdapter['initialize']>>
    getFormatterAdapter: ReturnType<RendererAdapter['getFormatterAdapter']>
    getDestination: ReturnType<RendererAdapter['getDestination']>
    writeSection: Awaited<ReturnType<RendererAdapter['writeSection']>>
    replaceContent: Awaited<ReturnType<RendererAdapter['replaceContent']>>
    finalize: Awaited<ReturnType<RendererAdapter['finalize']>>
}

export class RendererAdapterMockFactory {
    static create(defaults?: Partial<RendererAdapterDefaults>): Mocked<RendererAdapter> {
        const mock = {
            initialize: vi.fn() as Mocked<RendererAdapter['initialize']>,
            getFormatterAdapter: vi.fn() as Mocked<RendererAdapter['getFormatterAdapter']>,
            getDestination: vi.fn() as Mocked<RendererAdapter['getDestination']>,
            writeSection: vi.fn() as Mocked<RendererAdapter['writeSection']>,
            replaceContent: vi.fn() as Mocked<RendererAdapter['replaceContent']>,
            finalize: vi.fn() as Mocked<RendererAdapter['finalize']>,
        } as Mocked<RendererAdapter>;

        if (defaults?.initialize !== undefined) {
            mock.initialize.mockResolvedValue(defaults.initialize);
        }
        if (defaults?.getFormatterAdapter !== undefined) {
            mock.getFormatterAdapter.mockReturnValue(defaults.getFormatterAdapter);
        }
        if (defaults?.getDestination !== undefined) {
            mock.getDestination.mockReturnValue(defaults.getDestination);
        }
        if (defaults?.writeSection !== undefined) {
            mock.writeSection.mockResolvedValue(defaults.writeSection);
        }
        if (defaults?.replaceContent !== undefined) {
            mock.replaceContent.mockResolvedValue(defaults.replaceContent);
        }
        if (defaults?.finalize !== undefined) {
            mock.finalize.mockResolvedValue(defaults.finalize);
        }

        return mock;
    }
}
