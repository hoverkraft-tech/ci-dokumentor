import { GitHubRepository } from "@ci-dokumentor/repository-platforms-github";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class ContributingSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Contributing;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        const contributingText = `We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Make your changes
4. Write or update tests
5. Commit your changes (\`git commit -m 'Add amazing feature'\`)
6. Push to the branch (\`git push origin feature/amazing-feature\`)
7. Open a Pull Request

Please make sure to:
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Keep commits atomic and descriptive`;

        const developmentSteps = [
            Buffer.from('Clone the repository'),
            Buffer.from('Install dependencies'),
            Buffer.from('Make your changes'),
            Buffer.from('Test your changes'),
            Buffer.from('Submit a pull request')
        ];

        const setupInstructions = `# Development Setup

\`\`\`bash
# Clone the repository
git clone ${repository.url}.git
cd ${repository.fullName}

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
\`\`\``;

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Contributing'), 2),
            formatterAdapter.lineBreak(),
            formatterAdapter.paragraph(Buffer.from(contributingText)),
            formatterAdapter.lineBreak(),
            formatterAdapter.heading(Buffer.from('Development Workflow'), 3),
            formatterAdapter.lineBreak(),
            formatterAdapter.list(developmentSteps, true),
            formatterAdapter.lineBreak(),
            formatterAdapter.code(Buffer.from(setupInstructions), 'markdown'),
            formatterAdapter.lineBreak(),
            formatterAdapter.lineBreak()
        ]);
    }
}
