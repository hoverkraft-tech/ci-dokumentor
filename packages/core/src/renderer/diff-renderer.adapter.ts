import { RenderSectionData } from './renderer.adapter.js';
import { existsSync, readFileSync } from 'node:fs';
import { AbstractRendererAdapter } from './abstract-renderer.adapter.js';

export class DiffRendererAdapter extends AbstractRendererAdapter {
    private readonly sections = new Map<string, RenderSectionData>();

    async writeSection(renderSectionData: RenderSectionData): Promise<void> {
        this.sections.set(renderSectionData.sectionIdentifier, renderSectionData);
    }

    getFullNextContent(): Buffer {
        let output = Buffer.alloc(0);

        for (const [, renderSectionData] of this.sections) {
            const sectionStart = this.getSectionStart(renderSectionData);
            const sectionEnd = this.getSectionEnd(renderSectionData);

            const sectionContent = Buffer.concat([
                sectionStart,
                ...(renderSectionData.data.length ? [renderSectionData.data, renderSectionData.formatterAdapter.lineBreak()] : []),
                sectionEnd,
                renderSectionData.formatterAdapter.lineBreak(),
            ]);

            output = Buffer.concat([output, sectionContent]);
        }

        return output;
    }

    getExistingContentIfAny(): Buffer | undefined {
        const first = this.sections.values().next();
        if (first.done) return undefined;
        const destination = first.value.destination;
        if (!existsSync(destination)) return undefined;
        return readFileSync(destination);
    }
}
