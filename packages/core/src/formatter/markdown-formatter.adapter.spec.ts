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

        it('should handle different heading levels', () => {
            // Arrange
            const input = Buffer.from('Test Heading');

            // Act & Assert
            expect(adapter.heading(input, 1).toString()).toBe('# Test Heading');
            expect(adapter.heading(input, 2).toString()).toBe('## Test Heading');
            expect(adapter.heading(input, 3).toString()).toBe('### Test Heading');
            expect(adapter.heading(input, 4).toString()).toBe('#### Test Heading');
            expect(adapter.heading(input, 5).toString()).toBe('##### Test Heading');
            expect(adapter.heading(input, 6).toString()).toBe('###### Test Heading');
        });

        it('should clamp heading levels to valid range (1-6)', () => {
            // Arrange
            const input = Buffer.from('Test Heading');

            // Act & Assert
            expect(adapter.heading(input, 0).toString()).toBe('# Test Heading'); // Should be clamped to 1
            expect(adapter.heading(input, 7).toString()).toBe('###### Test Heading'); // Should be clamped to 6
            expect(adapter.heading(input, -1).toString()).toBe('# Test Heading'); // Should be clamped to 1
            expect(adapter.heading(input, 10).toString()).toBe('###### Test Heading'); // Should be clamped to 6
        });
    });

    describe('center', () => {
        it('should format text with center alignment', () => {
            // Arrange
            const input = Buffer.from('Centered Text');

            // Act
            const result = adapter.center(input);

            // Assert
            expect(result.toString()).toBe('<div align="center">\n\nCentered Text\n\n</div>');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.center(input);

            // Assert
            expect(result.toString()).toBe('<div align="center">\n\n\n\n</div>');
        });

        it('should handle multi-line text', () => {
            // Arrange
            const input = Buffer.from('Line 1\nLine 2');

            // Act
            const result = adapter.center(input);

            // Assert
            expect(result.toString()).toBe('<div align="center">\n\nLine 1\nLine 2\n\n</div>');
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

    describe('paragraph', () => {
        it('should format text as paragraph with newline', () => {
            // Arrange
            const input = Buffer.from('This is a paragraph');

            // Act
            const result = adapter.paragraph(input);

            // Assert
            expect(result.toString()).toBe('This is a paragraph\n');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.paragraph(input);

            // Assert
            expect(result.toString()).toBe('\n');
        });

        it('should handle multi-line text', () => {
            // Arrange
            const input = Buffer.from('First line\nSecond line');

            // Act
            const result = adapter.paragraph(input);

            // Assert
            expect(result.toString()).toBe('First line\nSecond line\n');
        });
    });

    describe('bold', () => {
        it('should format text as bold with ** markers', () => {
            // Arrange
            const input = Buffer.from('Bold Text');

            // Act
            const result = adapter.bold(input);

            // Assert
            expect(result.toString()).toBe('**Bold Text**');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.bold(input);

            // Assert
            expect(result.toString()).toBe('****');
        });

        it('should handle text with special characters', () => {
            // Arrange
            const input = Buffer.from('Text with "quotes" & symbols!');

            // Act
            const result = adapter.bold(input);

            // Assert
            expect(result.toString()).toBe('**Text with "quotes" & symbols!**');
        });
    });

    describe('italic', () => {
        it('should format text as italic with * markers', () => {
            // Arrange
            const input = Buffer.from('Italic Text');

            // Act
            const result = adapter.italic(input);

            // Assert
            expect(result.toString()).toBe('*Italic Text*');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.italic(input);

            // Assert
            expect(result.toString()).toBe('**');
        });

        it('should handle text with special characters', () => {
            // Arrange
            const input = Buffer.from('Text with "quotes" & symbols!');

            // Act
            const result = adapter.italic(input);

            // Assert
            expect(result.toString()).toBe('*Text with "quotes" & symbols!*');
        });
    });

    describe('code', () => {
        it('should format text as code block without language', () => {
            // Arrange
            const input = Buffer.from('console.log("Hello World");');

            // Act
            const result = adapter.code(input);

            // Assert
            expect(result.toString()).toBe('```\nconsole.log("Hello World");\n```');
        });

        it('should format text as code block with language', () => {
            // Arrange
            const input = Buffer.from('console.log("Hello World");');

            // Act
            const result = adapter.code(input, 'javascript');

            // Assert
            expect(result.toString()).toBe('```javascript\nconsole.log("Hello World");\n```');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.code(input);

            // Assert
            expect(result.toString()).toBe('```\n\n```');
        });

        it('should handle multi-line code', () => {
            // Arrange
            const input = Buffer.from('function test() {\n  return true;\n}');

            // Act
            const result = adapter.code(input, 'typescript');

            // Assert
            expect(result.toString()).toBe('```typescript\nfunction test() {\n  return true;\n}\n```');
        });
    });

    describe('inlineCode', () => {
        it('should format text as inline code with backticks', () => {
            // Arrange
            const input = Buffer.from('console.log()');

            // Act
            const result = adapter.inlineCode(input);

            // Assert
            expect(result.toString()).toBe('`console.log()`');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.inlineCode(input);

            // Assert
            expect(result.toString()).toBe('``');
        });

        it('should handle text with special characters', () => {
            // Arrange
            const input = Buffer.from('getValue("key")');

            // Act
            const result = adapter.inlineCode(input);

            // Assert
            expect(result.toString()).toBe('`getValue("key")`');
        });
    });

    describe('link', () => {
        it('should format text as markdown link', () => {
            // Arrange
            const text = Buffer.from('GitHub');
            const url = 'https://github.com';

            // Act
            const result = adapter.link(text, url);

            // Assert
            expect(result.toString()).toBe('[GitHub](https://github.com)');
        });

        it('should handle empty text', () => {
            // Arrange
            const text = Buffer.from('');
            const url = 'https://example.com';

            // Act
            const result = adapter.link(text, url);

            // Assert
            expect(result.toString()).toBe('[](https://example.com)');
        });

        it('should handle text with special characters', () => {
            // Arrange
            const text = Buffer.from('Link with "quotes" & symbols!');
            const url = 'https://example.com/path?query=value';

            // Act
            const result = adapter.link(text, url);

            // Assert
            expect(result.toString()).toBe('[Link with "quotes" & symbols!](https://example.com/path?query=value)');
        });
    });

    describe('image', () => {
        it('should format as markdown image without options', () => {
            // Arrange
            const altText = Buffer.from('Alternative Text');
            const url = 'https://example.com/image.png';

            // Act
            const result = adapter.image(altText, url);

            // Assert
            expect(result.toString()).toBe('![Alternative Text](https://example.com/image.png)');
        });

        it('should format as HTML img tag with width option', () => {
            // Arrange
            const altText = Buffer.from('Alternative Text');
            const url = 'https://example.com/image.png';
            const options = { width: '300px' };

            // Act
            const result = adapter.image(altText, url, options);

            // Assert
            expect(result.toString()).toBe('<img src="https://example.com/image.png" width="300px" alt="Alternative Text" />');
        });

        it('should format as HTML img tag with align option', () => {
            // Arrange
            const altText = Buffer.from('Alternative Text');
            const url = 'https://example.com/image.png';
            const options = { align: 'center' };

            // Act
            const result = adapter.image(altText, url, options);

            // Assert
            expect(result.toString()).toBe('<img src="https://example.com/image.png" align="center" alt="Alternative Text" />');
        });

        it('should format as HTML img tag with both width and align options', () => {
            // Arrange
            const altText = Buffer.from('Alternative Text');
            const url = 'https://example.com/image.png';
            const options = { width: '300px', align: 'center' };

            // Act
            const result = adapter.image(altText, url, options);

            // Assert
            expect(result.toString()).toBe('<img src="https://example.com/image.png" width="300px" align="center" alt="Alternative Text" />');
        });

        it('should handle empty alt text', () => {
            // Arrange
            const altText = Buffer.from('');
            const url = 'https://example.com/image.png';

            // Act
            const result = adapter.image(altText, url);

            // Assert
            expect(result.toString()).toBe('![](https://example.com/image.png)');
        });
    });

    describe('list', () => {
        it('should format as unordered list by default', () => {
            // Arrange
            const items = [
                Buffer.from('First item'),
                Buffer.from('Second item'),
                Buffer.from('Third item')
            ];

            // Act
            const result = adapter.list(items);

            // Assert
            expect(result.toString()).toBe('- First item\n- Second item\n- Third item');
        });

        it('should format as ordered list when specified', () => {
            // Arrange
            const items = [
                Buffer.from('First item'),
                Buffer.from('Second item'),
                Buffer.from('Third item')
            ];

            // Act
            const result = adapter.list(items, true);

            // Assert
            expect(result.toString()).toBe('1. First item\n2. Second item\n3. Third item');
        });

        it('should handle empty list', () => {
            // Arrange
            const items: Buffer[] = [];

            // Act
            const result = adapter.list(items);

            // Assert
            expect(result.toString()).toBe('');
        });

        it('should handle single item list', () => {
            // Arrange
            const items = [Buffer.from('Only item')];

            // Act
            const result = adapter.list(items);

            // Assert
            expect(result.toString()).toBe('- Only item');
        });

        it('should handle items with special characters', () => {
            // Arrange
            const items = [
                Buffer.from('Item with "quotes"'),
                Buffer.from('Item with & symbols!')
            ];

            // Act
            const result = adapter.list(items, true);

            // Assert
            expect(result.toString()).toBe('1. Item with "quotes"\n2. Item with & symbols!');
        });
    });

    describe('table', () => {
        it('should format basic table with headers and rows', () => {
            // Arrange
            const headers = [Buffer.from('Name'), Buffer.from('Age'), Buffer.from('City')];
            const rows = [
                [Buffer.from('John'), Buffer.from('25'), Buffer.from('New York')],
                [Buffer.from('Jane'), Buffer.from('30'), Buffer.from('Paris')]
            ];

            // Act
            const result = adapter.table(headers, rows);

            // Assert
            expect(result.toString()).toBe(
                '| Name | Age | City |\n' +
                '| --- | --- | --- |\n' +
                '| John | 25 | New York |\n' +
                '| Jane | 30 | Paris |'
            );
        });

        it('should handle empty table', () => {
            // Arrange
            const headers: Buffer[] = [];
            const rows: Buffer[][] = [];

            // Act
            const result = adapter.table(headers, rows);

            // Assert
            expect(result.toString()).toBe('|  |\n|  |\n');
        });

        it('should handle table with only headers', () => {
            // Arrange
            const headers = [Buffer.from('Column 1'), Buffer.from('Column 2')];
            const rows: Buffer[][] = [];

            // Act
            const result = adapter.table(headers, rows);

            // Assert
            expect(result.toString()).toBe(
                '| Column 1 | Column 2 |\n' +
                '| --- | --- |\n'
            );
        });

        it('should handle table with special characters', () => {
            // Arrange
            const headers = [Buffer.from('Name'), Buffer.from('Description')];
            const rows = [
                [Buffer.from('Item "A"'), Buffer.from('Description with & symbols!')]
            ];

            // Act
            const result = adapter.table(headers, rows);

            // Assert
            expect(result.toString()).toBe(
                '| Name | Description |\n' +
                '| --- | --- |\n' +
                '| Item "A" | Description with & symbols! |'
            );
        });
    });

    describe('badge', () => {
        it('should format as badge image', () => {
            // Arrange
            const label = 'build';
            const url = 'https://img.shields.io/badge/build-passing-brightgreen';

            // Act
            const result = adapter.badge(label, url);

            // Assert
            expect(result.toString()).toBe('![build](https://img.shields.io/badge/build-passing-brightgreen)');
        });

        it('should handle empty label', () => {
            // Arrange
            const label = '';
            const url = 'https://example.com/badge.svg';

            // Act
            const result = adapter.badge(label, url);

            // Assert
            expect(result.toString()).toBe('![](https://example.com/badge.svg)');
        });

        it('should handle label with special characters', () => {
            // Arrange
            const label = 'coverage-90%';
            const url = 'https://example.com/coverage.svg';

            // Act
            const result = adapter.badge(label, url);

            // Assert
            expect(result.toString()).toBe('![coverage-90%](https://example.com/coverage.svg)');
        });
    });

    describe('blockquote', () => {
        it('should format single line as blockquote', () => {
            // Arrange
            const input = Buffer.from('This is a quote');

            // Act
            const result = adapter.blockquote(input);

            // Assert
            expect(result.toString()).toBe('> This is a quote');
        });

        it('should format multi-line text as blockquote', () => {
            // Arrange
            const input = Buffer.from('First line\nSecond line\nThird line');

            // Act
            const result = adapter.blockquote(input);

            // Assert
            expect(result.toString()).toBe('> First line\n> Second line\n> Third line');
        });

        it('should handle empty string input', () => {
            // Arrange
            const input = Buffer.from('');

            // Act
            const result = adapter.blockquote(input);

            // Assert
            expect(result.toString()).toBe('> ');
        });

        it('should handle text with special characters', () => {
            // Arrange
            const input = Buffer.from('Quote with "nested quotes" & symbols!');

            // Act
            const result = adapter.blockquote(input);

            // Assert
            expect(result.toString()).toBe('> Quote with "nested quotes" & symbols!');
        });
    });

    describe('details', () => {
        it('should format as HTML details element', () => {
            // Arrange
            const summary = Buffer.from('Click to expand');
            const content = Buffer.from('Hidden content here');

            // Act
            const result = adapter.details(summary, content);

            // Assert
            expect(result.toString()).toBe(
                '<details>\n<summary>Click to expand</summary>\n\nHidden content here\n\n</details>'
            );
        });

        it('should handle empty summary and content', () => {
            // Arrange
            const summary = Buffer.from('');
            const content = Buffer.from('');

            // Act
            const result = adapter.details(summary, content);

            // Assert
            expect(result.toString()).toBe(
                '<details>\n<summary></summary>\n\n\n\n</details>'
            );
        });

        it('should handle multi-line content', () => {
            // Arrange
            const summary = Buffer.from('Code Example');
            const content = Buffer.from('function test() {\n  return true;\n}');

            // Act
            const result = adapter.details(summary, content);

            // Assert
            expect(result.toString()).toBe(
                '<details>\n<summary>Code Example</summary>\n\nfunction test() {\n  return true;\n}\n\n</details>'
            );
        });
    });

    describe('lineBreak', () => {
        it('should return newline character', () => {
            // Act
            const result = adapter.lineBreak();

            // Assert
            expect(result.toString()).toBe('\n');
        });
    });

    describe('horizontalRule', () => {
        it('should return horizontal rule', () => {
            // Act
            const result = adapter.horizontalRule();

            // Assert
            expect(result.toString()).toBe('---');
        });
    });
});
