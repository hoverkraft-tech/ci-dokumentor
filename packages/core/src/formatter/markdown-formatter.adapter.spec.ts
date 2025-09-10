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
      expect(result).toEqual(true);
    });

    it('should return false for unsupported languages', () => {
      // Arrange
      const unsupportedLanguage = 'html' as FormatterLanguage;

      // Act
      const result = adapter.supportsLanguage(unsupportedLanguage);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('appendContent', () => {
    it('should concatenate multiple Buffers into one', () => {
      // Arrange
      const buffer1 = Buffer.from('Hello');
      const buffer2 = Buffer.from('World');
      const buffer3 = Buffer.from('!');

      // Act
      const result = adapter.appendContent(buffer1, buffer2, buffer3);

      // Assert
      expect(result.toString()).toEqual('HelloWorld!');
    });
  });

  describe('heading', () => {
    it('should format text as markdown heading with # prefix', () => {
      // Arrange
      const input = Buffer.from('Test Heading');

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toEqual('# Test Heading\n');
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.alloc(0);

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toEqual('# \n');
    });

    it('should handle multi-word headings', () => {
      // Arrange
      const input = Buffer.from('This is a Long Heading with Multiple Words');

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toEqual(
        '# This is a Long Heading with Multiple Words\n'
      );
    });

    it('should handle headings with special characters', () => {
      // Arrange
      const input = Buffer.from('Heading with "quotes" & symbols!');

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toEqual('# Heading with "quotes" & symbols!\n');
    });

    it('should handle headings with numbers', () => {
      // Arrange
      const input = Buffer.from('Version 1.0.0 Release Notes');

      // Act
      const result = adapter.heading(input);

      // Assert
      expect(result.toString()).toEqual('# Version 1.0.0 Release Notes\n');
    });

    it('should handle different heading levels', () => {
      // Arrange
      const input = Buffer.from('Test Heading');

      // Act & Assert
      expect(adapter.heading(input, 1).toString()).toEqual('# Test Heading\n');
      expect(adapter.heading(input, 2).toString()).toEqual('## Test Heading\n');
      expect(adapter.heading(input, 3).toString()).toEqual('### Test Heading\n');
      expect(adapter.heading(input, 4).toString()).toEqual('#### Test Heading\n');
      expect(adapter.heading(input, 5).toString()).toEqual('##### Test Heading\n');
      expect(adapter.heading(input, 6).toString()).toEqual('###### Test Heading\n');
    });

    it('should clamp heading levels to valid range (1-6)', () => {
      // Arrange
      const input = Buffer.from('Test Heading');

      // Act & Assert
      expect(adapter.heading(input, 0).toString()).toEqual('# Test Heading\n'); // Should be clamped to 1
      expect(adapter.heading(input, 7).toString()).toEqual('###### Test Heading\n'); // Should be clamped to 6
      expect(adapter.heading(input, -1).toString()).toEqual('# Test Heading\n'); // Should be clamped to 1
      expect(adapter.heading(input, 10).toString()).toEqual('###### Test Heading\n'); // Should be clamped to 6
    });
  });

  describe('center', () => {
    it('should format text with center alignment', () => {
      // Arrange
      const input = Buffer.from('Centered Text');

      // Act
      const result = adapter.center(input);

      // Assert
      expect(result.toString()).toEqual(
        `<div align="center">
  Centered Text
</div>
`
      );
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.alloc(0);

      // Act
      const result = adapter.center(input);

      // Assert
      expect(result.toString()).toEqual(
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
      expect(result.toString()).toEqual(
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
      expect(result.toString()).toEqual('<!-- This is a comment -->\n');
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.alloc(0);

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toEqual('<!--  -->\n');
    });

    it('should handle multi-line comments', () => {
      // Arrange
      const input = Buffer.from('First line\nSecond line');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toEqual('<!-- First line\nSecond line -->\n');
    });

    it('should handle comments with special characters', () => {
      // Arrange
      const input = Buffer.from('Comment with "quotes" & symbols!');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toEqual(
        '<!-- Comment with "quotes" & symbols! -->\n'
      );
    });

    it('should handle whitespace correctly', () => {
      // Arrange
      const input = Buffer.from('  spaced content  ');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toEqual('<!--   spaced content   -->\n');
    });

    it('should handle comments with existing HTML comment syntax', () => {
      // Arrange
      const input = Buffer.from('Already has <!-- comment --> syntax');

      // Act
      const result = adapter.comment(input);

      // Assert
      expect(result.toString()).toEqual(
        '<!-- Already has <!-- comment --> syntax -->\n'
      );
    });

    it('should escape comment close sequence', () => {
      const input = Buffer.from('okay --> not');
      const result = adapter.comment(input);
      expect(result.toString()).toEqual('<!-- okay --\\> not -->\n');
    });
  });

  describe('paragraph', () => {
    it('should format text as paragraph with newline', () => {
      // Arrange
      const input = Buffer.from('This is a paragraph');

      // Act
      const result = adapter.paragraph(input);

      // Assert
      expect(result.toString()).toEqual('This is a paragraph\n');
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.alloc(0);

      // Act
      const result = adapter.paragraph(input);

      // Assert
      expect(result.toString()).toEqual('\n');
    });

    it('should handle multi-line text', () => {
      // Arrange
      const input = Buffer.from('First line\nSecond line');

      // Act
      const result = adapter.paragraph(input);

      // Assert
      expect(result.toString()).toEqual('First line\nSecond line\n');
    });
  });

  describe('bold', () => {
    it('should format text as bold with ** markers', () => {
      // Arrange
      const input = Buffer.from('Bold Text');

      // Act
      const result = adapter.bold(input);

      // Assert
      expect(result.toString()).toEqual('**Bold Text**');
    });

    it('should escape asterisks inside bold', () => {
      const input = Buffer.from('test ** test');
      const result = adapter.bold(input);
      expect(result.toString()).toEqual('**test \\*\\* test**');
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.alloc(0);

      // Act
      const result = adapter.bold(input);

      // Assert
      expect(result.toString()).toEqual('****');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const input = Buffer.from('Text with "quotes" & symbols!');

      // Act
      const result = adapter.bold(input);

      // Assert
      expect(result.toString()).toEqual('**Text with "quotes" & symbols!**');
    });

    it('should escape link text brackets and url parentheses', () => {
      const text = Buffer.from('Click [here]');
      const url = Buffer.from('https://example.com/foo)bar');
      const result = adapter.link(text, url);
      expect(result.toString()).toEqual('[Click \\[here\\]](https://example.com/foo\\)bar)');
    });
  });

  // Escaping tests were moved into their dedicated describe blocks below.

  describe('italic', () => {
    it('should format text as italic with * markers', () => {
      // Arrange
      const input = Buffer.from('Italic Text');

      // Act
      const result = adapter.italic(input);

      // Assert
      expect(result.toString()).toEqual('*Italic Text*');
    });

    it('should escape asterisks inside italic', () => {
      const input = Buffer.from('test * test');
      const result = adapter.italic(input);
      expect(result.toString()).toEqual('*test \\* test*');
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.alloc(0);

      // Act
      const result = adapter.italic(input);

      // Assert
      expect(result.toString()).toEqual('**');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const input = Buffer.from('Text with "quotes" & symbols!');

      // Act
      const result = adapter.italic(input);

      // Assert
      expect(result.toString()).toEqual('*Text with "quotes" & symbols!*');
    });
  });

  describe('code', () => {
    it('should format text as code block without language', () => {
      // Arrange
      const input = Buffer.from('console.log("Hello World");');

      // Act
      const result = adapter.code(input);

      // Assert
      expect(result.toString()).toEqual('```\nconsole.log("Hello World");\n```\n');
    });

    it('should format text as code block with language', () => {
      // Arrange
      const input = Buffer.from('console.log("Hello World");');
      const language = Buffer.from('javascript');

      // Act
      const result = adapter.code(input, language);

      // Assert
      expect(result.toString()).toEqual(
        '```javascript\nconsole.log("Hello World");\n```\n'
      );
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.alloc(0);

      // Act
      const result = adapter.code(input);

      // Assert
      expect(result.toString()).toEqual('```\n\n```\n');
    });

    it('should handle multi-line code', () => {
      // Arrange
      const input = Buffer.from('function test() {\n  return true;\n}');
      const language = Buffer.from('typescript');

      // Act
      const result = adapter.code(input, language);

      // Assert
      expect(result.toString()).toEqual(
        '```typescript\nfunction test() {\n  return true;\n}\n```\n'
      );
    });

    it('should handle empty ending line code', () => {
      // Arrange
      const input = Buffer.from('function test() {\n  return true;\n}\n\n');
      const language = Buffer.from('typescript');

      // Act
      const result = adapter.code(input, language);

      // Assert
      expect(result.toString()).toEqual(
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
      expect(result.toString()).toEqual('`console.log()`');
    });

    it('should handle empty string input', () => {
      // Arrange
      const input = Buffer.alloc(0);

      // Act
      const result = adapter.inlineCode(input);

      // Assert
      expect(result.toString()).toEqual('``');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const input = Buffer.from('getValue("key")');

      // Act
      const result = adapter.inlineCode(input);

      // Assert
      expect(result.toString()).toEqual('`getValue("key")`');
    });

    it('should escape backticks in inlineCode', () => {
      const input = Buffer.from('a ` b');
      const result = adapter.inlineCode(input);
      expect(result.toString()).toEqual('`a \\` b`');
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
      expect(result.toString()).toEqual('[GitHub](https://github.com)');
    });

    it('should handle empty text', () => {
      // Arrange
      const text = Buffer.alloc(0);
      const url = Buffer.from('https://example.com');

      // Act
      const result = adapter.link(text, url);

      // Assert
      expect(result.toString()).toEqual('[](https://example.com)');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const text = Buffer.from('Link with "quotes" & symbols!');
      const url = Buffer.from('https://example.com/path?query=value');

      // Act
      const result = adapter.link(text, url);

      // Assert
      expect(result.toString()).toEqual(
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
      expect(result.toString()).toEqual(
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
      expect(result.toString()).toEqual(
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
      expect(result.toString()).toEqual(
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
      expect(result.toString()).toEqual(
        '<img src="https://example.com/image.png" width="300px" align="center" alt="Alternative Text" />'
      );
    });

    it('should handle empty alt text', () => {
      // Arrange
      const altText = Buffer.alloc(0);
      const url = Buffer.from('https://example.com/image.png');

      // Act
      const result = adapter.image(url, altText);

      // Assert
      expect(result.toString()).toEqual('![](https://example.com/image.png)');
    });

    it('should escape image alt text brackets', () => {
      const alt = Buffer.from('Alt [text]');
      const url = Buffer.from('https://example.com/img.png');
      const result = adapter.image(url, alt);
      expect(result.toString()).toEqual('![Alt \\[text\\]](https://example.com/img.png)');
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
      expect(result.toString()).toEqual(
        `| Name | Age | City     |
| ---- | --- | -------- |
| John | 25  | New York |
| Jane | 30  | Paris    |
`);
    });

    it('should handle empty table', () => {
      // Arrange
      const headers: Buffer[] = [];
      const rows: Buffer[][] = [];

      // Act
      const result = adapter.table(headers, rows);

      // Assert
      expect(result.toString()).toEqual('');
    });

    it('should handle table with only headers', () => {
      // Arrange
      const headers = [Buffer.from('Column 1'), Buffer.from('Column 2')];
      const rows: Buffer[][] = [];

      // Act
      const result = adapter.table(headers, rows);

      // Assert
      expect(result.toString()).toEqual(
        `| Column 1 | Column 2 |
| -------- | -------- |
`
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
      expect(result.toString()).toEqual(
        `| Name     | Description                 |
| -------- | --------------------------- |
| Item "A" | Description with & symbols! |
`
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
      expect(result.toString()).toEqual(
        `| Name | Description    |
| ---- | -------------- |
| John | A person with  |
| Doe  | multiple lines |
|      | of description |
`
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
      expect(result.toString()).toEqual(
        `| Code        | Output                |
| ----------- | --------------------- |
| if (a \\| b) | result: true \\| false |
`
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
      expect(result.toString()).toEqual(
        `| Multi  | Description         |
| ------ | ------------------- |
| Line   |                     |
| Header |                     |
| Value  | Single line content |
`
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
      expect(result.toString()).toEqual(
        `| Name  | Status  | Notes            |
| ----- | ------- | ---------------- |
| John  | Active  | Single line note |
| Jane  | Pending | This is a        |
| Smith | Review  | multiline note   |
|       |         | with details     |
`
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
      expect(result.toString()).toEqual(
        '![build](https://img.shields.io/badge/build-passing-brightgreen)'
      );
    });

    it('should handle empty label', () => {
      // Arrange
      const label = Buffer.alloc(0);
      const url = Buffer.from('https://example.com/badge.svg');

      // Act
      const result = adapter.badge(label, url);

      // Assert
      expect(result.toString()).toEqual('![](https://example.com/badge.svg)');
    });

    it('should handle label with special characters', () => {
      // Arrange
      const label = Buffer.from('coverage-90%');
      const url = Buffer.from('https://example.com/coverage.svg');

      // Act
      const result = adapter.badge(label, url);

      // Assert
      expect(result.toString()).toEqual(
        '![coverage-90%](https://example.com/coverage.svg)'
      );
    });

    it('should escape badge label and url', () => {
      const label = Buffer.from('cov*er');
      const url = Buffer.from('https://example.com/ba)dge.svg');
      const result = adapter.badge(label, url);
      // badge uses label and url raw - after escapeForContext it should escape url paren and label asterisk
      expect(result.toString()).toEqual('![cov\\*er](https://example.com/ba\\)dge.svg)');
    });
  });

  describe('horizontalRule', () => {
    it('should return horizontal rule markdown', () => {
      // Act
      const result = adapter.horizontalRule();

      // Assert
      expect(result.toString()).toEqual('\n---\n');
    });
  });

  describe('lineBreak', () => {
    it('should return newline character', () => {
      // Act
      const result = adapter.lineBreak();

      // Assert
      expect(result.toString()).toEqual('\n');
    });
  });
});
