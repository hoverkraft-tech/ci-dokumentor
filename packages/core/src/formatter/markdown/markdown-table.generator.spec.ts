import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownTableGenerator } from './markdown-table.generator.js';
import { ReadableContent } from '../../reader/reader.adapter.js';

describe('MarkdownTableGenerator', () => {
  let markdownTableGenerator: MarkdownTableGenerator;

  beforeEach(() => {
    markdownTableGenerator = new MarkdownTableGenerator();
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
      const headers = [Buffer.from('Column 1'), Buffer.from('Column 2')];
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
      const headers = [Buffer.from('Name'), Buffer.from('Description')];
      const rows = [
        [Buffer.from('Item "A"'), Buffer.from('Description with & symbols!')],
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
      const headers = [Buffer.from('Example')];
      const rows = [[Buffer.from('`code`')]];

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
      const headers = [Buffer.from('Example')];
      const rows = [[Buffer.from('This is inline `code` span')]];

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

    it('should treat inline backtick spans with newlines as single blocks in table cells', () => {
      // Arrange
      const headers = [Buffer.from('Example')];
      // inline backtick span using single backticks but containing a newline
      const rows = [[Buffer.from('This is inline `a\nb` span')]];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: the inline backtick span should be preserved and rendered as a
      // single block (we expect a <pre> fragment containing the inner content
      // where inner newlines are encoded as &#13;). We assert substring to keep
      // the test robust to column width/padding differences.
      const out = result.toString();
      expect(out).toEqual(`| Example                              |
| ------------------------------------ |
| This is inline<pre>a&#13;b</pre>span |
`);
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
      const headers = [Buffer.from('Code'), Buffer.from('Output')];
      const rows = [
        [Buffer.from('if (a | b)'), Buffer.from('result: true | false')],
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
        Buffer.from('Multi\nLine\nHeader'),
        Buffer.from('Description'),
      ];
      const rows = [[Buffer.from('Value'), Buffer.from('Single line content')]];

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
      const headers = [Buffer.from('Language'), Buffer.from('Example Code')];
      const rows = [
        [
          Buffer.from('JavaScript'),
          Buffer.from('Example:\n```js\nfunction hello() {\n  return "Hello World";\n}\n```'),
        ],
        [
          Buffer.from('Python'),
          Buffer.from('Example:\n```python\ndef hello():\n    return "Hello World"\n```'),
        ],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: Markdown table with <pre lang="..."> for code cells and &#13; for inner newlines
      expect(result.toString()).toEqual(
        `| Language   | Example Code                                                             |
| ---------- | ------------------------------------------------------------------------ |
| JavaScript | Example:                                                                 |
|            | <pre lang="js">function hello() {&#13; return "Hello World";&#13;}</pre> |
| Python     | Example:                                                                 |
|            | <pre lang="python">def hello():&#13; return "Hello World"</pre>          |
`
      );
    });

    it('should handle mixed code blocks and regular multiline content', () => {
      // Arrange
      const headers = [Buffer.from('Type'), Buffer.from('Content')];
      const rows = [
        [
          Buffer.from('Code'),
          Buffer.from('```js\nconst x = 1;\nconsole.log(x);\n```'),
        ],
        [
          Buffer.from('Text'),
          Buffer.from('Line 1\nLine 2\nLine 3'),
        ],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: Markdown table; code cell rendered in <pre lang="..."> with &#13;, text cell uses <br>
      expect(result.toString()).toEqual(
        `| Type | Content                                               |
| ---- | ----------------------------------------------------- |
| Code | <pre lang="js">const x = 1;&#13;console.log(x);</pre> |
| Text | Line 1                                                |
|      | Line 2                                                |
|      | Line 3                                                |
`
      );
    });

    it('should preserve ~~~ fenced code blocks as single lines in table cells', () => {
      // Arrange
      const headers = [Buffer.from('Lang'), Buffer.from('Example')];
      const rows = [
        [
          Buffer.from('Custom'),
          Buffer.from('~~~text\nline a\nline b\n~~~'),
        ],
      ];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: Markdown table with <pre lang="text"> and &#13; for inner newlines
      expect(result.toString()).toEqual(
        `| Lang   | Example                                  |
| ------ | ---------------------------------------- |
| Custom | <pre lang="text">line a&#13;line b</pre> |
`
      );
    });

    it('renders fenced code in a single cell and plain text in another cell', () => {
      // Arrange
      const headers = [Buffer.from('H1'), Buffer.from('H2'), Buffer.from('H3')];

      // first row: first cell has a fenced block with a newline inside; second is plain
      const fenced = Buffer.from('pre:\n```js\nconsole.log(1)\n```');
      const plain = Buffer.from('normal text');
      const inline = Buffer.from('`inline code`');

      const rows = [[fenced, plain, inline]];

      // Act
      const result = markdownTableGenerator.table(headers, rows);

      // Assert: the fenced block should be preserved and rendered as a single
      // block (we expect a <pre> fragment containing the inner content where
      // inner newlines are encoded as &#13;). We assert substring to keep the
      // test robust to column width/padding differences.
      const out = result.toString();
      expect(out).toEqual(`| H1                                  | H2          | H3            |
| ----------------------------------- | ----------- | ------------- |
| pre:                                | normal text | \`inline code\` |
| <pre lang="js">console.log(1)</pre> |             |               |
`);
    });
  });
});
