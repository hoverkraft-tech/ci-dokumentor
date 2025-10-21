import { MarkdownFormatterAdapter } from './packages/core/dist/index.js';
import { MarkdownTableGenerator } from './packages/core/dist/index.js';
import { MarkdownLinkGenerator } from './packages/core/dist/index.js';
import { MarkdownCodeGenerator } from './packages/core/dist/index.js';
import { ReadableContent } from './packages/core/dist/index.js';

const tableGen = new MarkdownTableGenerator();
const linkGen = new MarkdownLinkGenerator();
const codeGen = new MarkdownCodeGenerator();
const formatter = new MarkdownFormatterAdapter(tableGen, linkGen, codeGen);

const testValue = '${{ github.token }}';
console.log('Input value:', testValue);

// Test inline code
const inlineCode = formatter.inlineCode(new ReadableContent(testValue));
console.log('Inline code:', inlineCode.toString());

// Test in table
const headers = [
  formatter.bold(new ReadableContent('Input')),
  formatter.bold(new ReadableContent('Default')),
];

const rows = [[
  formatter.bold(formatter.inlineCode(new ReadableContent('github-token'))),
  formatter.inlineCode(new ReadableContent(testValue)),
]];

const table = formatter.table(headers, rows);
console.log('\nTable output:');
console.log(table.toString());
