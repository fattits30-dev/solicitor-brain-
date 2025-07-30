#!/bin/bash
# Quick launcher for Solicitor Brain
# Uses the consolidated start.sh script

cd "$(dirname "$0")"

# Simply delegate to the master start script
exec ./start.sh "$@"