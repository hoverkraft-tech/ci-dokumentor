import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class SecretsSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Secrets;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        const envVars: Record<string, string> = {};
        const secrets: Record<string, string> = {};

        // Extract environment variables and secrets from different sources
        if ('runs' in manifest) {
            // GitHub Action
            if (manifest.runs.steps) {
                manifest.runs.steps.forEach(step => {
                    if (step.env) {
                        Object.assign(envVars, step.env);
                    }
                });
            }
        } else {
            // GitHub Workflow
            if (manifest.env) {
                Object.assign(envVars, manifest.env);
            }

            // Extract from jobs
            Object.values(manifest.jobs).forEach(job => {
                if (job.env) {
                    Object.assign(envVars, job.env);
                }
                if (job.steps) {
                    job.steps.forEach(step => {
                        if (step.env) {
                            Object.assign(envVars, step.env);
                        }
                    });
                }
            });
        }

        // Identify secrets (typically start with ${{ secrets. or contain SECRET)
        Object.entries(envVars).forEach(([key, value]) => {
            if (typeof value === 'string' && (value.includes('secrets.') || key.toUpperCase().includes('SECRET') || key.toUpperCase().includes('TOKEN'))) {
                secrets[key] = value;
            } else {
                envVars[key] = value;
            }
        });

        let content = Buffer.from('');

        // Environment Variables section
        if (Object.keys(envVars).length > 0) {
            const envHeaders = [
                Buffer.from('Variable'),
                Buffer.from('Description'),
                Buffer.from('Default Value')
            ];

            const envRows = Object.entries(envVars).map(([name, value]) => [
                formatterAdapter.inlineCode(Buffer.from(name)),
                Buffer.from('Environment variable'),
                formatterAdapter.inlineCode(Buffer.from(String(value)))
            ]);

            content = Buffer.concat([
                content,
                formatterAdapter.heading(Buffer.from('Environment Variables'), 3),
                formatterAdapter.lineBreak(),
                formatterAdapter.table(envHeaders, envRows),
                formatterAdapter.lineBreak()
            ]);
        }

        // Secrets section
        if (Object.keys(secrets).length > 0) {
            const secretHeaders = [
                Buffer.from('Secret'),
                Buffer.from('Description'),
                Buffer.from('Required')
            ];

            const secretRows = Object.entries(secrets).map(([name, value]) => [
                formatterAdapter.inlineCode(Buffer.from(name)),
                Buffer.from('Secret value'),
                Buffer.from('Yes')
            ]);

            content = Buffer.concat([
                content,
                formatterAdapter.heading(Buffer.from('Secrets'), 3),
                formatterAdapter.lineBreak(),
                formatterAdapter.table(secretHeaders, secretRows),
                formatterAdapter.lineBreak()
            ]);
        }

        if (content.length === 0) {
            return Buffer.from('');
        }

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Environment & Secrets'), 2),
            formatterAdapter.lineBreak(),
            content,
            formatterAdapter.lineBreak()
        ]);
    }
}
