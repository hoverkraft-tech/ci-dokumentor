import { readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { parse } from 'yaml'
import { Repository } from '@ci-dokumentor/core';


// See https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/github-action.json

export type GitHubActionInput = {
    description?: string;
    required?: boolean;
    default?: string;
    type?: string; // e.g., 'string', 'boolean', 'choice'
};

export type GitHubActionOutput = {
    description?: string;
    value?: string;
};

export type GitHubAction = {
    usesName: string; // e.g., 'hoverkraft-tech/compose-action'
    name: string;
    description?: string;
    author?: string;
    branding?: {
        icon?: string;
        color?: string;
    };
    inputs?: Record<string, GitHubActionInput>;
    outputs?: Record<string, GitHubActionOutput>;
    runs: {
        using: string; // e.g., 'node20', 'docker', 'composite'
    };
};


// See https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/github-workflow.json

export type GitHubWorkflowJob = {
    name?: string;
    'runs-on': string | string[];
    needs?: string | string[];
    strategy?: {
        matrix?: Record<string, unknown>;
    };
    environment?: string | { name: string };
    steps?: Array<{
        name?: string;
        uses?: string;
        run?: string;
        with?: Record<string, unknown>;
        env?: Record<string, string>;
        if?: string;
    }>;
};

export type GitHubWorkflow = {
    usesName: string; // e.g., 'hoverkraft-tech/ci-github-container/.github/workflows/docker-build-images.yml'
    name: string
    on: {
        [key: string]: unknown;
        workflow_dispatch?: GitHubWorkflowDispatchEvent
    }; // Event triggers
    permissions?: Record<string, string>; // Permissions for the workflow
    jobs: Record<string, GitHubWorkflowJob>; // Jobs in the workflow
};

export type GitHubWorkflowDispatchEvent = {
    inputs?: Record<string, GitHubWorkflowInput>;
    secrets?: Record<string, GitHubWorkflowSecrets>;
};

export type GitHubWorkflowInput = {
    description: string;
    required?: boolean;
    default?: string;
    type: string;
    options?: string[];
};

export type GitHubWorkflowSecrets = {
    description?: string;
    required?: boolean;
};

export class GitHubActionsParser {
    isGitHubActionFile(source: string): boolean {
        // Check if the source is a GitHub Action by looking for action.yml or action.yaml
        return /action\.ya?ml$/i.test(source);
    }

    isGitHubWorkflowFile(source: string): boolean {
        // Check if the source is a GitHub Workflow by looking for .github/workflows/
        return source.includes('.github/workflows/');
    }

    parseFile(source: string, repository: Repository): GitHubAction | GitHubWorkflow {
        const parsed = parse(readFileSync(source, 'utf8'));
        if (!parsed) {
            throw new Error(`Unsupported source file: ${source}`);
        }

        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error(`Unsupported GitHub Actions file format: ${source}`);
        }

        if (!parsed.name) {
            // Extract filename without extension and convert to PascalCase
            const fileName = basename(source, extname(source));
            const pascalCaseName = fileName
                .split(/[-_\s]/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            parsed.name = pascalCaseName;
        }

        parsed.usesName = this.getUsesName(source, repository);

        if (this.isGitHubAction(parsed)) {
            return parsed as GitHubAction;
        }

        if (this.isGitHubWorkflow(parsed)) {
            return parsed as GitHubWorkflow;
        }

        throw new Error(`Unsupported GitHub Actions file format: ${source}`);
    }

    private getUsesName(source: string, repository: Repository): string {
        // For GitHub Actions, the usesName is typically the repository name
        if (this.isGitHubActionFile(source)) {
            return join(repository.owner, repository.name, dirname(source));
        }

        // For GitHub Workflows, the usesName is the workflow file path
        if (this.isGitHubWorkflowFile(source)) {
            return join(repository.owner, repository.name, source);
        }

        throw new Error(`Unsupported source file: ${source}`);
    }

    private isGitHubAction(parsed: any): parsed is GitHubAction {
        // Validate all required fields for a GitHub Action
        return 'name' in parsed && typeof parsed.name === 'string' &&
            'runs' in parsed && typeof parsed.runs === 'object' &&
            'using' in parsed.runs && typeof parsed.runs.using === 'string';
    }

    private isGitHubWorkflow(parsed: any): parsed is GitHubWorkflow {
        // Validate all required fields for a GitHub Workflow
        return 'name' in parsed && typeof parsed.name === 'string' &&
            'on' in parsed && (typeof parsed.on === 'object' || Array.isArray(parsed.on) || typeof parsed.on === 'string');
    }


}