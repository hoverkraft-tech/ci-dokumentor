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
        // Replace sha version with a placeholder
        // @f122e8ee783be6677c271ce67776ec607546a669
        .replaceAll(/@[a-f0-9]{40}/g, '@sha-version');
}