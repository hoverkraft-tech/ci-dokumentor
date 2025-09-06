export type ManifestVersion = {
  ref?: string; // Branch, tag, or custom ref (e.g., 'v1.0.0', 'main')
  sha?: string; // Commit SHA (e.g., '08c6903cd8c0fde910a37f88322edcfb5dd907a8')
};

export interface VersionDetector {
  /**
   * Detect version information from the current repository context
   */
  detectVersion(): Promise<ManifestVersion | undefined>;
}

export const VERSION_DETECTOR_IDENTIFIER = Symbol.for('VersionDetector');

/**
 * Service for handling manifest version detection and processing
 */
export class VersionService {
  private versionDetector?: VersionDetector;

  constructor(versionDetector?: VersionDetector) {
    this.versionDetector = versionDetector;
  }

  /**
   * Set the version detector to use
   */
  setVersionDetector(detector: VersionDetector): void {
    this.versionDetector = detector;
  }

  /**
   * Parse a user-provided version string into ManifestVersion
   */
  parseUserVersion(version: string): ManifestVersion {
    // Check if the provided version looks like a commit SHA (40 hex characters)
    const isSha = /^[a-f0-9]{40}$/i.test(version);
    if (isSha) {
      return { sha: version };
    } else {
      return { ref: version };
    }
  }

  /**
   * Get version information, either from user input or auto-detection
   */
  async getVersion(userVersion?: string): Promise<ManifestVersion | undefined> {
    // If user provided a version, use it
    if (userVersion) {
      return this.parseUserVersion(userVersion);
    }

    // Auto-detect version if detector is available
    if (this.versionDetector) {
      return await this.versionDetector.detectVersion();
    }

    return undefined;
  }

  /**
   * Build a version suffix for usage (prefers SHA over ref for precision)
   */
  buildVersionSuffix(version: ManifestVersion): string | undefined {
    const versionSuffix = version.sha || version.ref;
    return versionSuffix;
  }
}