import { GitHubRepository } from "../repository/github-repository.service.js";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class OverviewSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Overview;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        const description = 'description' in manifest ? manifest.description : undefined;
        if (!description) {
            return Buffer.from('');
        }

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Overview'), 2),
            formatterAdapter.lineBreak(),
            formatterAdapter.paragraph(Buffer.from(description)),
        ]);
    }
}
