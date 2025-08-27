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
      expect(result.toString()).toBe('# Test Heading\n');
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.from('');

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toBe('# \n');
    });

    it('should handle multi-word headings', () => {
      // Arrange
      const input = Buffer.from('This is a Long Heading with Multiple Words');

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toBe(
        '# This is a Long Heading with Multiple Words\n'
      );
    });

    it('should handle headings with special characters', () => {
      // Arrange
      const input = Buffer.from('Heading with "quotes" & symbols!');

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toBe('# Heading with "quotes" & symbols!\n');
    });

    it('should handle headings with numbers', () => {
      // Arrange
      const input = Buffer.from('Version 1.0.0 Release Notes');

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toBe('# Version 1.0.0 Release Notes\n');
    });

    it('should handle different heading levels', () => {
      // Arrange
      const input = Buffer.from('Test Heading');

      // Act & Assert
      expect(adapter.heading(input, 1).toString()).toBe('# Test Heading\n');
      expect(adapter.heading(input, 2).toString()).toBe('## Test Heading\n');
      expect(adapter.heading(input, 3).toString()).toBe('### Test Heading\n');
      expect(adapter.heading(input, 4).toString()).toBe('#### Test Heading\n');
      expect(adapter.heading(input, 5).toString()).toBe('##### Test Heading\n');
      expect(adapter.heading(input, 6).toString()).toBe('###### Test Heading\n');
    });

    it('should clamp heading levels to valid range (1-6)', () => {
      // Arrange
      const input = Buffer.from('Test Heading');

      // Act & Assert
      expect(adapter.heading(input, 0).toString()).toBe('# Test Heading\n'); // Should be clamped to 1
      expect(adapter.heading(input, 7).toString()).toBe('###### Test Heading\n'); // Should be clamped to 6
      expect(adapter.heading(input, -1).toString()).toBe('# Test Heading\n'); // Should be clamped to 1
      expect(adapter.heading(input, 10).toString()).toBe('###### Test Heading\n'); // Should be clamped to 6
    });
  });

  describe('center', () => {
    it('should format text with center alignment', () => {
      // Arrange
      const input = Buffer.from('Centered Text');

      // Act
      const result = adapter.center(input);

      // Assert
      expect(result.toString()).toBe(
        `<div align="center">
  Centered Text
</div>
`
      );
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.from('');

      // Act
      const result = adapter.center(input);

      // Assert
      expect(result.toString()).toBe(
        `<div align="center"></div>
`
      );
    });

    it('should handle multi-line text', () => {
      // Arrange
      const input = Buffer.from('Line 1\nLine 2');

      // Act
      const result = adapter.center(input);

      // Assert
      expect(result.toString()).toBe(
        `<div align="center">
  Line 1
  Line 2
</div>
`
      );
    });
  });

  describe('comment', () => {
    it('should format text as markdown comment with proper syntax', () => {
      // Arrange
      const input = Buffer.from('This is a comment');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toBe('<!-- This is a comment -->\n');
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.from('');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toBe('<!--  -->\n');
    });

    it('should handle multi-line comments', () => {
      // Arrange
      const input = Buffer.from('First line\nSecond line');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toBe('<!-- First line\nSecond line -->\n');
    });

    it('should handle comments with special characters', () => {
      // Arrange
      const input = Buffer.from('Comment with "quotes" & symbols!');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toBe(
        '<!-- Comment with "quotes" & symbols! -->\n'
      );
    });

    it('should handle whitespace correctly', () => {
      // Arrange
      const input = Buffer.from('  spaced content  ');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toBe('<!--   spaced content   -->\n');
    });

    it('should handle comments with existing HTML comment syntax', () => {
      // Arrange
      const input = Buffer.from('Already has <!-- comment --> syntax');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toBe(
        '<!-- Already has <!-- comment --> syntax -->\n'
      );
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
      expect(result.toString()).toBe('```\nconsole.log("Hello World");\n```\n');
    });

    it('should format text as code block with language', () => {
      // Arrange
      const input = Buffer.from('console.log("Hello World");');
      const language = Buffer.from('javascript');

      // Act
      const result = adapter.code(input, language);

      // Assert
      expect(result.toString()).toBe(
        '```javascript\nconsole.log("Hello World");\n```\n'
      );
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.from('');

      // Act
      const result = adapter.code(input);

      // Assert
      expect(result.toString()).toBe('```\n\n```\n');
    });

    it('should handle multi-line code', () => {
      // Arrange
      const input = Buffer.from('function test() {\n  return true;\n}');
      const language = Buffer.from('typescript');

      // Act
      const result = adapter.code(input, language);

      // Assert
      expect(result.toString()).toBe(
        '```typescript\nfunction test() {\n  return true;\n}\n```\n'
      );
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
      const url = Buffer.from('https://github.com');


      // Act
      const result = adapter.link(text, url);

      // Assert
      expect(result.toString()).toBe('[GitHub](https://github.com)');
    });

    it('should handle empty text', () => {
      // Arrange
      const text = Buffer.from('');
      const url = Buffer.from('https://example.com');

      // Act
      const result = adapter.link(text, url);

      // Assert
      expect(result.toString()).toBe('[](https://example.com)');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const text = Buffer.from('Link with "quotes" & symbols!');
      const url = Buffer.from('https://example.com/path?query=value');

      // Act
      const result = adapter.link(text, url);

      // Assert
      expect(result.toString()).toBe(
        '[Link with "quotes" & symbols!](https://example.com/path?query=value)'
      );
    });
  });

  describe('image', () => {
    it('should format as markdown image without options', () => {
      // Arrange
      const altText = Buffer.from('Alternative Text');
      const url = Buffer.from('https://example.com/image.png');

      // Act
      const result = adapter.image(url, altText);

      // Assert
      expect(result.toString()).toBe(
        '![Alternative Text](https://example.com/image.png)'
      );
    });

    it('should format as HTML img tag with width option', () => {
      // Arrange
      const altText = Buffer.from('Alternative Text');
      const url = Buffer.from('https://example.com/image.png');
      const options = { width: '300px' };

      // Act
      const result = adapter.image(url, altText, options);

      // Assert
      expect(result.toString()).toBe(
        '<img src="https://example.com/image.png" width="300px" alt="Alternative Text" />'
      );
    });

    it('should format as HTML img tag with align option', () => {
      // Arrange
      const altText = Buffer.from('Alternative Text');
      const url = Buffer.from('https://example.com/image.png');
      const options = { align: 'center' };

      // Act
      const result = adapter.image(url, altText, options);

      // Assert
      expect(result.toString()).toBe(
        '<img src="https://example.com/image.png" align="center" alt="Alternative Text" />'
      );
    });

    it('should format as HTML img tag with both width and align options', () => {
      // Arrange
      const altText = Buffer.from('Alternative Text');
      const url = Buffer.from('https://example.com/image.png');
      const options = { width: '300px', align: 'center' };

      // Act
      const result = adapter.image(url, altText, options);

      // Assert
      expect(result.toString()).toBe(
        '<img src="https://example.com/image.png" width="300px" align="center" alt="Alternative Text" />'
      );
    });

    it('should handle empty alt text', () => {
      // Arrange
      const altText = Buffer.from('');
      const url = Buffer.from('https://example.com/image.png');

      // Act
      const result = adapter.image(url, altText);

      // Assert
      expect(result.toString()).toBe('![](https://example.com/image.png)');
    });
  });

  describe('table', () => {
    it('should format basic table with headers and rows', () => {
      // Arrange
      const headers = [
        Buffer.from('Name'),
        Buffer.from('Age'),
        Buffer.from('City'),
      ];
      const rows = [
        [Buffer.from('John'), Buffer.from('25'), Buffer.from('New York')],
        [Buffer.from('Jane'), Buffer.from('30'), Buffer.from('Paris')],
      ];

      // Act
      const result = adapter.table(headers, rows);

      // Assert
      expect(result.toString()).toBe(
        '| Name | Age | City |\n' +
        '| --- | --- | --- |\n' +
        '| John | 25 | New York |\n' +
        '| Jane | 30 | Paris |\n'
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
        '| Column 1 | Column 2 |\n' + '| --- | --- |\n'
      );
    });

    it('should handle table with special characters', () => {
      // Arrange
      const headers = [Buffer.from('Name'), Buffer.from('Description')];
      const rows = [
        [Buffer.from('Item "A"'), Buffer.from('Description with & symbols!')],
      ];

      // Act
      const result = adapter.table(headers, rows);

      // Assert
      expect(result.toString()).toBe(
        '| Name | Description |\n' +
        '| --- | --- |\n' +
        '| Item "A" | Description with & symbols! |\n'
      );
    });

    it('should handle multiline content in table cells', () => {
      // Arrange
      const headers = [Buffer.from('Name'), Buffer.from('Description')];
      const rows = [
        [
          Buffer.from('John\nDoe'),
          Buffer.from('A person with\nmultiple lines\nof description'),
        ],
      ];

      // Act
      const result = adapter.table(headers, rows);

      // Assert
      expect(result.toString()).toBe(
        '| Name | Description |\n' +
        '| --- | --- |\n' +
        '| John | A person with |\n' +
        '| Doe | multiple lines |\n' +
        '|  | of description |\n'
      );
    });

    it('should escape pipe characters in table cells', () => {
      // Arrange
      const headers = [Buffer.from('Code'), Buffer.from('Output')];
      const rows = [
        [Buffer.from('if (a | b)'), Buffer.from('result: true | false')],
      ];

      // Act
      const result = adapter.table(headers, rows);

      // Assert
      expect(result.toString()).toBe(
        '| Code | Output |\n' +
        '| --- | --- |\n' +
        '| if (a \\| b) | result: true \\| false |\n'
      );
    });

    it('should use Markdown table format when headers contain multiline content', () => {
      // Arrange
      const headers = [
        Buffer.from('Multi\nLine\nHeader'),
        Buffer.from('Description'),
      ];
      const rows = [[Buffer.from('Value'), Buffer.from('Single line content')]];

      // Act
      const result = adapter.table(headers, rows);

      // Assert
      expect(result.toString()).toBe(
        '| Multi | Description |\n' +
        '| --- | --- |\n' +
        '| Line |  |\n' +
        '| Header |  |\n' +
        '| Value | Single line content |\n'
      );
    });

    it('should handle mixed single-line and multiline content', () => {
      // Arrange
      const headers = [
        Buffer.from('Name'),
        Buffer.from('Status'),
        Buffer.from('Notes'),
      ];
      const rows = [
        [
          Buffer.from('John'),
          Buffer.from('Active'),
          Buffer.from('Single line note'),
        ],
        [
          Buffer.from('Jane\nSmith'),
          Buffer.from('Pending\nReview'),
          Buffer.from('This is a\nmultiline note\nwith details'),
        ],
      ];

      // Act
      const result = adapter.table(headers, rows);

      // Assert
      expect(result.toString()).toBe(
        '| Name | Status | Notes |\n' +
        '| --- | --- | --- |\n' +
        '| John | Active | Single line note |\n' +
        '| Jane | Pending | This is a |\n' +
        '| Smith | Review | multiline note |\n' +
        '|  |  | with details |\n'
      );
    });
  });

  describe('badge', () => {
    it('should format as badge image', () => {
      // Arrange
      const label = Buffer.from('build');
      const url = Buffer.from('https://img.shields.io/badge/build-passing-brightgreen');

      // Act
      const result = adapter.badge(label, url);

      // Assert
      expect(result.toString()).toBe(
        '![build](https://img.shields.io/badge/build-passing-brightgreen)'
      );
    });

    it('should handle empty label', () => {
      // Arrange
      const label = Buffer.from('');
      const url = Buffer.from('https://example.com/badge.svg');

      // Act
      const result = adapter.badge(label, url);

      // Assert
      expect(result.toString()).toBe('![](https://example.com/badge.svg)');
    });

    it('should handle label with special characters', () => {
      // Arrange
      const label = Buffer.from('coverage-90%');
      const url = Buffer.from('https://example.com/coverage.svg');

      // Act
      const result = adapter.badge(label, url);

      // Assert
      expect(result.toString()).toBe(
        '![coverage-90%](https://example.com/coverage.svg)'
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
});
