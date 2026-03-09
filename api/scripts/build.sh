#!/bin/bash

# Build script for Lambda deployment package

set -e

echo "🏗️  Building Lambda deployment package..."

# Define directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build"
PACKAGE_DIR="$BUILD_DIR/package"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"
mkdir -p "$PACKAGE_DIR"

# Copy source code
echo "📦 Copying source code..."
cp -r "$PROJECT_ROOT/src/"* "$PACKAGE_DIR/"

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r "$PROJECT_ROOT/requirements.txt" -t "$PACKAGE_DIR" --upgrade

# Remove unnecessary files
echo "🗑️  Removing unnecessary files..."
find "$PACKAGE_DIR" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find "$PACKAGE_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$PACKAGE_DIR" -name "*.pyc" -delete
find "$PACKAGE_DIR" -name "*.pyo" -delete
find "$PACKAGE_DIR" -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true

# Create ZIP file
echo "📦 Creating deployment package..."
cd "$PACKAGE_DIR"
zip -r "$PROJECT_ROOT/deployment.zip" . -q

# Show package size
PACKAGE_SIZE=$(du -h "$PROJECT_ROOT/deployment.zip" | cut -f1)
echo "✅ Deployment package created: deployment.zip ($PACKAGE_SIZE)"

# Cleanup
echo "🧹 Cleaning up build directory..."
rm -rf "$BUILD_DIR"

echo "🎉 Build complete!"
