#!/bin/bash

# Build universal binary for macOS (arm64 + x86_64)
cd "$(dirname "$0")"

echo "Building caret-tracker for macOS..."

# Compile for arm64
swiftc -O -target arm64-apple-macos11 -o caret-tracker-arm64 caret-tracker.swift

# Compile for x86_64
swiftc -O -target x86_64-apple-macos11 -o caret-tracker-x86_64 caret-tracker.swift

# Create universal binary
lipo -create -output caret-tracker caret-tracker-arm64 caret-tracker-x86_64

# Clean up intermediate files
rm caret-tracker-arm64 caret-tracker-x86_64

# Make executable
chmod +x caret-tracker

echo "Built: src/native/caret-tracker (universal binary)"
