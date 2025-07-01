import { GeneratorAdapter, OutputAdapter, SECTION_GENERATOR_ADAPTER_IDENTIFIER, SectionGeneratorAdapter, FormatterAdapter } from '@ci-dokumentor/core';
import { inject, multiInject } from 'inversify';
import { GitHubAction, GitHubActionsParser, GitHubWorkflow } from './github-actions-parser.js';
import { dirname, join } from 'node:path';
import { GitHubRepositoryService } from './repository/github-repository.service.js';

/**
 * GitHub Actions generator adapter.
 * This class is a placeholder for the actual implementation of the GitHub Actions generator.
 * It implements the GeneratorAdapter interface from the core package.
 */
export class GitHubActionsGeneratorAdapter implements GeneratorAdapter {
    constructor(
        @inject(GitHubActionsParser)
        public readonly gitHubActionsParser: GitHubActionsParser,
        @inject(GitHubRepositoryService)
        private readonly gitHubRepositoryService: GitHubRepositoryService,
        @multiInject(SECTION_GENERATOR_ADAPTER_IDENTIFIER)
        private readonly sectionGeneratorAdapters: SectionGeneratorAdapter<GitHubAction | GitHubWorkflow>[],
    ) { }

    /**
     * Checks if the adapter supports the given source file.
     * @param source The source file path.
     * @returns True if the adapter supports the source, false otherwise.
     */
    supportsSource(source: string): boolean {
        // GitHub Actions files are typically .yml or .yaml files in .github/workflows/ or action.yml/action.yaml
        const isYaml = /\.ya?ml$/i.test(source);
        const isGitHubActionOrWorkflow = this.gitHubActionsParser.isGitHubActionFile(source) || this.gitHubActionsParser.isGitHubWorkflowFile(source);
        return isYaml && isGitHubActionOrWorkflow;
    }

    /**
     * Returns the documentation path for the given source file.
     * @param source The source file path.
     * @returns The documentation path.
     */
    getDocumentationPath(source: string): string {
        // For GitHub Actions, the documentation path README.md in the same directory
        if (this.gitHubActionsParser.isGitHubActionFile(source)) {
            return join(dirname(source), 'README.md');
        }

        // For GitHub Workflows, the documentation path is .github/workflows/[workflow].md
        if (this.gitHubActionsParser.isGitHubWorkflowFile(source)) {
            return source.replace(/\.ya?ml$/, '.md');
        }

        throw new Error(`Unsupported source file: ${source}`);
    }

    async generateDocumentation(source: string, formatterAdapter: FormatterAdapter, outputAdapter: OutputAdapter): Promise<void> {
        const gitHubActionOrWorkflow = this.gitHubActionsParser.parseFile(source);
        const repository = await this.gitHubRepositoryService.getRepository();

        for (const sectionGeneratorAdapter of this.sectionGeneratorAdapters) {
            const sectionContent = sectionGeneratorAdapter.generateSection(formatterAdapter, gitHubActionOrWorkflow, repository);

            await outputAdapter.writeSection(
                sectionGeneratorAdapter.getSectionIdentifier(),
                Buffer.concat([
                    sectionContent,
                    formatterAdapter.lineBreak(),
                    formatterAdapter.lineBreak()
                ]),
            );
        }
    }
}
