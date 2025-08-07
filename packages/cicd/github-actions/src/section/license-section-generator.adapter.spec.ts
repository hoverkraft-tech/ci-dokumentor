import { describe, it, expect } from 'vitest';
import { LicenseSectionGenerator } from './license-section-generator.adapter.js';
import { MarkdownFormatterAdapter } from '@ci-dokumentor/core';

describe('LicenseSectionGenerator - Enhanced License Support', () => {
    it('should generate license section with GitHub API license information', () => {
        const generator = new LicenseSectionGenerator();
        const formatter = new MarkdownFormatterAdapter();
        
        const mockRepository = {
            owner: 'testowner',
            name: 'testrepo',
            url: 'https://github.com/testowner/testrepo',
            fullName: 'testowner/testrepo',
            license: {
                name: 'Apache License 2.0',
                spdxId: 'Apache-2.0',
                url: 'https://api.github.com/licenses/apache-2.0'
            }
        };
        
        const mockManifest = {
            name: 'test-action',
            author: 'Test Author',
            runs: { using: 'node16', main: 'index.js' }
        };
        
        const result = generator.generateSection(formatter, mockManifest, mockRepository);
        const content = result.toString();
        
        expect(content).toContain('This project is licensed under the Apache License 2.0');
        expect(content).toContain('SPDX-License-Identifier: Apache-2.0');
        expect(content).toContain('https://api.github.com/licenses/apache-2.0');
        expect(content).toContain('Test Author');
    });
    
    it('should fallback to MIT license when no license information is available', () => {
        const generator = new LicenseSectionGenerator();
        const formatter = new MarkdownFormatterAdapter();
        
        const mockRepository = {
            owner: 'testowner',
            name: 'testrepo',
            url: 'https://github.com/testowner/testrepo',
            fullName: 'testowner/testrepo'
        };
        
        const mockManifest = {
            name: 'test-action',
            author: 'Test Author',
            runs: { using: 'node16', main: 'index.js' }
        };
        
        const result = generator.generateSection(formatter, mockManifest, mockRepository);
        const content = result.toString();
        
        expect(content).toContain('This project is licensed under the MIT License');
        expect(content).toContain('Test Author');
        expect(content).toContain('LICENSE](LICENSE)');
    });
    
    it('should use repository owner as fallback author', () => {
        const generator = new LicenseSectionGenerator();
        const formatter = new MarkdownFormatterAdapter();
        
        const mockRepository = {
            owner: 'testowner',
            name: 'testrepo',
            url: 'https://github.com/testowner/testrepo',
            fullName: 'testowner/testrepo'
        };
        
        const mockManifest = {
            name: 'test-action',
            runs: { using: 'node16', main: 'index.js' }
        };
        
        const result = generator.generateSection(formatter, mockManifest, mockRepository);
        const content = result.toString();
        
        expect(content).toContain('testowner');
        expect(content).toContain('Made with ❤️ by testowner');
    });
});