import { ManifestVersion, VersionDetector } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { simpleGit } from 'simple-git';

@injectable()
export class GitVersionDetector implements VersionDetector {
  
  async detectVersion(): Promise<ManifestVersion | undefined> {
    try {
      const git = simpleGit();

      // Auto-detect version information
      let detectedRef: string | undefined;
      let detectedSha: string | undefined;

      // Get current commit SHA
      try {
        detectedSha = await git.revparse('HEAD');
      } catch {
        // If we can't get SHA, that's ok
      }

      // Get latest tag
      try {
        // Try to get the latest tag pointing to current commit
        const tags = await git.tags(['--points-at', 'HEAD']);
        if (tags.latest) {
          detectedRef = tags.latest;
        } else {
          // Fallback to current branch name
          const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
          if (currentBranch && currentBranch !== 'HEAD') {
            detectedRef = currentBranch;
          }
        }
      } catch {
        // If we can't detect ref, that's ok
      }

      // Return version info if we have at least one piece of information
      if (detectedRef || detectedSha) {
        return { ref: detectedRef, sha: detectedSha };
      }

      return undefined;
    } catch {
      // If anything goes wrong, return undefined (no version info)
      return undefined;
    }
  }
}