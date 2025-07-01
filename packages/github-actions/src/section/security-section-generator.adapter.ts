import { GitHubRepository } from "../repository/github-repository.service.js";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class SecuritySectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Security;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        const securityContent = `## Security Policy

We take the security of our software seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Reporting Security Vulnerabilities

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to security@example.com. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.`;

        const securityBestPractices = [
            Buffer.from('Always use the latest version of the action/workflow'),
            Buffer.from('Pin action versions to specific commits for production use'),
            Buffer.from('Review and audit third-party actions before use'),
            Buffer.from('Use secrets management for sensitive data'),
            Buffer.from('Limit permissions using the principle of least privilege'),
            Buffer.from('Regularly update dependencies and review security advisories')
        ];

        let specificGuidance = '';
        if ('runs' in manifest) {
            specificGuidance = `### Security Considerations for Actions

- Always validate inputs to prevent injection attacks
- Use \`inputs\` instead of environment variables for sensitive data
- Be cautious with \`shell\` actions that execute user input
- Review permissions required by the action`;
        } else {
            specificGuidance = `### Security Considerations for Workflows

- Use \`permissions\` to limit what the workflow can access
- Be careful with \`pull_request_target\` triggers
- Validate external inputs and dependencies
- Use environment protection rules for production deployments`;
        }

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Security'), 2),
            formatterAdapter.lineBreak(),
            formatterAdapter.code(Buffer.from(securityContent), 'markdown'),
            formatterAdapter.lineBreak(),
            formatterAdapter.heading(Buffer.from('Security Best Practices'), 3),
            formatterAdapter.lineBreak(),
            formatterAdapter.list(securityBestPractices, false),
            formatterAdapter.lineBreak(),
            formatterAdapter.code(Buffer.from(specificGuidance), 'markdown'),
            formatterAdapter.lineBreak(),
            formatterAdapter.lineBreak()
        ]);
    }
}
