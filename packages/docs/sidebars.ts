import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Create a structured sidebar for CI Dokumentor documentation
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Integrations',
      items: [
        'integrations/docker',
        'integrations/github-action',
        'integrations/nodejs-package',
        'integrations/migration',
      ],
    },
    {
      type: 'category',
      label: 'Developers',
      items: [
        'developers/contributing',
        'developers/architecture',
        'developers/setup',
        'developers/testing',
        'developers/ci-cd',
      ],
    },
    {
      type: 'category',
      label: 'Packages',
      items: [
        'packages/index',
        {
          type: 'category',
          label: 'Core',
          items: [
            'packages/core/index',
          ],
        },
        {
          type: 'category',
          label: 'CLI',
          items: [
            'packages/cli/index',
          ],
        },
        {
          type: 'category',
          label: 'CI/CD',
          items: [
            'packages/cicd/github-actions/index',
          ],
        },
        {
          type: 'category',
          label: 'Repository',
          items: [
            'packages/repository/git/index',
            'packages/repository/github/index',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
