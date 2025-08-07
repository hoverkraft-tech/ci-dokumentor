import { Repository } from "@ci-dokumentor/core";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";
import { existsSync, readFileSync } from "node:fs";

interface LicenseInfo {
    name: string;
    spdxId: string | null;
    url: string | null;
    body?: string;
}

export class LicenseSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.License;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: Repository): Buffer {
        const currentYear = new Date().getFullYear();
        const authorName = ('author' in manifest && manifest.author) ? manifest.author : repository.owner;

        // Use license information from repository (fetched by GitHubRepositoryProvider)
        let licenseInfo: LicenseInfo | null = repository.license ? {
            name: repository.license.name,
            spdxId: repository.license.spdxId,
            url: repository.license.url
        } : null;

        // Fallback to reading license file directly if no license info from GitHub
        if (!licenseInfo) {
            licenseInfo = this.getLicenseFromFile();
        }

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

    private getLicenseFromFile(): LicenseInfo | null {
        const possibleLicensePaths = [
            'LICENSE',
            'LICENSE.txt',
            'LICENSE.md',
            'license',
            'license.txt',
            'license.md',
            'COPYING',
            'COPYING.txt'
        ];

        for (const licensePath of possibleLicensePaths) {
            if (existsSync(licensePath)) {
                try {
                    const licenseContent = readFileSync(licensePath, 'utf-8');
                    
                    // Try to detect license type from content
                    const licenseName = this.detectLicenseType(licenseContent);
                    
                    return {
                        name: licenseName,
                        spdxId: this.getSpdxIdFromName(licenseName),
                        url: null,
                        body: licenseContent
                    };
                } catch (error) {
                    console.warn(`Failed to read license file ${licensePath}:`, error);
                }
            }
        }

        return null;
    }

    private detectLicenseType(content: string): string {
        const upperContent = content.toUpperCase();
        
        if (upperContent.includes('MIT LICENSE') || upperContent.includes('MIT LICENCE')) {
            return 'MIT License';
        }
        if (upperContent.includes('APACHE LICENSE') && upperContent.includes('VERSION 2.0')) {
            return 'Apache License 2.0';
        }
        if (upperContent.includes('GNU GENERAL PUBLIC LICENSE') && upperContent.includes('VERSION 3')) {
            return 'GNU General Public License v3.0';
        }
        if (upperContent.includes('GNU GENERAL PUBLIC LICENSE') && upperContent.includes('VERSION 2')) {
            return 'GNU General Public License v2.0';
        }
        if (upperContent.includes('BSD 3-CLAUSE') || (upperContent.includes('BSD') && upperContent.includes('3 CLAUSE'))) {
            return 'BSD 3-Clause "New" or "Revised" License';
        }
        if (upperContent.includes('BSD 2-CLAUSE') || (upperContent.includes('BSD') && upperContent.includes('2 CLAUSE'))) {
            return 'BSD 2-Clause "Simplified" License';
        }
        if (upperContent.includes('ISC LICENSE')) {
            return 'ISC License';
        }
        
        return 'Custom License';
    }

    private getSpdxIdFromName(licenseName: string): string | null {
        const spdxMap: { [key: string]: string } = {
            'MIT License': 'MIT',
            'Apache License 2.0': 'Apache-2.0',
            'GNU General Public License v3.0': 'GPL-3.0',
            'GNU General Public License v2.0': 'GPL-2.0',
            'BSD 3-Clause "New" or "Revised" License': 'BSD-3-Clause',
            'BSD 2-Clause "Simplified" License': 'BSD-2-Clause',
            'ISC License': 'ISC'
        };

        return spdxMap[licenseName] || null;
    }
}
