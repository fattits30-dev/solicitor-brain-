# Debugging Solicitor Brain with VS Code

This guide explains how to debug the Solicitor Brain application using Visual Studio Code.

## Quick Start

1. **Open VS Code with debugging ready:**
   ```bash
   ./scripts/vscode-debug.sh
   ```

2. **Start debugging:**
   - Press `Ctrl+Shift+D` to open Debug view
   - Select a configuration from the dropdown
   - Press `F5` to start debugging

## Available Debug Configurations

### Backend: FastAPI Debug
- Launches the FastAPI backend with hot-reload
- Full Python debugging support with breakpoints
- Environment variables automatically configured

### Frontend: Next.js Debug
- Launches the Next.js frontend in development mode
- Node.js debugging with Chrome DevTools integration
- Auto-opens browser when ready

### Full Stack Debug
- Launches both backend and frontend simultaneously
- Ideal for debugging cross-stack issues
- Automatically kills existing services before starting

### Python: Debug Current File
- Debug any Python file directly
- Useful for testing individual modules or scripts

## Debugging Commands

### Using the debugger.sh script:
```bash
# Interactive menu
./scripts/debugger.sh

# Quick commands
./scripts/debugger.sh launch    # Full launch with DB reset
./scripts/debugger.sh quick     # Quick launch without DB reset
./scripts/debugger.sh status    # Check service status
./scripts/debugger.sh logs all  # View all logs
```

### Using the VS Code debug helper:
```bash
# Open VS Code for specific debugging
./scripts/vscode-debug.sh backend    # Backend debugging
./scripts/vscode-debug.sh frontend   # Frontend debugging
./scripts/vscode-debug.sh fullstack  # Full stack debugging

# Install recommended extensions
./scripts/vscode-debug.sh install

# Set up debug environment
./scripts/vscode-debug.sh setup
```

## Debugging Shortcuts

- `F5` - Start/Continue debugging
- `F9` - Toggle breakpoint
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out
- `Shift+F5` - Stop debugging
- `Ctrl+Shift+D` - Open Debug view

## Setting Breakpoints

### Python (Backend)
1. Click in the gutter next to the line number
2. Or press `F9` on the line you want to break at
3. Conditional breakpoints: Right-click on breakpoint → "Edit Breakpoint"

### TypeScript (Frontend)
1. Same as Python - click gutter or press `F9`
2. Browser DevTools breakpoints also work
3. Use `debugger;` statement in code for hard breakpoints

## Advanced Debugging

### Remote Python Debugging
Add to your Python code:
```python
import debugpy
debugpy.listen(5678)
debugpy.wait_for_client()  # Blocks until debugger connects
```

Then use "Python: Attach Remote" configuration in VS Code.

### Environment Variables
All debug configurations include:
- `DEBUG=true`
- `LOG_LEVEL=DEBUG`
- `PYTHONPATH` set to project root
- `NODE_ENV=development` for frontend

### Viewing Logs
- Backend logs: `tail -f logs/backend.log`
- Frontend logs: `tail -f logs/frontend.log`
- All logs: `./scripts/debugger.sh logs all`

## Troubleshooting

### Port already in use
```bash
# Kill all services
./scripts/debugger.sh kill
```

### Virtual environment not found
```bash
# Set up environment
./scripts/setup_environment.sh
```

### VS Code can't find Python interpreter
1. Open Command Palette (`Ctrl+Shift+P`)
2. Select "Python: Select Interpreter"
3. Choose `./venv/bin/python`

### Breakpoints not working
- Ensure `justMyCode: false` in launch.json
- Check that source maps are enabled for frontend
- Verify the code is actually being executed

## VS Code Extensions

Recommended extensions (install with `./scripts/vscode-debug.sh install`):
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- GitLens (eamodio.gitlens)
- Error Lens (usernamehw.errorlens)

## Tips

1. **Use compound debugging** for full-stack issues
2. **Set log points** instead of console.log for non-breaking debugging
3. **Use conditional breakpoints** for specific scenarios
4. **Watch expressions** to monitor variable changes
5. **Debug console** for evaluating expressions during debugging

## Common Issues and Solutions

### Issue: "Cannot find module" errors
**Solution:** Ensure PYTHONPATH is set correctly in launch.json

### Issue: Frontend hot-reload not working
**Solution:** Check that Next.js fast refresh is enabled

### Issue: Debugger disconnects immediately
**Solution:** Check logs for startup errors, ensure all dependencies are installed

### Issue: Breakpoints are "unverified"
**Solution:** Ensure source maps are generated and paths are correctly mapped