import { describe, it, expect, beforeEach } from 'vitest';
import { FormatterLanguage } from '../formatter-language.js';
import { LinkFormat } from '../formatter.adapter.js';
import { SectionIdentifier } from '../../generator/section-generator.adapter.js';
import { ReadableContent } from '../../reader/readable-content.js';
import { MarkdownLinkGenerator } from './markdown-link.generator.js';
import { MarkdownTableGenerator } from './markdown-table.generator.js';
import { MarkdownFormatterAdapter } from './markdown-formatter.adapter.js';

describe('MarkdownFormatterAdapter', () => {
  let adapter: MarkdownFormatterAdapter;

  beforeEach(() => {
    adapter = new MarkdownFormatterAdapter(new MarkdownTableGenerator(), new MarkdownLinkGenerator());
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

  describe('heading', () => {
    it('should format text as markdown heading with # prefix', () => {
      // Arrange
      const content = new ReadableContent('Test Heading');

      // Act
      const result = adapter.heading(content);

      // Assert
      expect(result.toString()).toEqual('# Test Heading\n');
    });

    it('should handle empty string input', () => {
      // Arrange
      const content = ReadableContent.empty();

      // Act
      const result = adapter.heading(content);

      // Assert
      expect(result.toString()).toEqual('# \n');
    });

    it('should handle multi-word headings', () => {
      // Arrange
      const content = new ReadableContent('This is a Long Heading with Multiple Words');

      // Act
      const result = adapter.heading(content);

      // Assert
      expect(result.toString()).toEqual(
        '# This is a Long Heading with Multiple Words\n'
      );
    });

    it('should handle headings with special characters', () => {
      // Arrange
      const content = new ReadableContent('Heading with "quotes" & symbols!');

      // Act
      const result = adapter.heading(content);

      // Assert
      expect(result.toString()).toEqual('# Heading with "quotes" & symbols!\n');
    });

    it('should handle headings with numbers', () => {
      // Arrange
      const content = new ReadableContent('Version 1.0.0 Release Notes');

      // Act
      const result = adapter.heading(content);

      // Assert
      expect(result.toString()).toEqual('# Version 1.0.0 Release Notes\n');
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
    it('should format text with center alignment', () => {
      // Arrange
      const content = new ReadableContent('Centered Text');

      // Act
      const result = adapter.center(content);

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
      const content = ReadableContent.empty();

      // Act
      const result = adapter.center(content);

      // Assert
      expect(result.toString()).toEqual(
        `<div align="center"></div>
`
      );
    });

    it('should handle multi-line text', () => {
      // Arrange
      const content = new ReadableContent('Line 1\nLine 2');

      // Act
      const result = adapter.center(content);

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

  describe('paragraph', () => {
    it('should format text as paragraph with newline', () => {
      // Arrange
      const content = new ReadableContent('This is a paragraph');

      // Act
      const result = adapter.paragraph(content);

      // Assert
      expect(result.toString()).toEqual('This is a paragraph\n');
    });

    it('should handle empty string input', () => {
      // Arrange
      const content = ReadableContent.empty();

      // Act
      const result = adapter.paragraph(content);

      // Assert
      expect(result.toString()).toEqual('\n');
    });

    it('should handle multi-line text', () => {
      // Arrange
      const content = new ReadableContent('First line\nSecond line');

      // Act
      const result = adapter.paragraph(content);

      // Assert
      expect(result.toString()).toEqual('First line\nSecond line\n');
    });

    it('should set proper indentation for multiline bullet points', () => {
      // Arrange
      const content = new ReadableContent('- Bullet 1\nSecond line of bullet 1\nThird line of bullet 1\n- Bullet 2');

      // Act
      const result = adapter.paragraph(content);

      // Assert
      expect(result.toString()).toEqual(`- Bullet 1
  Second line of bullet 1
  Third line of bullet 1
- Bullet 2
`);
    });

    describe('URL transformation', () => {
      describe('autolink format (default)', () => {
        it('should transform URLs to autolinks by default', () => {
          // Arrange
          const content = new ReadableContent('Visit https://example.com for more information');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Visit <https://example.com> for more information\n');
        });

        it('should not transform URLs that are already in autolink format', () => {
          // Arrange
          const content = new ReadableContent('Visit <https://example.com> for more');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Visit <https://example.com> for more\n');
        });

        it('should transform multiple URLs to autolinks', () => {
          // Arrange
          const content = new ReadableContent('Check https://github.com and https://stackoverflow.com');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Check <https://github.com> and <https://stackoverflow.com>\n');
        });

        it('should handle URLs with query parameters and fragments', () => {
          // Arrange
          const content = new ReadableContent('Search https://google.com/search?q=test#results');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Search <https://google.com/search?q=test#results>\n');
        });

        it('should not transform URLs that are already in markdown links', () => {
          // Arrange
          const content = new ReadableContent('Visit [Example](https://example.com) for more');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Visit [Example](https://example.com) for more\n');
        });

        it('should transform standalone URLs but preserve existing markdown links', () => {
          // Arrange
          const content = new ReadableContent('Visit [Example](https://example.com) or https://github.com');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Visit [Example](https://example.com) or <https://github.com>\n');
        });

        it('should not transform URLs within inline code', () => {
          // Arrange
          const content = new ReadableContent('Here is some code: `const url = "https://example.com";` and a link https://test.com');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Here is some code: `const url = "https://example.com";` and a link <https://test.com>\n');
        });

        it('should not transform URLs within code block', () => {
          // Arrange
          const content = new ReadableContent('Here is some code block:\n```\nconst url = "https://example.com";\n```\n and a link https://test.com');
          adapter.setOptions({ linkFormat: LinkFormat.Auto });

          // Act
          const result = adapter.paragraph(content);

          // Assert
          expect(result.toString()).toEqual('Here is some code block:\n```\nconst url = "https://example.com";\n```\n and a link <https://test.com>\n');
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
    it('should format text as bold with ** markers', () => {
      // Arrange
      const content = new ReadableContent('Bold Text');

      // Act
      const result = adapter.bold(content);

      // Assert
      expect(result.toString()).toEqual('**Bold Text**');
    });

    it('should escape asterisks inside bold', () => {
      const content = new ReadableContent('test ** test');
      const result = adapter.bold(content);
      expect(result.toString()).toEqual('**test \\*\\* test**');
    });

    it('should handle empty string input', () => {
      // Arrange
      const content = ReadableContent.empty();

      // Act
      const result = adapter.bold(content);

      // Assert
      expect(result.toString()).toEqual('****');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const content = new ReadableContent('Text with "quotes" & symbols!');

      // Act
      const result = adapter.bold(content);

      // Assert
      expect(result.toString()).toEqual('**Text with "quotes" & symbols!**');
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
    it('should format text as italic with * markers', () => {
      // Arrange
      const content = new ReadableContent('Italic Text');

      // Act
      const result = adapter.italic(content);

      // Assert
      expect(result.toString()).toEqual('*Italic Text*');
    });

    it('should escape asterisks inside italic', () => {
      const content = new ReadableContent('test * test');
      const result = adapter.italic(content);
      expect(result.toString()).toEqual('*test \\* test*');
    });

    it('should handle empty string input', () => {
      // Arrange
      const content = ReadableContent.empty();

      // Act
      const result = adapter.italic(content);

      // Assert
      expect(result.toString()).toEqual('**');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const content = new ReadableContent('Text with "quotes" & symbols!');

      // Act
      const result = adapter.italic(content);

      // Assert
      expect(result.toString()).toEqual('*Text with "quotes" & symbols!*');
    });
  });

  describe('code', () => {
    it('should format text as code block without language', () => {
      // Arrange
      const content = new ReadableContent('console.log("Hello World");');

      // Act
      const result = adapter.code(content);

      // Assert
      expect(result.toString()).toEqual('```\nconsole.log("Hello World");\n```\n');
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
      expect(result.toString()).toEqual('```\n\n```\n');
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
      const content = new ReadableContent(`
const example = \`inline\`;
// code fence inside:
\`\`\`
some inner code
\`\`\`
end
`);

      // Act
      const result = adapter.code(content);

      // Assert: fence should be at least 4 backticks so inner ``` does not close it
      expect(result.toString()).toEqual(`\`\`\`\`

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
    it('should format text as inline code with backticks', () => {
      // Arrange
      const content = new ReadableContent('console.log()');

      // Act
      const result = adapter.inlineCode(content);

      // Assert
      expect(result.toString()).toEqual('`console.log()`');
    });

    it('should handle empty string input', () => {
      // Arrange
      const content = ReadableContent.empty();

      // Act
      const result = adapter.inlineCode(content);

      // Assert
      expect(result.toString()).toEqual('``');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const content = new ReadableContent('getValue("key")');

      // Act
      const result = adapter.inlineCode(content);

      // Assert
      expect(result.toString()).toEqual('`getValue("key")`');
    });

    it('should escape backticks in inlineCode', () => {
      const content = new ReadableContent('a ` b');
      const result = adapter.inlineCode(content);
      expect(result.toString()).toEqual('`a \\` b`');
    });

    it('should escape bold/italic markers in inlineCode', () => {
      const content = new ReadableContent('a ** b * c');
      const result = adapter.inlineCode(content);
      expect(result.toString()).toEqual('`a \\*\\* b \\* c`');
    });
  });

  describe('link', () => {
    it('should format text as markdown link', () => {
      // Arrange
      const text = new ReadableContent('GitHub');
      const url = new ReadableContent('https://github.com');


      // Act
      const result = adapter.link(text, url);

      // Assert
      expect(result.toString()).toEqual('[GitHub](https://github.com)');
    });

    it('should handle empty text', () => {
      // Arrange
      const text = ReadableContent.empty();
      const url = new ReadableContent('https://example.com');

      // Act
      const result = adapter.link(text, url);

      // Assert
      expect(result.toString()).toEqual('[](https://example.com)');
    });

    it('should handle text with special characters', () => {
      // Arrange
      const text = new ReadableContent('Link with "quotes" & symbols!');
      const url = new ReadableContent('https://example.com/path?query=value');

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
      const altText = new ReadableContent('Alternative Text');
      const url = new ReadableContent('https://example.com/image.png');

      // Act
      const result = adapter.image(url, altText);

      // Assert
      expect(result.toString()).toEqual(
        '![Alternative Text](https://example.com/image.png)'
      );
    });

    it('should format as HTML img tag with width option', () => {
      // Arrange
      const altText = new ReadableContent('Alternative Text');
      const url = new ReadableContent('https://example.com/image.png');
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
      const altText = new ReadableContent('Alternative Text');
      const url = new ReadableContent('https://example.com/image.png');
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
      const altText = new ReadableContent('Alternative Text');
      const url = new ReadableContent('https://example.com/image.png');
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
