import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VersionService, ManifestVersion } from './version.service.js';
import { RepositoryProviderMockFactory } from '../../__tests__/repository-provider-mock.factory.js';

describe('VersionService', () => {
    let versionService: VersionService;

    beforeEach(() => {
        versionService = new VersionService();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getVersion', () => {
        it('should return undefined when no user version and no repository provider', async () => {
            // Arrange - no parameters provided

            // Act
            const result = await versionService.getVersion();

            // Assert
            expect(result).toBeUndefined();
        });

        it('should return parsed user version when user version is provided', async () => {
            // Arrange
            const userVersion = 'v1.0.0';
            const mockProvider = RepositoryProviderMockFactory.create();

            // Act
            const result = await versionService.getVersion(userVersion, mockProvider);

            // Assert
            expect(result).toEqual({ ref: 'v1.0.0' });
            expect(mockProvider.getLatestVersion).not.toHaveBeenCalled();
        });

        it('should return parsed user version when user version is provided without repository provider', async () => {
            // Arrange
            const userVersion = 'main';

            // Act
            const result = await versionService.getVersion(userVersion);

            // Assert
            expect(result).toEqual({ ref: 'main' });
        });

        it('should auto-detect version from repository provider when no user version provided', async () => {
            // Arrange
            const expectedVersion: ManifestVersion = { ref: 'v2.0.0', sha: 'abc123' };
            const mockProvider = RepositoryProviderMockFactory.create({
                getLatestVersion: expectedVersion,
            });

            // Act
            const result = await versionService.getVersion(undefined, mockProvider);

            // Assert
            expect(result).toEqual(expectedVersion);
            expect(mockProvider.getLatestVersion).toHaveBeenCalledOnce();
        });

        it('should return undefined when repository provider returns undefined', async () => {
            // Arrange
            const mockProvider = RepositoryProviderMockFactory.create({
                getLatestVersion: undefined,
            });

            // Act
            const result = await versionService.getVersion(undefined, mockProvider);

            // Assert
            expect(result).toBeUndefined();
            expect(mockProvider.getLatestVersion).toHaveBeenCalledOnce();
        });

        it('should prioritize user version over repository provider', async () => {
            // Arrange
            const userVersion = 'feature/test';
            const mockProvider = RepositoryProviderMockFactory.create({
                getLatestVersion: { ref: 'v1.0.0' },
            });

            // Act
            const result = await versionService.getVersion(userVersion, mockProvider);

            // Assert
            expect(result).toEqual({ ref: 'feature/test' });
            expect(mockProvider.getLatestVersion).not.toHaveBeenCalled();
        });
    });

    describe('parseUserVersion', () => {
        it('should parse a commit SHA as sha property', async () => {
            // Arrange
            const commitSha = '08c6903cd8c0fde910a37f88322edcfb5dd907a8';

            // Act
            const result = await versionService.getVersion(commitSha);

            // Assert
            expect(result).toEqual({ sha: commitSha });
        });

        it('should parse a short commit SHA (40 chars) as sha property', async () => {
            // Arrange
            const commitSha = 'a1b2c3d4e5f6789012345678901234567890abcd';

            // Act
            const result = await versionService.getVersion(commitSha);

            // Assert
            expect(result).toEqual({ sha: commitSha });
        });

        it('should parse mixed case commit SHA as sha property', async () => {
            // Arrange
            const commitSha = 'A1B2C3d4e5f6789012345678901234567890AbCd';

            // Act
            const result = await versionService.getVersion(commitSha);

            // Assert
            expect(result).toEqual({ sha: commitSha });
        });

        it('should parse a version tag as ref property', async () => {
            // Arrange
            const versionTag = 'v1.0.0';

            // Act
            const result = await versionService.getVersion(versionTag);

            // Assert
            expect(result).toEqual({ ref: versionTag });
        });

        it('should parse a branch name as ref property', async () => {
            // Arrange
            const branchName = 'main';

            // Act
            const result = await versionService.getVersion(branchName);

            // Assert
            expect(result).toEqual({ ref: branchName });
        });

        it('should parse a feature branch name as ref property', async () => {
            // Arrange
            const branchName = 'feature/add-new-feature';

            // Act
            const result = await versionService.getVersion(branchName);

            // Assert
            expect(result).toEqual({ ref: branchName });
        });

        it('should parse a short string as ref property (not SHA)', async () => {
            // Arrange
            const shortRef = 'develop';

            // Act
            const result = await versionService.getVersion(shortRef);

            // Assert
            expect(result).toEqual({ ref: shortRef });
        });

        it('should parse a string with special characters as ref property', async () => {
            // Arrange
            const refWithSpecialChars = 'release/v1.0.0-beta.1';

            // Act
            const result = await versionService.getVersion(refWithSpecialChars);

            // Assert
            expect(result).toEqual({ ref: refWithSpecialChars });
        });

        it('should parse a string that looks like SHA but is too short as ref property', async () => {
            // Arrange
            const shortShaLike = 'a1b2c3d4e5f678901234567890123456789'; // 39 chars, not 40

            // Act
            const result = await versionService.getVersion(shortShaLike);

            // Assert
            expect(result).toEqual({ ref: shortShaLike });
        });

        it('should parse a string that looks like SHA but is too long as ref property', async () => {
            // Arrange
            const longShaLike = 'a1b2c3d4e5f6789012345678901234567890abcde'; // 41 chars, not 40

            // Act
            const result = await versionService.getVersion(longShaLike);

            // Assert
            expect(result).toEqual({ ref: longShaLike });
        });

        it('should parse a string with non-hex characters as ref property', async () => {
            // Arrange
            const nonHexString = 'g1b2c3d4e5f6789012345678901234567890abcd'; // contains 'g'

            // Act
            const result = await versionService.getVersion(nonHexString);

            // Assert
            expect(result).toEqual({ ref: nonHexString });
        });

        it('should handle empty string as falsy and return undefined', async () => {
            // Arrange
            const emptyString = '';

            // Act
            const result = await versionService.getVersion(emptyString);

            // Assert
            expect(result).toBeUndefined();
        });

        it('should handle empty string as falsy and fall back to repository provider', async () => {
            // Arrange
            const emptyString = '';
            const expectedVersion: ManifestVersion = { ref: 'v1.0.0' };
            const mockProvider = RepositoryProviderMockFactory.create({
                getLatestVersion: expectedVersion,
            });

            // Act
            const result = await versionService.getVersion(emptyString, mockProvider);

            // Assert
            expect(result).toEqual(expectedVersion);
            expect(mockProvider.getLatestVersion).toHaveBeenCalledOnce();
        });
    });
});
