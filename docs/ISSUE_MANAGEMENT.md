# Issue Management System

The Solicitor Brain project includes a comprehensive issue management system to help maintain code quality and fix common problems automatically.

## Quick Start

### 1. Interactive Issue Manager
```bash
./solicitor-brain.sh issues
# or directly:
./scripts/issue-manager.sh
```

This launches an interactive menu with options to:
- Check all issues
- Fix issues automatically
- View issue summary
- Run specific fixes

### 2. VS Code Integration

The project includes VS Code tasks for easy issue management:

- **Ctrl+Shift+B** - Run default build task (Fix All Issues)
- **Ctrl+Shift+P** → "Tasks: Run Task" - Show all available tasks

Available tasks:
- Fix All Issues
- Fix Python Types
- Fix TypeScript Issues  
- Check All
- Auto Fix on Save

### 3. Command Line Tools

#### Check all issues:
```bash
./scripts/check-all.sh
```

#### Fix all issues automatically:
```bash
./scripts/fix-issues.sh
```

#### Fix Python type issues:
```bash
./scripts/fix-python-types.py
```

## VS Code Settings

The project includes pre-configured VS Code settings:

- **Auto-formatting on save** for Python (Black) and TypeScript (Prettier)
- **ESLint fixes on save**
- **MyPy type checking** enabled
- **Proper Python virtual environment** detection

## Issue Types

### Python Issues
- **Type annotations** - Missing or incorrect type hints
- **Linting** - Code style issues (Ruff)
- **Formatting** - Code formatting (Black)

### TypeScript Issues
- **ESLint errors** - Code quality issues
- **Type errors** - TypeScript compilation errors
- **Formatting** - Code formatting (Prettier)

## Manual Fixes

For issues that can't be automatically fixed:

1. Check the VS Code Problems panel
2. Run mypy for detailed Python type errors:
   ```bash
   cd /media/mine/AI-DEV/solicitor-brain
   source venv/bin/activate
   python -m mypy backend/
   ```

3. Check TypeScript build:
   ```bash
   cd frontend
   npm run build
   ```

## Configuration Files

- `.vscode/settings.json` - Editor settings
- `.vscode/tasks.json` - Task definitions
- `scripts/fix-issues.sh` - Main fix script
- `scripts/fix-python-types.py` - Python type fixer
- `scripts/check-all.sh` - Comprehensive checker
- `scripts/issue-manager.sh` - Interactive UI

## Tips

1. **Run checks before committing** to ensure code quality
2. **Use the interactive manager** for a friendly UI
3. **Enable format on save** in VS Code for automatic fixes
4. **Check the Problems panel** regularly in VS Code

## Troubleshooting

If automatic fixes don't work:

1. Ensure virtual environment is activated
2. Check that all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install
   ```
3. Some type issues may require manual intervention
4. Check the specific error messages for guidance