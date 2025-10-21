import { parse } from './node_modules/.pnpm/yaml@2.8.1/node_modules/yaml/dist/index.js';

// Test various YAML formats that might be problematic
const testCases = [
  { name: 'Unquoted', yaml: 'default: ${{ github.token }}' },
  { name: 'Single quoted', yaml: "default: '${{ github.token }}'" },
  { name: 'Double quoted', yaml: 'default: "${{ github.token }}"' },
  { name: 'With object', yaml: 'default: { value: github.token }' },
  { name: 'Anchor', yaml: 'default: *anchor' },
];

for (const testCase of testCases) {
  try {
    const parsed = parse(testCase.yaml);
    console.log(`${testCase.name}:`);
    console.log('  Value:', parsed.default);
    console.log('  Type:', typeof parsed.default);
    console.log('  JSON:', JSON.stringify(parsed.default));
    console.log('');
  } catch (error) {
    console.log(`${testCase.name}: ERROR - ${error.message}`);
    console.log('');
  }
}
