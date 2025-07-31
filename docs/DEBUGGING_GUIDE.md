# Debugging Guide - Solicitor Brain

This guide explains how to use the integrated debugging system with automatic issue detection and fixing.

## Quick Start

### 1. Launch Debug Helper
```bash
./scripts/debug-helper.sh
```

This provides an interactive menu for:
- Setting up debug environment
- Checking for issues before debugging
- Fixing issues automatically
- Monitoring debug sessions

### 2. VS Code Debugging

Press **F5** in VS Code to start debugging with one of these configurations:

- **Backend: FastAPI** - Debug the backend server
- **Frontend: Next.js** - Debug the frontend
- **Full Stack** - Debug both simultaneously
- **Debug Current File** - Debug the open Python file
- **Run Tests** - Debug pytest for current file

## Integrated Issue Management

### Pre-Launch Checks

Before debugging starts, the system automatically:
1. Checks for Python syntax errors
2. Validates TypeScript compilation
3. Ensures dependencies are installed
4. Fixes common issues automatically

### Post-Debug Summary

After debugging, a summary shows:
- Any new issues introduced
- Performance metrics
- Error counts
- Suggestions for fixes

## Debug Configurations

### Backend Debugging

```json
{
  "name": "Backend: FastAPI",
  "type": "python",
  "preLaunchTask": "Check Python Issues",
  "postDebugTask": "Show Issue Summary"
}
```

Features:
- Auto-checks for Python issues before launch
- Shows issue summary after debugging
- Breakpoint support in all Python files
- Variable inspection and watch expressions

### Frontend Debugging

```json
{
  "name": "Frontend: Next.js",
  "type": "node", 
  "preLaunchTask": "Check TypeScript Issues"
}
```

Features:
- TypeScript compilation check
- Source map support
- React component debugging
- Browser DevTools integration

### Full Stack Debugging

Debug both frontend and backend simultaneously:
- Launch both servers
- Set breakpoints in both codebases
- Track API calls end-to-end
- Monitor WebSocket connections

## Debugging Workflow

### 1. Before Debugging

```bash
# Check for issues
./scripts/check-all.sh

# Fix issues automatically
./scripts/fix-issues.sh

# Or use the debug helper
./scripts/debug-helper.sh
# Select option 3: Fix All Issues & Start Debug
```

### 2. Setting Breakpoints

- Click left of line numbers in VS Code
- Use `debugger;` statement in JavaScript
- Use `breakpoint()` in Python
- Conditional breakpoints: Right-click → "Add Conditional Breakpoint"

### 3. During Debugging

**Controls:**
- **F5** - Continue
- **F10** - Step Over
- **F11** - Step Into
- **Shift+F11** - Step Out
- **Ctrl+Shift+F5** - Restart
- **Shift+F5** - Stop

**Debug Console:**
- Execute Python/JavaScript expressions
- Inspect variables
- Call functions
- Modify state

### 4. Common Debug Scenarios

#### API Endpoint Not Working
1. Set breakpoint in endpoint function
2. Check request data in Variables panel
3. Step through database queries
4. Verify response structure

#### Frontend State Issues
1. Use React Developer Tools
2. Set breakpoints in component methods
3. Watch state changes
4. Check WebSocket messages

#### Database Issues
1. Enable SQL logging:
   ```python
   # In backend/config.py
   SQLALCHEMY_ECHO = True
   ```
2. Set breakpoints in model methods
3. Inspect query results

## Debugging Tips

### Python Debugging

1. **Import Issues**
   ```python
   # Add to debug console
   import sys
   print(sys.path)
   ```

2. **Async Debugging**
   ```python
   # Use breakpoint() in async functions
   async def my_function():
       breakpoint()  # Works with async
   ```

3. **Database Queries**
   ```python
   # Print SQL queries
   print(str(query.statement.compile(compile_kwargs={"literal_binds": True})))
   ```

### TypeScript Debugging

1. **Console Logging**
   ```typescript
   console.log('State:', { ...state });
   console.table(data);
   ```

2. **Debugger Statement**
   ```typescript
   debugger; // Pause execution here
   ```

3. **Network Inspection**
   ```typescript
   // Log all API calls
   axios.interceptors.request.use(config => {
     console.log('API Call:', config);
     return config;
   });
   ```

## Troubleshooting

### Debugger Not Stopping at Breakpoints

1. **Python:**
   - Ensure `"justMyCode": false` in launch.json
   - Check Python interpreter path
   - Verify source maps

2. **TypeScript:**
   - Enable source maps in tsconfig.json
   - Clear Next.js cache: `rm -rf .next`
   - Check webpack configuration

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database
./solicitor-brain.sh clean
./solicitor-brain.sh setup
```

## Advanced Debugging

### Remote Debugging

1. **Configure debugpy:**
   ```python
   import debugpy
   debugpy.listen(5678)
   debugpy.wait_for_client()
   ```

2. **Attach to process:**
   ```json
   {
     "name": "Attach to Remote",
     "type": "python",
     "request": "attach",
     "connect": {
       "host": "localhost",
       "port": 5678
     }
   }
   ```

### Performance Profiling

1. **Python Profiling:**
   ```bash
   python -m cProfile -o profile.stats backend/main.py
   ```

2. **Frontend Profiling:**
   - Use Chrome DevTools Performance tab
   - React DevTools Profiler

### Memory Debugging

1. **Python Memory:**
   ```python
   import tracemalloc
   tracemalloc.start()
   # ... code ...
   snapshot = tracemalloc.take_snapshot()
   ```

2. **Frontend Memory:**
   - Chrome DevTools Memory tab
   - Heap snapshots

## Integration with CI/CD

The debug configurations work with:
- GitHub Actions workflows
- Pre-commit hooks
- Docker containers
- Remote development

## Best Practices

1. **Always check for issues before debugging**
2. **Use meaningful breakpoint conditions**
3. **Clean up console.log statements**
4. **Document complex debug scenarios**
5. **Share debug configurations with team**

## Quick Commands

```bash
# Debug helper menu
./scripts/debug-helper.sh

# Quick fix and debug
./scripts/debug-helper.sh fix-and-debug

# Monitor debug session
./scripts/debug-helper.sh monitor

# Show debug tips
./scripts/debug-helper.sh tips
```