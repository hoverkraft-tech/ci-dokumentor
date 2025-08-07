import { Repository } from "@ci-dokumentor/core";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class LicenseSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.License;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: Repository): Buffer {
        const currentYear = new Date().getFullYear();
        const authorName = ('author' in manifest && manifest.author) ? manifest.author : repository.owner;

        // Use license information from repository (fetched by GitHubRepositoryProvider with fallbacks)
        const licenseInfo = repository.license;

        // Generate license section
        const licenseText = licenseInfo 
            ? `This project is licensed under the ${licenseInfo.name}.`
            : 'This project is licensed under the MIT License.';

        const spdxText = licenseInfo && licenseInfo.spdxId 
            ? `SPDX-License-Identifier: ${licenseInfo.spdxId}`
            : '';

        const licenseLink = licenseInfo && licenseInfo.url
            ? `For more details, see the [license](${licenseInfo.url}).`
            : 'See the [LICENSE](LICENSE) file for full license text.';

        const elements = [
            formatterAdapter.heading(Buffer.from('License'), 2),
            formatterAdapter.lineBreak(),
            formatterAdapter.paragraph(Buffer.from(licenseText)),
            formatterAdapter.lineBreak()
        ];

        if (spdxText) {
            elements.push(
                formatterAdapter.paragraph(Buffer.from(spdxText)),
                formatterAdapter.lineBreak()
            );
        }

        elements.push(
            formatterAdapter.paragraph(Buffer.from(`Copyright © ${currentYear} ${authorName}`)),
            formatterAdapter.lineBreak(),
            formatterAdapter.paragraph(Buffer.from(licenseLink)),
            formatterAdapter.lineBreak(),
            formatterAdapter.horizontalRule(),
            formatterAdapter.lineBreak(),
            formatterAdapter.center(Buffer.from(`Made with ❤️ by ${authorName}`)),
            formatterAdapter.lineBreak()
        );

        return Buffer.concat(elements);
    }
}
