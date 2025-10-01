import { ReadableContent } from "./readable-content.js";

export interface ReaderAdapter {
    /**
     * Check if a readable resource exists at the given path.
     */
    resourceExists(path: string): boolean;

    /**
     * Read the content of a readable resource at the given path.
     * If the resource does not exist, return an empty content.
     */
    readResource(path: string): Promise<ReadableContent>;

    /**
     * Check if a container-like resource exists at the given path.
     * This is intentionally agnostic to filesystem terminology; it should be used
     * when the caller needs to know if a directory-like container exists.
     */
    containerExists(path: string): boolean;

    /**
     * Read the list of resource paths contained in the given container.
     * 
     *Implementations should focus on efficient listing and avoid unnecessary
     * buffering or expensive filesystem/stat calls. The method returns the
     * immediate children (resource paths) contained in the container. For
     * very large containers adapters may expose streaming alternatives, but the
     * core contract returns a Promise with the list of paths for simplicity.
     * 
     * If the container does not exist, return an empty list.
     * Return the full paths of the contained resources.
     */
    readContainer(path: string): Promise<string[]>;

    /**
     * Find resources matching the given pattern.
     * 
     * The pattern can be:
     * - A direct resource path (returns array with single path if resource exists)
     * - A glob pattern (e.g., `*.yml`, `**\/*.md`, `.github/workflows/*.yml`)
     * 
     * Returns an array of resource paths (not directories) that match the pattern.
     * If no resources match, returns an empty array.
     * Results are returned in sorted order for predictable behavior.
     */
    findResources(pattern: string): Promise<string[]>;
}