import { GeneratedSectionMixin } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class GeneratedSectionGenerator extends GeneratedSectionMixin<GitHubActionsManifest, typeof GitHubActionsSectionGeneratorAdapter>(GitHubActionsSectionGeneratorAdapter) {
}