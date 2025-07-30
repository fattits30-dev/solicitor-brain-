# VS Code Debugging Guide for Solicitor Brain

## Overview

This guide explains how to use VS Code's powerful debugging features with the Solicitor Brain project, including variables inspection, watch expressions, and call stack analysis.

## Quick Start

1. **Open Run and Debug Panel**: Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
2. **Select Configuration**: Choose from the dropdown (e.g., "Full Stack (Backend + Frontend)")
3. **Start Debugging**: Press `F5` or click the green play button

## Key Debugging Features

### 1. Breakpoints

- **Set Breakpoint**: Click in the gutter next to line numbers or press `F9`
- **Conditional Breakpoint**: Right-click on a breakpoint → "Edit Breakpoint" → Add condition
- **Logpoint**: Right-click in gutter → "Add Logpoint" → Enter message (e.g., `"User ID: {user.id}"`)

### 2. Variables Panel

When stopped at a breakpoint, the Variables panel shows:

- **Locals**: Variables in current scope
- **Globals**: Global variables
- **Function Arguments**: Parameters passed to current function

**Tips:**
- Hover over variables in code to see their values
- Right-click → "Copy Value" to copy complex objects
- Right-click → "Add to Watch" for monitoring

### 3. Watch Expressions

Add expressions to monitor their values:

```python
# Example watch expressions:
len(documents)
user.permissions.can_edit
case.status == "active"
sum([doc.size for doc in documents])
```

**Adding Watch Expressions:**
1. Click "+" in Watch panel
2. Enter expression
3. Press Enter

### 4. Call Stack

Shows the execution path to current breakpoint:

```
▼ Current Function
  └─ calling_function()
     └─ parent_function()
        └─ main()
```

**Features:**
- Click any frame to jump to that code
- See variables at each level
- Understand execution flow

## Debug Configurations

### Backend Debugging

```json
{
  "name": "Backend: FastAPI (Debug)",
  "type": "python",
  "request": "launch",
  "module": "uvicorn",
  "args": ["backend.main:app", "--reload"],
  "justMyCode": false,  // Step into library code
  "showReturnValue": true  // Show function return values
}
```

**Key Features:**
- `justMyCode: false` - Debug into library code
- `showReturnValue: true` - See what functions return
- `stopOnEntry: true` - Pause at first line

### Frontend Debugging

```json
{
  "name": "Frontend: Chrome Attach",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}/frontend",
  "sourceMaps": true
}
```

**Browser DevTools Integration:**
- Set breakpoints in VS Code or browser
- Inspect React component state
- Network request debugging

### Test Debugging

```json
{
  "name": "Test: Debug Test at Cursor",
  "type": "python",
  "request": "launch",
  "module": "pytest",
  "args": ["${file}::${selectedText}"],
  "console": "integratedTerminal"
}
```

**Usage:**
1. Place cursor on test name
2. Select test name
3. Run "Test: Debug Test at Cursor"

## Advanced Debugging Techniques

### 1. Exception Breakpoints

**Setup:**
1. Go to Breakpoints panel
2. Check "Raised Exceptions" or "Uncaught Exceptions"
3. Debug will pause when exceptions occur

### 2. Data Breakpoints (Memory Watch)

Monitor when a variable changes:

```python
# Right-click on variable in Variables panel
# Select "Break on Value Change"
```

### 3. Debug Console

Execute code while paused:

```python
# In Debug Console:
>>> user.email
'test@example.com'
>>> len(await db.execute(query).all())
42
>>> import json; json.dumps(case.dict(), indent=2)
```

### 4. Remote Debugging

For production debugging:

```python
# Add to your code:
import debugpy
debugpy.listen(5678)
debugpy.wait_for_client()  # Pause until debugger connects
```

Then use "Remote: Attach to Process" configuration.

## Common Debugging Scenarios

### 1. API Request Debugging

```python
@router.post("/cases")
async def create_case(case: CaseCreate, db: AsyncSession = Depends(get_db)):
    # Set breakpoint here
    # Watch: case.dict(), db.is_active
    
    new_case = Case(**case.dict())
    db.add(new_case)
    await db.commit()
    
    # Watch: new_case.id, new_case.created_at
    return new_case
```

### 2. Database Query Debugging

Enable SQL logging in debug console:
```python
>>> import logging
>>> logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

### 3. Async Code Debugging

```python
async def process_documents(docs: List[Document]):
    # Breakpoint here shows all pending tasks
    tasks = [process_doc(doc) for doc in docs]
    
    # Watch: len(tasks), asyncio.all_tasks()
    results = await asyncio.gather(*tasks)
    
    return results
```

### 4. React Component Debugging

```typescript
function CaseList({ cases }: Props) {
  // Set breakpoint here
  // Watch: cases.length, cases[0]
  
  const [selected, setSelected] = useState(null);
  
  // Conditional breakpoint: selected !== null
  return <div>{/* ... */}</div>;
}
```

## Debugging Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle Breakpoint | `F9` |
| Start/Continue | `F5` |
| Step Over | `F10` |
| Step Into | `F11` |
| Step Out | `Shift+F11` |
| Restart | `Ctrl+Shift+F5` |
| Stop | `Shift+F5` |
| Debug Console | `Ctrl+Shift+Y` |

## Performance Profiling

### Python Profiling

```python
# Add to launch.json env:
"PYTHONPROFILEIMPORTTIME": "1"

# Or use cProfile:
import cProfile
cProfile.run('expensive_function()')
```

### Memory Debugging

```python
# Watch memory usage:
import psutil
process = psutil.Process()
process.memory_info().rss / 1024 / 1024  # MB
```

## Tips and Tricks

1. **Debug Specific Test**: Place cursor on test name, use "Debug Test at Cursor"
2. **Conditional Breakpoints**: Right-click breakpoint → Edit → Add condition like `user.role == "admin"`
3. **Log Without Stopping**: Use Logpoints instead of print statements
4. **Watch Return Values**: Enable `showReturnValue` in launch.json
5. **Debug Into Libraries**: Set `justMyCode: false`
6. **Hot Reload**: Backend auto-reloads with `--reload` flag
7. **Network Debugging**: Use Chrome DevTools Network tab with frontend debugging

## Troubleshooting

### Issue: Breakpoints Not Hit

- Check `justMyCode` setting
- Ensure source maps are enabled for frontend
- Verify correct Python interpreter selected

### Issue: Variables Show "Unknown"

- Step one line forward (F10)
- Check if in async context
- Ensure proper type hints

### Issue: Can't Debug Tests

- Use `--no-cov` flag to disable coverage during debugging
- Add `-s` flag to see print statements

## Context Manager Debugging

When debugging the new context managers:

```python
async with DatabaseManager() as db:
    # Breakpoint here shows db state
    async with db.session() as session:
        # Watch: session.is_active, session.dirty
        result = await session.execute(query)
        # Watch: result.rowcount
```

Monitor context manager entry/exit:
- Set breakpoints in `__enter__`/`__aenter__`
- Set breakpoints in `__exit__`/`__aexit__`
- Watch exception info in exit methods