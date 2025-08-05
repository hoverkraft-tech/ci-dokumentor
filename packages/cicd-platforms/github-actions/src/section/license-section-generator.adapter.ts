import { GitHubRepository } from "@ci-dokumentor/repository-platforms-github";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class LicenseSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.License;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        const currentYear = new Date().getFullYear();
        const authorName = ('author' in manifest && manifest.author) ? manifest.author : 'Your Name';

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('License'), 2),
            formatterAdapter.lineBreak(),
            formatterAdapter.paragraph(Buffer.from(`This project is licensed under the MIT License.`)),
            formatterAdapter.lineBreak(),
            formatterAdapter.paragraph(Buffer.from(`Copyright © ${currentYear} ${authorName}`)),
            formatterAdapter.lineBreak(),
            formatterAdapter.paragraph(Buffer.from('See the [LICENSE](LICENSE) file for full license text.')),
            formatterAdapter.lineBreak(),
            formatterAdapter.horizontalRule(),
            formatterAdapter.lineBreak(),
            formatterAdapter.center(Buffer.from(`Made with ❤️ by ${authorName}`)),
            formatterAdapter.lineBreak()
        ]);
    }
}
