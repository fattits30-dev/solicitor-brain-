#!/bin/bash
# Quick start script - fastest way to start development
# Skips all checks and dependency installation

cd "$(dirname "$0")"

echo "⚡ Quick Start - Solicitor Brain"
echo "================================"
echo ""

# Simply run start.sh with skip flags
exec ./start.sh --skip-checks --skip-deps "$@"