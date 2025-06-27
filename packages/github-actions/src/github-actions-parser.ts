import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { parse } from 'yaml'

export type GitHubActionInput = {
    description?: string;
    required?: boolean;
    default?: string;
    type?: 'string' | 'number' | 'boolean' | 'choice';
    options?: string[];
};

export type GitHubActionOutput = {
    description?: string;
    value?: string;
};

export type GitHubAction = {
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

export type GitHubWorkflow = {
    name: string
    on: Record<string, any>; // Event triggers
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

    parseFile(source: string): GitHubAction | GitHubWorkflow {
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

        if (this.isGitHubAction(parsed)) {
            return parsed as GitHubAction;
        }

        if (this.isGitHubWorkflow(parsed)) {
            return parsed as GitHubWorkflow;
        }

        throw new Error(`Unsupported GitHub Actions file format: ${source}`);
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