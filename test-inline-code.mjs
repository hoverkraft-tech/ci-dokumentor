import { ReadableContent } from './packages/core/dist/index.js';

const testValue = '${{ github.token }}';
console.log('Input:', testValue);

const content = new ReadableContent(testValue);
console.log('ReadableContent:', content.toString());

// Test escape
const escaped1 = content.escape('`');
console.log('Escaped (backtick):', escaped1.toString());

const escaped2 = content.escape(['`', '*']);
console.log('Escaped (backtick + asterisk):', escaped2.toString());

// Test with curly braces
const escaped3 = content.escape('{');
console.log('Escaped (curly):', escaped3.toString());
