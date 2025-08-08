/**
 * Options for repository platform selection
 */
export interface RepositoryPlatformOptions {
    /**
     * The repository platform to use
     * If not specified, auto-detected from the repository
     */
    platform?: string;
}

/**
 * Options for CI/CD platform selection
 */
export interface CicdPlatformOptions {
    /**
     * The CI/CD platform to use
     * If not specified, auto-detected from available manifest files
     */
    platform?: string;
}

/**
 * Options for individual section generators
 */
export interface SectionGeneratorOptions {
    /**
     * List of section identifiers to include in generation
     * If not specified, all available sections are included
     */
    includeSections?: string[];
    
    /**
     * List of section identifiers to exclude from generation
     */
    excludeSections?: string[];
    
    /**
     * Section-specific configuration options
     */
    sectionConfig?: Record<string, Record<string, unknown>>;
}

/**
 * Complete options interface for the generate command
 */
export interface GenerateOptions {
    /**
     * Source directory containing CI/CD files
     */
    source: string;
    
    /**
     * Output directory for generated documentation
     */
    output: string;
    
    /**
     * Repository platform options
     */
    repository?: RepositoryPlatformOptions;
    
    /**
     * CI/CD platform options
     */
    cicd?: CicdPlatformOptions;
    
    /**
     * Section generator options
     */
    sections?: SectionGeneratorOptions;
}