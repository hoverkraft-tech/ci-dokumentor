import { join } from "node:path";

/**
 * Sanitize snapshot content by replacing dynamic values with placeholders.
 * This helps in maintaining consistent snapshots across test runs.
 */
export function sanitizeSnapshotContent(content: string | unknown[][]): string {
    if (Array.isArray(content)) {
        return sanitizeSnapshotContent(content.map((call) => call[0]).join('\n'));
    }

    const rootPath = join(__dirname, '../../..');

    return content
        // Replace absolute paths with a placeholder
        .replaceAll(rootPath, '/test')
        // Replace sha version and tag with a placeholder
        .replaceAll(/@[a-f0-9]{40} # [\w-./]+/g, '@sha-version # tag')
        .replaceAll(/ref:\s+'[a-f0-9]{40}' # [\w-./]+/g, "ref: 'sha-version' # tag");
}