#!/bin/bash
"""
Build script for creating JA Certificate Generator executable.
"""

echo "🏗️  Building JA Certificate Generator Executable"
echo "================================================"

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Virtual environment detected: $VIRTUAL_ENV"
else
    echo "⚠️  Warning: Not in a virtual environment"
    echo "   It's recommended to build in a virtual environment"
fi

# Check if PyInstaller is installed
if ! command -v pyinstaller &> /dev/null; then
    echo "❌ PyInstaller not found. Installing..."
    pip install pyinstaller
fi

echo ""
echo "📦 Building executable with PyInstaller..."

# Clean previous builds
if [ -d "build" ]; then
    echo "🧹 Cleaning previous build directory..."
    rm -rf build
fi

if [ -d "dist" ]; then
    echo "🧹 Cleaning previous dist directory..."
    rm -rf dist
fi

# Run PyInstaller
echo "🔨 Running PyInstaller..."
pyinstaller ja-cert-gen.spec

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📍 Executable location: dist/ja-cert-gen"
    echo "📏 Executable size:"
    ls -lh dist/ja-cert-gen | awk '{print "   " $5 " (" $9 ")"}'
    
    echo ""
    echo "🧪 Testing executable..."
    if ./dist/ja-cert-gen --help > /dev/null 2>&1; then
        echo "✅ Executable test passed!"
    else
        echo "❌ Executable test failed!"
        exit 1
    fi
    
    echo ""
    echo "📦 To distribute the executable:"
    echo "   1. Copy the 'dist/ja-cert-gen' file to target system"
    echo "   2. Make sure it's executable: chmod +x ja-cert-gen"
    echo "   3. Run: ./ja-cert-gen --help"
    
    echo ""
    echo "💡 Tips:"
    echo "   - The executable includes all dependencies"
    echo "   - No Python installation needed on target system"
    echo "   - Include data/ folder with the executable for templates"
    echo "   - For printing: target system needs CUPS or lpr commands"
    
else
    echo "❌ Build failed!"
    exit 1
fi