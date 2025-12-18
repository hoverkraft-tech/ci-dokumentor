import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        projects: [
            // top-level packages (exclude parent folders that only group sub-packages)
            'packages/!(cicd|repository)',
            // nested packages
            'packages/cicd/*',
            'packages/repository/*',
        ],
        // project configs cannot define coverage; keep provider at the root
        coverage: {
            provider: 'v8',
        },
        reporters: ['default'],
    },
});
