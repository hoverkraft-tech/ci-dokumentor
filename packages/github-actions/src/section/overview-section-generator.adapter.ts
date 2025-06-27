import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class OverviewSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Overview;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        if (!manifest.description) {
            return Buffer.from('');
        }

        const content = formatterAdapter.paragraph(Buffer.from(manifest.description));

        return Buffer.concat([
            content,
            formatterAdapter.lineBreak()
        ]);
    }
}
