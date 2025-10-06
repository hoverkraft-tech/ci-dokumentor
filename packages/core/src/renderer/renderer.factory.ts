import { ResolutionContext } from 'inversify';
import type { RendererAdapter } from './renderer.adapter.js';
import { DiffRendererAdapter } from './diff-renderer.adapter.js';
import { FileRendererAdapter } from './file-renderer.adapter.js';

export type RendererFactory = (dryRun: boolean) => RendererAdapter;

export const RENDERER_FACTORY_IDENTIFIER = Symbol.for('RendererFactory');

export const containerRendererFactory = (context: ResolutionContext): RendererFactory => {
    return (dryRun: boolean) => dryRun
        ? context.get(DiffRendererAdapter)
        : context.get(FileRendererAdapter);
}
