import { SectionGeneratorAdapter } from "@ci-dokumentor/core";
import { GitHubAction, GitHubWorkflow } from "src/github-actions-parser.js";

export type GitHubActionsSectionGeneratorAdapter = SectionGeneratorAdapter<GitHubAction | GitHubWorkflow>