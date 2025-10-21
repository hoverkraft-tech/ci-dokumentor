import { parse } from './node_modules/.pnpm/yaml@2.8.1/node_modules/yaml/dist/index.js';
import { readFileSync } from 'fs';

const yamlContent = readFileSync('/tmp/action-test.yml', 'utf-8');
console.log('Raw YAML content:');
console.log(yamlContent);
console.log('\n---\n');

const parsed = parse(yamlContent);
console.log('Parsed:', JSON.stringify(parsed, null, 2));
console.log('\n---\n');
console.log('github-token default:', parsed.inputs['github-token'].default);
console.log('Type:', typeof parsed.inputs['github-token'].default);
if (parsed.inputs['github-token'].default) {
  console.log('Length:', parsed.inputs['github-token'].default.length);
  console.log('Char codes:', Array.from(parsed.inputs['github-token'].default).map(c => c.charCodeAt(0)));
}
