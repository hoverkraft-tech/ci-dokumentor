import { RendererAdapter, RenderSectionData } from "./renderer.adapter.js";

export abstract class AbstractRendererAdapter implements RendererAdapter {
    protected getSectionStart(renderSectionData: RenderSectionData): Buffer {
        return renderSectionData.formatterAdapter.comment(Buffer.from(`${renderSectionData.sectionIdentifier}:start`));
    }

    protected getSectionEnd(renderSectionData: RenderSectionData): Buffer {
        return renderSectionData.formatterAdapter.comment(Buffer.from(`${renderSectionData.sectionIdentifier}:end`));
    }

    abstract writeSection(renderSectionData: RenderSectionData): Promise<void>;
}