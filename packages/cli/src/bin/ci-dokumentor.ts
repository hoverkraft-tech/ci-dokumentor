#!/usr/bin/env node

import 'reflect-metadata';
import { cli } from '../lib/cli.js';

// Run the CLI application
cli().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
});
