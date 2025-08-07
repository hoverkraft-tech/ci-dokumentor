import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LicenseService } from './license.service.js';
import { existsSync, readFileSync } from 'fs';

// Mock fs module
vi.mock('fs', () => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn()
}));

describe('LicenseService', () => {
    let licenseService: LicenseService;
    let mockExistsSync: ReturnType<typeof vi.fn>;
    let mockReadFileSync: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        licenseService = new LicenseService();
        mockExistsSync = vi.mocked(existsSync);
        mockReadFileSync = vi.mocked(readFileSync);
        
        // Reset all mocks before each test
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('detectLicenseFromFile', () => {
        it('should return undefined when no license files exist', () => {
            // Arrange
            mockExistsSync.mockReturnValue(false);

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toBeUndefined();
            expect(mockExistsSync).toHaveBeenCalledWith('LICENSE');
            expect(mockExistsSync).toHaveBeenCalledWith('LICENSE.txt');
            expect(mockExistsSync).toHaveBeenCalledWith('LICENSE.md');
            expect(mockExistsSync).toHaveBeenCalledWith('license');
            expect(mockExistsSync).toHaveBeenCalledWith('license.txt');
            expect(mockExistsSync).toHaveBeenCalledWith('license.md');
            expect(mockExistsSync).toHaveBeenCalledWith('COPYING');
            expect(mockExistsSync).toHaveBeenCalledWith('COPYING.txt');
        });

        it('should detect MIT license from LICENSE file', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE');
            mockReadFileSync.mockReturnValue('MIT License\n\nCopyright (c) 2023');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'MIT License',
                spdxId: 'MIT',
                url: null
            });
            expect(mockReadFileSync).toHaveBeenCalledWith('LICENSE', 'utf-8');
        });

        it('should detect Apache 2.0 license from LICENSE.txt file', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE.txt');
            mockReadFileSync.mockReturnValue('Apache License\nVersion 2.0, January 2004');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'Apache License 2.0',
                spdxId: 'Apache-2.0',
                url: null
            });
            expect(mockReadFileSync).toHaveBeenCalledWith('LICENSE.txt', 'utf-8');
        });

        it('should detect GPL v3 license from LICENSE.md file', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE.md');
            mockReadFileSync.mockReturnValue('GNU GENERAL PUBLIC LICENSE\nVersion 3, 29 June 2007');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'GNU General Public License v3.0',
                spdxId: 'GPL-3.0',
                url: null
            });
            expect(mockReadFileSync).toHaveBeenCalledWith('LICENSE.md', 'utf-8');
        });

        it('should detect GPL v2 license', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE');
            mockReadFileSync.mockReturnValue('GNU GENERAL PUBLIC LICENSE\nVersion 2, June 1991');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'GNU General Public License v2.0',
                spdxId: 'GPL-2.0',
                url: null
            });
        });

        it('should detect BSD 3-Clause license', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE');
            mockReadFileSync.mockReturnValue('BSD 3-Clause License\nRedistribution and use');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'BSD 3-Clause "New" or "Revised" License',
                spdxId: 'BSD-3-Clause',
                url: null
            });
        });

        it('should detect BSD 2-Clause license', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE');
            mockReadFileSync.mockReturnValue('BSD 2-Clause License\nRedistribution and use');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'BSD 2-Clause "Simplified" License',
                spdxId: 'BSD-2-Clause',
                url: null
            });
        });

        it('should detect ISC license', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE');
            mockReadFileSync.mockReturnValue('ISC License\nCopyright (c) 2023');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'ISC License',
                spdxId: 'ISC',
                url: null
            });
        });

        it('should detect custom license when content does not match known patterns', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE');
            mockReadFileSync.mockReturnValue('Custom Proprietary License\nAll rights reserved');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'Custom License',
                spdxId: null,
                url: null
            });
        });

        it('should handle file read errors gracefully', () => {
            // Arrange
            mockExistsSync.mockReturnValue(true);
            mockReadFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            // Mock console.warn to avoid output during tests
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to read license file LICENSE:', expect.any(Error));

            // Cleanup
            consoleSpy.mockRestore();
        });

        it('should check multiple license file paths in order', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'license.txt');
            mockReadFileSync.mockReturnValue('MIT License');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'MIT License',
                spdxId: 'MIT',
                url: null
            });
            // Verify it checked files in correct order
            expect(mockExistsSync).toHaveBeenNthCalledWith(1, 'LICENSE');
            expect(mockExistsSync).toHaveBeenNthCalledWith(2, 'LICENSE.txt');
            expect(mockExistsSync).toHaveBeenNthCalledWith(3, 'LICENSE.md');
            expect(mockExistsSync).toHaveBeenNthCalledWith(4, 'license');
            expect(mockExistsSync).toHaveBeenNthCalledWith(5, 'license.txt');
            expect(mockReadFileSync).toHaveBeenCalledWith('license.txt', 'utf-8');
        });

        it('should use first found license file', () => {
            // Arrange
            mockExistsSync.mockImplementation((path: string) => path === 'LICENSE' || path === 'LICENSE.txt');
            mockReadFileSync.mockReturnValue('MIT License');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result).toEqual({
                name: 'MIT License',
                spdxId: 'MIT',
                url: null
            });
            expect(mockReadFileSync).toHaveBeenCalledWith('LICENSE', 'utf-8');
            expect(mockReadFileSync).not.toHaveBeenCalledWith('LICENSE.txt', 'utf-8');
        });
    });

    describe('detectLicenseType', () => {
        it('should handle case-insensitive detection', () => {
            // Arrange
            mockExistsSync.mockReturnValue(true);
            mockReadFileSync.mockReturnValue('mit license');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result?.name).toBe('MIT License');
        });

        it('should handle license with "licence" spelling', () => {
            // Arrange
            mockExistsSync.mockReturnValue(true);
            mockReadFileSync.mockReturnValue('MIT LICENCE');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result?.name).toBe('MIT License');
        });
    });

    describe('getSpdxIdFromName', () => {
        it('should return correct SPDX ID for known licenses', () => {
            // Test through the public interface by checking the results
            const testCases = [
                { content: 'MIT License', expectedSpdx: 'MIT' },
                { content: 'Apache License Version 2.0', expectedSpdx: 'Apache-2.0' },
                { content: 'GNU GENERAL PUBLIC LICENSE Version 3', expectedSpdx: 'GPL-3.0' },
                { content: 'GNU GENERAL PUBLIC LICENSE Version 2', expectedSpdx: 'GPL-2.0' },
                { content: 'BSD 3-Clause License', expectedSpdx: 'BSD-3-Clause' },
                { content: 'BSD 2-Clause License', expectedSpdx: 'BSD-2-Clause' },
                { content: 'ISC License', expectedSpdx: 'ISC' }
            ];

            testCases.forEach(({ content, expectedSpdx }) => {
                // Arrange
                mockExistsSync.mockReturnValue(true);
                mockReadFileSync.mockReturnValue(content);

                // Act
                const result = licenseService.detectLicenseFromFile();

                // Assert
                expect(result?.spdxId).toBe(expectedSpdx);

                // Reset for next iteration
                vi.resetAllMocks();
            });
        });

        it('should return null for unknown licenses', () => {
            // Arrange
            mockExistsSync.mockReturnValue(true);
            mockReadFileSync.mockReturnValue('Unknown License');

            // Act
            const result = licenseService.detectLicenseFromFile();

            // Assert
            expect(result?.spdxId).toBeNull();
        });
    });
});