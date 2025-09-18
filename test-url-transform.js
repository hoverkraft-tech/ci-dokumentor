const { MarkdownFormatterAdapter, LinkFormat } = require('./packages/core/dist/index.js');

const adapter = new MarkdownFormatterAdapter();

// Test auto format
adapter.setOptions({ linkFormat: LinkFormat.Auto });
const testText1 = Buffer.from('Visit https://example.com for more info');
const result1 = adapter.paragraph(testText1);
console.log('Auto format:', result1.toString().trim());

// Test full format
adapter.setOptions({ linkFormat: LinkFormat.Full });
const result2 = adapter.paragraph(testText1);
console.log('Full format:', result2.toString().trim());

// Test with punctuation
const testText2 = Buffer.from('Check https://github.com, then continue.');
const result3 = adapter.paragraph(testText2);
console.log('With punctuation:', result3.toString().trim());

// Test with existing links
const testText3 = Buffer.from('See [GitHub](https://github.com) and https://stackoverflow.com');
const result4 = adapter.paragraph(testText3);
console.log('With existing links:', result4.toString().trim());

console.log('All tests completed successfully!');
