---
description: Loop build/tests until green, then show diff
allowed-tools: Bash(pytest:* ,ruff:* ,npm:* ,python:* )
---
# Context
- Staged diff: !`git diff --cached`

# Task
1. Run:  
   • `pytest -q tests`  
   • `ruff backend frontend`  
   • `python -m mypy backend`  
   • `npm run --prefix frontend build --silent`
2. If **any** command fails, patch only the affected files and retry (max 3 loops).
3. When all pass, present the diff.
