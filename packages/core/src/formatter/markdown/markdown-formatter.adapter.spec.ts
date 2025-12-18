import { describe, it, expect, beforeEach } from 'vitest';
import { FormatterLanguage } from '../formatter-language.js';
import { LinkFormat } from '../formatter.adapter.js';
import { SectionIdentifier } from '../../generator/section/section-generator.adapter.js';
import { ReadableContent } from '../../reader/readable-content.js';
import { MarkdownLinkGenerator } from './markdown-link.generator.js';
import { MarkdownTableGenerator } from './markdown-table.generator.js';
import { MarkdownFormatterAdapter } from './markdown-formatter.adapter.js';
import { MarkdownCodeGenerator } from './markdown-code.generator.js';

describe('MarkdownFormatterAdapter', () => {
  let adapter: MarkdownFormatterAdapter;

  beforeEach(() => {
    const markdownCodeGenerator = new MarkdownCodeGenerator();
    adapter = new MarkdownFormatterAdapter(
      new MarkdownTableGenerator(markdownCodeGenerator),
      new MarkdownLinkGenerator(),
      markdownCodeGenerator
    );
  });

  describe('supportsLanguage', () => {
    it.each([
      { name: 'markdown', language: FormatterLanguage.Markdown, expected: true },
      { name: 'unsupported', language: 'html' as FormatterLanguage, expected: false },
    ])('should return %s for $name', ({ language, expected }) => {
      // Act
      const result = adapter.supportsLanguage(language);

      // Assert
      expect(result).toEqual(expected);
    });
  });

  describe('heading', () => {
    it.each([
      { desc: 'basic', content: new ReadableContent('Test Heading'), expected: '# Test Heading\n' },
      { desc: 'empty', content: ReadableContent.empty(), expected: '# \n' },
      { desc: 'multi-word', content: new ReadableContent('This is a Long Heading with Multiple Words'), expected: '# This is a Long Heading with Multiple Words\n' },
      { desc: 'special-chars', content: new ReadableContent('Heading with "quotes" & symbols!'), expected: '# Heading with "quotes" & symbols!\n' },
      { desc: 'numbers', content: new ReadableContent('Version 1.0.0 Release Notes'), expected: '# Version 1.0.0 Release Notes\n' },
    ])('should format heading ($desc)', ({ content, expected }) => {
      const result = adapter.heading(content);
      expect(result.toString()).toEqual(expected);
    });

    it('should handle different heading levels', () => {
      // Arrange
      const content = new ReadableContent('Test Heading');

      // Act & Assert
      expect(adapter.heading(content, 1).toString()).toEqual('# Test Heading\n');
      expect(adapter.heading(content, 2).toString()).toEqual('## Test Heading\n');
      expect(adapter.heading(content, 3).toString()).toEqual('### Test Heading\n');
      expect(adapter.heading(content, 4).toString()).toEqual('#### Test Heading\n');
      expect(adapter.heading(content, 5).toString()).toEqual('##### Test Heading\n');
      expect(adapter.heading(content, 6).toString()).toEqual('###### Test Heading\n');
    });

    it('should clamp heading levels to valid range (1-6)', () => {
      // Arrange
      const content = new ReadableContent('Test Heading');

      // Act & Assert
      expect(adapter.heading(content, 0).toString()).toEqual('# Test Heading\n'); // Should be clamped to 1
      expect(adapter.heading(content, 7).toString()).toEqual('###### Test Heading\n'); // Should be clamped to 6
      expect(adapter.heading(content, -1).toString()).toEqual('# Test Heading\n'); // Should be clamped to 1
      expect(adapter.heading(content, 10).toString()).toEqual('###### Test Heading\n'); // Should be clamped to 6
    });
  });

  describe('center', () => {
    it.each([
      { desc: 'single-line', content: new ReadableContent('Centered Text'), expected: `<div align="center">\n  Centered Text\n</div>\n` },
      { desc: 'empty', content: ReadableContent.empty(), expected: `<div align="center"></div>\n` },
      { desc: 'multi-line', content: new ReadableContent('Line 1\nLine 2'), expected: `<div align="center">\n  Line 1\n  Line 2\n</div>\n` },
    ])('should format center ($desc)', ({ content, expected }) => {
      const result = adapter.center(content);
      expect(result.toString()).toEqual(expected);
    });
  });

  describe('paragraph', () => {
    it.each([
      { desc: 'single-line', content: new ReadableContent('This is a paragraph'), expected: 'This is a paragraph\n' },
      { desc: 'empty', content: ReadableContent.empty(), expected: '\n' },
      { desc: 'multi-line', content: new ReadableContent('First line\nSecond line'), expected: 'First line\nSecond line\n' },
    ])('should format paragraph ($desc)', ({ content, expected }) => {
      const result = adapter.paragraph(content);
      expect(result.toString()).toEqual(expected);
    });

    it('should set proper indentation for multiline list', () => {
      // Arrange
      const content = new ReadableContent(`Here is a list:
- Item 1
  - Subitem 1
  - Subitem 2
- Item 2
`);

      // Act
      const result = adapter.paragraph(content);

      // Assert
      expect(result.toString()).toEqual(`Here is a list:
- Item 1
  - Subitem 1
  - Subitem 2
- Item 2

`);
    });

    it('should set proper indentation for code blocks and bullet points', () => {
      // Arrange
      const content = new ReadableContent(`Here is a list:
- Item 1
  - Subitem 1
  - Subitem 2
- Item 2
  
Here is some code:
\`\`\`
const x = 10;
console.log(x);
\`\`\``);

      // Act
      const result = adapter.paragraph(content);

      // Assert
      expect(result.toString()).toEqual(`Here is a list:
- Item 1
  - Subitem 1
  - Subitem 2
- Item 2
  
Here is some code:
\`\`\`
const x = 10;
console.log(x);
\`\`\`
`);
    });

    describe('URL transformation', () => {
      describe('autolink format (default)', () => {
        it.each([
          {
            desc: 'transform URLs to autolinks by default',
            input: 'Visit https://example.com for more information',
            expected: 'Visit <https://example.com> for more information\n',
          },
          {
            desc: 'not transform URLs that are already in autolink format',
            input: 'Visit <https://example.com> for more',
            expected: 'Visit <https://example.com> for more\n',
          },
          {
            desc: 'transform multiple URLs to autolinks',
            input: 'Check https://github.com and https://stackoverflow.com',
            expected: 'Check <https://github.com> and <https://stackoverflow.com>\n',
          },
          {
            desc: 'handle URLs with query parameters and fragments',
            input: 'Search https://google.com/search?q=test#results',
            expected: 'Search <https://google.com/search?q=test#results>\n',
          },
          {
            desc: 'not transform URLs that are already in markdown links',
            input: 'Visit [Example](https://example.com) for more',
            expected: 'Visit [Example](https://example.com) for more\n',
          },
          {
            desc: 'transform standalone URLs but preserve existing markdown links',
            input: 'Visit [Example](https://example.com) or https://github.com',
            expected: 'Visit [Example](https://example.com) or <https://github.com>\n',
          },
          {
            desc: 'transform URLs within blockquotes',
            input: '> Here is some blockquote with a URL: https://example.com and an autolink <https://test.com> and a link [https://link.com](https://link.com)',
            expected: '> Here is some blockquote with a URL: <https://example.com> and an autolink <https://test.com> and a link [https://link.com](https://link.com)\n',
          },
          {
            desc: 'transform URLs preceding emojis',
            input: 'Here is some 😊 with a URL: https://example.com and an autolink <https://test.com> and a link [https://link.com](https://link.com). 😊',
            expected: 'Here is some 😊 with a URL: <https://example.com> and an autolink <https://test.com> and a link [https://link.com](https://link.com). 😊\n',
          },
          {
            desc: 'not transform URLs within inline code',
            input: 'Here is some code: `const url = "https://example.com";` and an autolink https://test.com',
            expected: 'Here is some code: `const url = "https://example.com";` and an autolink <https://test.com>\n',
          },
          {
            desc: 'not transform URLs within code block',
            input: 'Here is some code block:\n```\nconst url = "https://example.com";\n```\n and an autolink https://test.com',
            expected: 'Here is some code block:\n```\nconst url = "https://example.com";\n```\n and an autolink <https://test.com>\n',
          },
        ])('should %s', ({ input, expected }) => {
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          const result = adapter.paragraph(new ReadableContent(input));

          expect(result.toString()).toEqual(expected);
        });
      });

      describe('full link format', () => {
        it('should transform URLs to full links when linkFormat is Full', () => {
          // Arrange
          const content = new ReadableContent('Visit https://example.com for more information');
          adapter.setOptions({ linkFormat: LinkFormat.Full });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Visit [https://example.com](https://example.com) for more information\n');
        });

        it('should transform multiple URLs to full links', () => {
          // Arrange
          const content = new ReadableContent('Check https://github.com and https://stackoverflow.com');
          adapter.setOptions({ linkFormat: LinkFormat.Full });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Check [https://github.com](https://github.com) and [https://stackoverflow.com](https://stackoverflow.com)\n');
        });

        it('should handle URLs with complex paths in full link format', () => {
          // Arrange
          const content = new ReadableContent('API docs at https://api.example.com/v1/docs?format=json');
          adapter.setOptions({ linkFormat: LinkFormat.Full });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('API docs at [https://api.example.com/v1/docs?format=json](https://api.example.com/v1/docs?format=json)\n');
        });
      });

      describe('no URL transformation', () => {
        it('should not transform URLs when linkFormat is None', () => {
          // Arrange
          const content = new ReadableContent('Visit https://example.com for more information');
          adapter.setOptions({ linkFormat: LinkFormat.None });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Visit https://example.com for more information\n');
        });
      });

      describe('edge cases', () => {
        it('should handle empty input with URL transformation enabled', () => {
          // Arrange
          const content = ReadableContent.empty();
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('\n');
        });

        it('should handle text with no URLs', () => {
          // Arrange
          const content = new ReadableContent('This is just regular text without any URLs');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('This is just regular text without any URLs\n');
        });

        it('should handle URLs at the beginning and end of text', () => {
          // Arrange
          const content = new ReadableContent('https://start.com middle text https://end.com');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('<https://start.com> middle text <https://end.com>\n');
        });

        it('should only transform http and https URLs', () => {
          // Arrange
          const content = new ReadableContent('Visit https://example.com and ftp://files.com and mailto:test@example.com');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Visit <https://example.com> and ftp://files.com and mailto:test@example.com\n');
        });

        it('should handle URLs with trailing punctuation', () => {
          // Arrange
          const content = new ReadableContent('Check https://example.com, https://github.com. Also https://stackoverflow.com!');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Check <https://example.com>, <https://github.com>. Also <https://stackoverflow.com>!\n');
        });
      });
    });
  });

  describe('bold', () => {
    it.each([
      { desc: 'basic', content: new ReadableContent('Bold Text'), expected: '**Bold Text**' },
      { desc: 'escape asterisks', content: new ReadableContent('test ** test'), expected: '**test \\*\\* test**' },
      { desc: 'empty', content: ReadableContent.empty(), expected: '****' },
      { desc: 'special', content: new ReadableContent('Text with "quotes" & symbols!'), expected: '**Text with "quotes" & symbols!**' },
    ])('should format bold ($desc)', ({ content, expected }) => {
      const result = adapter.bold(content);
      expect(result.toString()).toEqual(expected);
    });

    it('should escape link text brackets and url parentheses', () => {
      const text = new ReadableContent('Click [here]');
      const url = new ReadableContent('https://example.com/foo)bar');
      const result = adapter.link(text, url);
      expect(result.toString()).toEqual('[Click \\[here\\]](https://example.com/foo\\)bar)');
    });
  });

  // Escaping tests were moved into their dedicated describe blocks below.

  describe('italic', () => {
    it.each([
      { desc: 'basic', content: new ReadableContent('Italic Text'), expected: '*Italic Text*' },
      { desc: 'escape asterisk', content: new ReadableContent('test * test'), expected: '*test \\* test*' },
      { desc: 'empty', content: ReadableContent.empty(), expected: '**' },
      { desc: 'special', content: new ReadableContent('Text with "quotes" & symbols!'), expected: '*Text with "quotes" & symbols!*' },
    ])('should format italic ($desc)', ({ content, expected }) => {
      const result = adapter.italic(content);
      expect(result.toString()).toEqual(expected);
    });
  });

  describe('code', () => {
    it('should format text as code block without language', () => {
      // Arrange
      const content = new ReadableContent('console.log("Hello World");');

      // Act
      const result = adapter.code(content);

      // Assert
      expect(result.toString()).toEqual('```text\nconsole.log("Hello World");\n```\n');
    });

    it('should format text as code block with language', () => {
      // Arrange
      const content = new ReadableContent('console.log("Hello World");');
      const language = new ReadableContent('javascript');

      // Act
      const result = adapter.code(content, language);

      // Assert
      expect(result.toString()).toEqual(
        '```javascript\nconsole.log("Hello World");\n```\n'
      );
    });

    it('should handle empty string input', () => {
      // Arrange
      const content = ReadableContent.empty();

      // Act
      const result = adapter.code(content);

      // Assert
      expect(result.toString()).toEqual('```text\n\n```\n');
    });

    it('should handle multi-line code', () => {
      // Arrange
      const content = new ReadableContent('function test() {\n  return true;\n}');
      const language = new ReadableContent('typescript');

      // Act
      const result = adapter.code(content, language);

      // Assert
      expect(result.toString()).toEqual(
        '```typescript\nfunction test() {\n  return true;\n}\n```\n'
      );
    });

    it('should handle empty ending line code', () => {
      // Arrange
      const content = new ReadableContent('function test() {\n  return true;\n}\n\n');
      const language = new ReadableContent('typescript');

      // Act
      const result = adapter.code(content, language);

      // Assert
      expect(result.toString()).toEqual(
        '```typescript\nfunction test() {\n  return true;\n}\n```\n'
      );
    });

    it('should use a longer fence when content contains backtick runs', () => {
      // Arrange: content contains a triple-backtick sequence inside
      const content = new ReadableContent(`const example = \`inline\`;
// code fence inside:
\`\`\`
some inner code
\`\`\`
end
`);

      // Act
      const result = adapter.code(content);

      // Assert: fence should be at least 4 backticks so inner ``` does not close it
      expect(result.toString()).toEqual(`\`\`\`\`text
const example = \`inline\`;
// code fence inside:
\`\`\`
some inner code
\`\`\`
end
\`\`\`\`
`);
    });
  });

  describe('inlineCode', () => {
    it.each([
      { desc: 'basic', content: new ReadableContent('console.log()'), expected: '`console.log()`' },
      { desc: 'empty', content: ReadableContent.empty(), expected: '``' },
      { desc: 'special', content: new ReadableContent('getValue("key")'), expected: '`getValue("key")`' },
      { desc: 'escape backtick', content: new ReadableContent('a ` b'), expected: '`a \\` b`' },
      { desc: 'escape markers', content: new ReadableContent('a ** b * c'), expected: '`a \\*\\* b \\* c`' },
      { desc: 'multiline', content: new ReadableContent('line1\nline2'), expected: '```text\nline1\nline2\n```\n' },
    ])('should format inlineCode ($desc)', ({ content, expected }) => {
      const result = adapter.inlineCode(content);
      expect(result.toString()).toEqual(expected);
    });


  });

  describe('link', () => {
    it.each([
      { desc: 'basic', text: new ReadableContent('GitHub'), url: new ReadableContent('https://github.com'), expected: '[GitHub](https://github.com)' },
      { desc: 'empty text', text: ReadableContent.empty(), url: new ReadableContent('https://example.com'), expected: '[](https://example.com)' },
      { desc: 'special chars', text: new ReadableContent('Link with "quotes" & symbols!'), url: new ReadableContent('https://example.com/path?query=value'), expected: '[Link with "quotes" & symbols!](https://example.com/path?query=value)' },
    ])('should format link ($desc)', ({ text, url, expected }) => {
      const result = adapter.link(text, url);
      expect(result.toString()).toEqual(expected);
    });
  });

  describe('image', () => {
    it.each([
      { desc: 'markdown image', alt: new ReadableContent('Alternative Text'), url: new ReadableContent('https://example.com/image.png'), options: undefined, expected: '![Alternative Text](https://example.com/image.png)' },
      { desc: 'width', alt: new ReadableContent('Alternative Text'), url: new ReadableContent('https://example.com/image.png'), options: { width: '300px' }, expected: '<img src="https://example.com/image.png" width="300px" alt="Alternative Text" />' },
      { desc: 'align', alt: new ReadableContent('Alternative Text'), url: new ReadableContent('https://example.com/image.png'), options: { align: 'center' }, expected: '<img src="https://example.com/image.png" align="center" alt="Alternative Text" />' },
      { desc: 'both', alt: new ReadableContent('Alternative Text'), url: new ReadableContent('https://example.com/image.png'), options: { width: '300px', align: 'center' }, expected: '<img src="https://example.com/image.png" width="300px" align="center" alt="Alternative Text" />' },
    ])('should format image ($desc)', ({ alt, url, options, expected }) => {
      const result = adapter.image(url, alt, options as Record<string, string> | undefined);
      expect(result.toString()).toEqual(expected);
    });

    it('should handle empty alt text', () => {
      // Arrange
      const altText = ReadableContent.empty();
      const url = new ReadableContent('https://example.com/image.png');

      // Act
      const result = adapter.image(url, altText);

      // Assert
      expect(result.toString()).toEqual('![](https://example.com/image.png)');
    });

    it('should escape image alt text brackets', () => {
      const alt = new ReadableContent('Alt [text]');
      const url = new ReadableContent('https://example.com/img.png');
      const result = adapter.image(url, alt);
      expect(result.toString()).toEqual('![Alt \\[text\\]](https://example.com/img.png)');
    });
  });

  describe('table', () => {
    it('should format basic table with headers and rows', () => {
      // Arrange
      const headers = [
        new ReadableContent('Name'),
        new ReadableContent('Age'),
        new ReadableContent('City'),
      ];
      const rows = [
        [new ReadableContent('John'), new ReadableContent('25'), new ReadableContent('New York')],
        [new ReadableContent('Jane'), new ReadableContent('30'), new ReadableContent('Paris')],
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
  });

  describe('badge', () => {
    it('should format as badge image', () => {
      // Arrange
      const label = new ReadableContent('build');
      const url = new ReadableContent('https://img.shields.io/badge/build-passing-brightgreen');

      // Act
      const result = adapter.badge(label, url);

      // Assert
      expect(result.toString()).toEqual(
        '![build](https://img.shields.io/badge/build-passing-brightgreen)'
      );
    });

    it('should handle empty label', () => {
      // Arrange
      const label = ReadableContent.empty();
      const url = new ReadableContent('https://example.com/badge.svg');

      // Act
      const result = adapter.badge(label, url);

      // Assert
      expect(result.toString()).toEqual('![](https://example.com/badge.svg)');
    });

    it('should handle label with special characters', () => {
      // Arrange
      const label = new ReadableContent('coverage-90%');
      const url = new ReadableContent('https://example.com/coverage.svg');

      // Act
      const result = adapter.badge(label, url);

      // Assert
      expect(result.toString()).toEqual(
        '![coverage-90%](https://example.com/coverage.svg)'
      );
    });

    it('should escape badge label and url', () => {
      const label = new ReadableContent('cov*er');
      const url = new ReadableContent('https://example.com/ba)dge.svg');
      const result = adapter.badge(label, url);
      // badge uses label and url raw - after escapeForContext it should escape url paren and label asterisk
      expect(result.toString()).toEqual('![cov\\*er](https://example.com/ba\\)dge.svg)');
    });
  });

  describe('list', () => {
    it('should format unordered list', () => {
      // Arrange
      const items = [
        new ReadableContent('Item 1'),
        new ReadableContent('Item 2'),
        new ReadableContent('Item 3'),
      ];

      // Act
      const result = adapter.list(items);

      // Assert
      expect(result.toString()).toEqual(
        `- Item 1
- Item 2
- Item 3
`
      );
    });

    it('should format ordered list', () => {
      // Arrange
      const items = [
        new ReadableContent('First'),
        new ReadableContent('Second'),
        new ReadableContent('Third'),
      ];

      // Act
      const result = adapter.list(items, true);

      // Assert
      expect(result.toString()).toEqual(
        `1. First
2. Second
3. Third
`
      );
    });

    it('should handle empty list', () => {
      // Arrange
      const items: ReadableContent[] = [];

      // Act
      const result = adapter.list(items);

      // Assert
      expect(result.toString()).toEqual('');
    });
  });

  describe('horizontalRule', () => {
    it('should return horizontal rule markdown', () => {
      // Act
      const result = adapter.horizontalRule();

      // Assert
      expect(result.toString()).toEqual('---\n');
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

  describe('section', () => {
    it('should return input wrapped in section markers', () => {
      // Act
      const result = adapter.section(SectionIdentifier.Examples, new ReadableContent('Section Content'));

      // Assert
      expect(result.toString()).toEqual(`<!-- examples:start -->

Section Content

<!-- examples:end -->
`);
    });

    it('should handle empty content', () => {
      // Act
      const result = adapter.section(SectionIdentifier.Examples, ReadableContent.empty());

      // Assert
      expect(result.toString()).toEqual(`<!-- examples:start -->
<!-- examples:end -->
`);
    });
  });

  describe('sectionStart', () => {
    it('should return section start markers', () => {
      // Act
      const result = adapter.sectionStart(SectionIdentifier.Examples);

      // Assert
      expect(result.toString()).toEqual("<!-- examples:start -->");
    });

  });

  describe('sectionEnd', () => {
    it('should return section end markers', () => {
      // Act
      const result = adapter.sectionEnd(SectionIdentifier.Examples);

      // Assert
      expect(result.toString()).toEqual("<!-- examples:end -->");
    });
  });
});
