import { Repository, RepositoryProvider } from "@ci-dokumentor/core";
import { GitRepositoryProvider } from "@ci-dokumentor/repository-git";
import { existsSync, readFileSync } from "node:fs";
import { graphql, GraphQlQueryResponseData } from "@octokit/graphql";
import { injectable, inject } from "inversify";

@injectable()
export class GitHubRepositoryProvider implements RepositoryProvider {
    
    constructor(@inject(GitRepositoryProvider) private gitRepositoryService: GitRepositoryProvider) {}
    
    /**
     * Check if this provider supports the current repository context
     * Checks if the repository is hosted on GitHub
     */
    async supports(): Promise<boolean> {
        try {
            // First check if the git repository provider supports the context
            if (!(await this.gitRepositoryService.supports())) {
                return false;
            }
            
            const parsedUrl = await this.gitRepositoryService.getRemoteParsedUrl();
            return parsedUrl.source === 'github.com';
        } catch {
            return false;
        }
    }

    async getRepository(): Promise<Repository> {
        const repositoryInfo = await this.gitRepositoryService.getRepository();
        const logo = await this.getLogoUri(repositoryInfo);
        const license = await this.getLicenseInfo(repositoryInfo);

        return {
            ...repositoryInfo,
            logo, // Optional logo URI
            license, // Optional license information
        };
    }

    private async getLogoUri(repositoryInfo: Repository): Promise<string | undefined> {
        const possibleLogoPaths = [
            '.github/logo.png',
            '.github/logo.jpg',
            '.github/logo.jpeg',
            '.github/logo.svg',
        ];

        for (const path of possibleLogoPaths) {
            if (existsSync(path)) {
                return `file://${path}`;
            }
        }

        // Fallback to Open Graph image if no logo is found
        return this.getOpenGraphImageUrl(repositoryInfo);
    }

    private async getOpenGraphImageUrl(repositoryInfo: Repository): Promise<string | undefined> {
        const result: GraphQlQueryResponseData = await graphql(`
            query getOpenGraphImageUrl($owner: String!, $repo: String!) {
                repository(owner: $owner, name: $repo) {
                    openGraphImageUrl
                }
            }
        `, {
            owner: repositoryInfo.owner,
            repo: repositoryInfo.name
        });

        const repository = result.repository;
        return repository.openGraphImageUrl;
    }

    private async getLicenseInfo(repositoryInfo: Repository): Promise<{ name: string; spdxId: string | null; url: string | null } | undefined> {
        try {
            const result: GraphQlQueryResponseData = await graphql(`
                query getLicense($owner: String!, $repo: String!) {
                    repository(owner: $owner, name: $repo) {
                        licenseInfo {
                            name
                            spdxId
                            url
                        }
                    }
                }
            `, {
                owner: repositoryInfo.owner,
                repo: repositoryInfo.name
            });

            const licenseInfo = result.repository?.licenseInfo;
            if (licenseInfo) {
                return {
                    name: licenseInfo.name,
                    spdxId: licenseInfo.spdxId,
                    url: licenseInfo.url
                };
            }
        } catch (error) {
            console.warn('Failed to fetch license from GitHub API:', error);
        }

        // Fallback to reading license file directly if no license info from GitHub
        return this.getLicenseFromFile();
    }

    private getLicenseFromFile(): { name: string; spdxId: string | null; url: string | null } | undefined {
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
                        url: null
                    };
                } catch (error) {
                    console.warn(`Failed to read license file ${licensePath}:`, error);
                }
            }
        }

        return undefined;
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