import { RepositoryProvider } from "../repository/repository.provider.js";

export type ManifestVersion = {
  ref?: string; // Branch, tag, or custom ref (e.g., 'v1.0.0', 'main')
  sha?: string; // Commit SHA (e.g., '08c6903cd8c0fde910a37f88322edcfb5dd907a8')
};

/**
 * Service for handling manifest version detection and processing
 */
export class VersionService {


  /**
   * Get version information, either from user input or auto-detection
   */
  async getVersion(userVersion?: string, repositoryProvider?: RepositoryProvider): Promise<ManifestVersion | undefined> {
    // If user provided a version, use it
    if (userVersion) {
      return this.parseUserVersion(userVersion);
    }

    // Auto-detect version if repositoryProvider is available
    if (repositoryProvider) {
      return await repositoryProvider.getLatestVersion();
    }

    return undefined;
  }

  /**
   * Parse a user-provided version string into ManifestVersion
   */
  private parseUserVersion(version: string): ManifestVersion {
    // Check if the provided version looks like a commit SHA (40 hex characters)
    const isSha = /^[a-f0-9]{40}$/i.test(version);
    if (isSha) {
      return { sha: version };
    } else {
      return { ref: version };
    }
  }
}