import { describe, it, expect, beforeEach } from 'vitest';
import { ReadableContent } from '../../reader/readable-content.js';
import { MarkdownTableGenerator } from './markdown-table.generator.js';
import { MarkdownCodeGenerator } from './markdown-code.generator.js';

describe('MarkdownTableGenerator', () => {
  let markdownTableGenerator: MarkdownTableGenerator;

  beforeEach(() => {
    markdownTableGenerator = new MarkdownTableGenerator(new MarkdownCodeGenerator());
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
      const result = markdownTableGenerator.table(headers, rows);

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
      const headers: ReadableContent[] = [];
      const rows: ReadableContent[][] = [];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert
      expect(result.toString()).toEqual('');
    });

    it('should handle table with only headers', () => {
      // Arrange
      const headers = [new ReadableContent('Column 1'), new ReadableContent('Column 2')];
      const rows: ReadableContent[][] = [];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert
      expect(result.toString()).toEqual(
        `| Column 1 | Column 2 |
| -------- | -------- |
`
      );
    });

    it('should handle table with special characters', () => {
      // Arrange
      const headers = [new ReadableContent('Name'), new ReadableContent('Description')];
      const rows = [
        [new ReadableContent('Item "A"'), new ReadableContent('Description with & symbols!')],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert
      expect(result.toString()).toEqual(
        `| Name     | Description                 |
| -------- | --------------------------- |
| Item "A" | Description with & symbols! |
`
      );
    });


    it('should treat inline code as single block in table cells', () => {
      // Arrange
      const headers = [new ReadableContent('Example')];
      const rows = [[new ReadableContent('`code`')]];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: the inline backtick span should be preserved and rendered as a
      // single block (we expect a <pre> fragment containing the inner content).
      expect(result.toString()).toEqual(
        `| Example |
| ------- |
| \`code\`  |
`
      );
    });

    it('should treat inline backtick spans as single blocks in table cells', () => {
      // Arrange
      const headers = [new ReadableContent('Example')];
      const rows = [[new ReadableContent('This is inline `code` span')]];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: the inline backtick span should be preserved and rendered as a
      // single block (we expect a <pre> fragment containing the inner content).
      expect(result.toString()).toEqual(
        `| Example                    |
| -------------------------- |
| This is inline \`code\` span |
`
      );
    });

    it('should handle multiline content in table cells', () => {
      // Arrange
      const headers = [new ReadableContent('Name'), new ReadableContent('Description')];
      const rows = [
        [
          new ReadableContent('John\nDoe'),
          new ReadableContent('A person with\nmultiple lines\nof description'),
        ],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

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
      const headers = [new ReadableContent('Code'), new ReadableContent('Output')];
      const rows = [
        [new ReadableContent('if (a | b)'), new ReadableContent('result: true | false')],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

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
        new ReadableContent('Multi\nLine\nHeader'),
        new ReadableContent('Description'),
      ];
      const rows = [[new ReadableContent('Value'), new ReadableContent('Single line content')]];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

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
        new ReadableContent('Name'),
        new ReadableContent('Status'),
        new ReadableContent('Notes'),
      ];
      const rows = [
        [
          new ReadableContent('John'),
          new ReadableContent('Active'),
          new ReadableContent('Single line note'),
        ],
        [
          new ReadableContent('Jane\nSmith'),
          new ReadableContent('Pending\nReview'),
          new ReadableContent('This is a\nmultiline note\nwith details'),
        ],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

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

    it('should treat code blocks as single lines in table cells', () => {
      // Arrange
      const headers = [new ReadableContent('Language'), new ReadableContent('Example Code')];
      const rows = [
        [
          new ReadableContent('JavaScript'),
          new ReadableContent('Example:\n```js\nfunction hello() {\n  return "Hello World";\n}\n```'),
        ],
        [
          new ReadableContent('Python'),
          new ReadableContent('Example:\n```python\ndef hello():\n    return "Hello World"\n```'),
        ],
        [
          new ReadableContent('Yaml'),
          new ReadableContent('Example:\n```yaml\nfile-path: **/*.md\n\n```'),
        ],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: Markdown table with wrapped <pre lang="..."> for code cells and &#13; for inner newlines and escaped *
      expect(result.toString()).toEqual(`| Language   | Example Code                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| JavaScript | Example:                                                                                                                  |
|            | <!-- textlint-disable --><pre lang="js">function hello() {&#13; return "Hello World";&#13;}</pre><!-- textlint-enable --> |
| Python     | Example:                                                                                                                  |
|            | <!-- textlint-disable --><pre lang="python">def hello():&#13; return "Hello World"</pre><!-- textlint-enable -->          |
| Yaml       | Example:                                                                                                                  |
|            | <!-- textlint-disable --><pre lang="yaml">file-path: \\*\\*/\\*.md&#13;</pre><!-- textlint-enable -->                        |
`);
    });

    it('should handle mixed code blocks and regular multiline content', () => {
      // Arrange
      const headers = [new ReadableContent('Type'), new ReadableContent('Content')];
      const rows = [
        [
          new ReadableContent('Code'),
          new ReadableContent('```js\nconst x = 1;\nconsole.log(x);\n```'),
        ],
        [
          new ReadableContent('Text'),
          new ReadableContent('Line 1\nLine 2\nLine 3'),
        ],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: Markdown table; code cell rendered in wrapped <pre lang="..."> with &#13; and text lines as separate table rows
      expect(result.toString()).toEqual(`| Type | Content                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------ |
| Code | <!-- textlint-disable --><pre lang="js">const x = 1;&#13;console.log(x);</pre><!-- textlint-enable --> |
| Text | Line 1                                                                                                 |
|      | Line 2                                                                                                 |
|      | Line 3                                                                                                 |
`);
    });

    it('should preserve ~~~ fenced code blocks as single lines in table cells', () => {
      // Arrange
      const headers = [new ReadableContent('Lang'), new ReadableContent('Example')];
      const rows = [
        [
          new ReadableContent('Custom'),
          new ReadableContent('~~~text\nline a\nline b\n~~~'),
        ],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: Markdown table with wrapped <pre lang="text"> and &#13; for inner newlines
      expect(result.toString()).toEqual(`| Lang   | Example                                                                                   |
| ------ | ----------------------------------------------------------------------------------------- |
| Custom | <!-- textlint-disable --><pre lang="text">line a&#13;line b</pre><!-- textlint-enable --> |
`);
    });

    it('renders fenced code in a single cell and plain text in another cell', () => {
      // Arrange
      const headers = [new ReadableContent('H1'), new ReadableContent('H2'), new ReadableContent('H3')];

      // first row: first cell has a fenced block with a newline inside; second is plain
      const fenced = new ReadableContent('pre:\n```js\nconsole.log(1)\n```');
      const plain = new ReadableContent('normal text');
      const inline = new ReadableContent('`inline code`');

      const rows = [[fenced, plain, inline]];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: the fenced block should be preserved and rendered as a single
      // block (we expect a <pre> fragment containing the inner content where
      // inner newlines are encoded as &#13;). We assert substring to keep the
      // test robust to column width/padding differences.
      expect(result.toString()).toEqual(`| H1                                                                                   | H2          | H3            |
| ------------------------------------------------------------------------------------ | ----------- | ------------- |
| pre:                                                                                 | normal text | \`inline code\` |
| <!-- textlint-disable --><pre lang="js">console.log(1)</pre><!-- textlint-enable --> |             |               |
`);
    });
  });
});
