#!/bin/bash
set -e

echo "🐳 Building CI Dokumentor Docker image..."

# Build the Docker image
docker build -f docker/Dockerfile -t ci-dokumentor:latest .

echo "✅ Docker image built successfully!"

# Test basic functionality
echo "🧪 Testing Docker image..."

# Test help command
echo "Testing --help command:"
docker run --rm ci-dokumentor:latest --help

# Test with volume mount (simulate real usage)
echo "Testing with volume mount:"
docker run --rm -v "$(pwd):/workspace" ci-dokumentor:latest node packages/cli/dist/bin/ci-dokumentor.js --help

echo "✅ All tests passed!"

# Show image size
echo "📊 Image information:"
docker images ci-dokumentor:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"