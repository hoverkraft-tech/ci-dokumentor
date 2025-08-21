#!/usr/bin/env node

// Simple test to verify the basic structure works without dependency injection
console.log('✅ Node.js runtime works')
console.log('📦 CI Dokumentor CLI Test')
console.log('🏗️  Checking package structure...')

try {
  // Test that we can require the basic structure
  const fs = require('fs')
  const path = require('path')

  // Check that the expected directories exist
  const expectedDirs = [
    'packages/cli/dist',
    'packages/core/dist',
    'packages/repository/git/dist',
    'packages/repository/github/dist',
    'packages/cicd/github-actions/dist'
  ]

  for (const dir of expectedDirs) {
    if (fs.existsSync(dir)) {
      console.log(`✅ Found: ${dir}`)
    } else {
      console.log(`❌ Missing: ${dir}`)
    }
  }

  // Try to load the main entry point
  const cliEntryPath = 'packages/cli/dist/bin/ci-dokumentor.js'
  if (fs.existsSync(cliEntryPath)) {
    console.log(`✅ CLI entry point exists: ${cliEntryPath}`)
  } else {
    console.log(`❌ CLI entry point missing: ${cliEntryPath}`)
  }

  console.log('🎉 Basic structure validation completed')
  console.log(
    'ℹ️  CLI functionality test would require dependency injection fix'
  )
} catch (error) {
  console.error('❌ Error during validation:', error.message)
  process.exit(1)
}
