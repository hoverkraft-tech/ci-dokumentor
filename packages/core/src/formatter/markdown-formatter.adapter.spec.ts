import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownFormatterAdapter } from './markdown-formatter.adapter.js';
import { FormatterLanguage } from './formatter-language.js';

describe('MarkdownFormatterAdapter', () => {
    let adapter: MarkdownFormatterAdapter;

    beforeEach(() => {
        adapter = new MarkdownFormatterAdapter();
    });

    describe('supportsLanguage', () => {
        it('should return true for Markdown language', () => {
            // Act
            const result = adapter.supportsLanguage(FormatterLanguage.Markdown);

            // Assert
            expect(result).toBe(true);
        });

        it('should return false for unsupported languages', () => {
            // Arrange
            const unsupportedLanguage = 'html' as FormatterLanguage;

            // Act
            const result = adapter.supportsLanguage(unsupportedLanguage);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('heading', () => {
        it('should format text as markdown heading with # prefix', () => {
            // Arrange
            const input = Buffer.from('Test Heading');

            // Act
            const result = adapter.heading(input);

            // Assert
            expect(result.toString()).toBe('# Test Heading');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.heading(input);

            // Assert
            expect(result.toString()).toBe('# ');
        });

        it('should handle multi-word headings', () => {
            // Arrange
            const input = Buffer.from('This is a Long Heading with Multiple Words');

            // Act
            const result = adapter.heading(input);

            // Assert
            expect(result.toString()).toBe('# This is a Long Heading with Multiple Words');
        });

        it('should handle headings with special characters', () => {
            // Arrange
            const input = Buffer.from('Heading with "quotes" & symbols!');

            // Act
            const result = adapter.heading(input);

            // Assert
            expect(result.toString()).toBe('# Heading with "quotes" & symbols!');
        });

        it('should handle headings with numbers', () => {
            // Arrange
            const input = Buffer.from('Version 1.0.0 Release Notes');

            // Act
            const result = adapter.heading(input);

            // Assert
            expect(result.toString()).toBe('# Version 1.0.0 Release Notes');
        });
    });

    describe('comment', () => {
        it('should format text as markdown comment with proper syntax', () => {
            // Arrange
            const input = Buffer.from('This is a comment');

            // Act
            const result = adapter.comment(input);

            // Assert
            expect(result.toString()).toBe('<!-- This is a comment -->');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.comment(input);

            // Assert
            expect(result.toString()).toBe('<!--  -->');
        });

        it('should handle multi-line comments', () => {
            // Arrange
            const input = Buffer.from('First line\nSecond line');

            // Act
            const result = adapter.comment(input);

            // Assert
            expect(result.toString()).toBe('<!-- First line\nSecond line -->');
        });

        it('should handle comments with special characters', () => {
            // Arrange
            const input = Buffer.from('Comment with "quotes" & symbols!');

            // Act
            const result = adapter.comment(input);

            // Assert
            expect(result.toString()).toBe('<!-- Comment with "quotes" & symbols! -->');
        });

        it('should handle whitespace correctly', () => {
            // Arrange
            const input = Buffer.from('  spaced content  ');

            // Act
            const result = adapter.comment(input);

            // Assert
            expect(result.toString()).toBe('<!--   spaced content   -->');
        });

        it('should handle comments with existing HTML comment syntax', () => {
            // Arrange
            const input = Buffer.from('Already has <!-- comment --> syntax');

            // Act
            const result = adapter.comment(input);

            // Assert
            expect(result.toString()).toBe('<!-- Already has <!-- comment --> syntax -->');
        });
    });
});
