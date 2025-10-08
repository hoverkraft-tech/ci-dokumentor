import { GeneratedSectionMixin } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class GeneratedSectionGenerator extends GeneratedSectionMixin<GitLabCIManifest, typeof GitLabCISectionGeneratorAdapter>(GitLabCISectionGeneratorAdapter) {
}
