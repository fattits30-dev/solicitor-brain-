---
description: Ask Copilot Chat to critique the staged diff
allowed-tools: VSCode(copilot-review)
---
# Context
- Diff: !`git diff --cached`

# Task
Open Copilot Chat and send:
“Review this diff for bugs, security issues, style violations, and missing tests.
Reply as a checklist.”  If Copilot lists issues, patch in ≤ 50 LOC chunks and
re‑run until Copilot says “No issues”.
