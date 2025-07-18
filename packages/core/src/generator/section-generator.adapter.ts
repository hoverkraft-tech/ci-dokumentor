import { FormatterAdapter } from "src/formatter/formatter.adapter.js";
import { Repository } from "../repository/repository.service.js";

export const SECTION_GENERATOR_ADAPTER_IDENTIFIER = Symbol("SectionGeneratorAdapter");

export enum SectionIdentifier {
    Header = "header",         // Title and logo
    Badges = "badges",         // Shields.io, marketplace, pipeline badges
    Overview = "overview",       // One-sentence value proposition
    Contents = "contents",       // Table of contents
    Usage = "usage",     // Quickstart / usage examples
    Inputs = "inputs",         // Inputs / parameters
    Outputs = "outputs",        // Outputs / artefacts
    Secrets = "secrets",        // secrets / environment variables
    Examples = "examples",       // Usage examples
    Contributing = "contributing",   // Dev workflow & how to help
    Security = "security",       // Vulnerability disclosure policy
    License = "license",        // SPDX licence block
}

export interface SectionGeneratorAdapter<TManifest> {
    getSectionIdentifier(): SectionIdentifier;

    generateSection(formatterAdapter: FormatterAdapter, manifest: TManifest, repository: Repository): Buffer;
}