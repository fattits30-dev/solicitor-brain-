const { app, BrowserWindow, Menu, Tray, nativeImage, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')
const { initializePythonBridge, setupIPCHandlers } = require('./ipc-handlers')

let mainWindow
let tray
let backendProcess

// Start backend process
async function startBackend() {
  // Check if backend is already running
  const http = require('http')
  const checkBackend = () => {
    return new Promise((resolve) => {
      http.get('http://localhost:8000/docs', (res) => {
        resolve(res.statusCode === 200)
      }).on('error', () => {
        resolve(false)
      })
    })
  }

  const backendRunning = await checkBackend()
  if (backendRunning) {
    console.log('Backend is already running on port 8000')
    return
  }

  console.log('Starting backend process...')
  const backendPath = path.join(__dirname, '../../')
  const venvPython = path.join(__dirname, '../../venv/bin/python')
  
  // Set environment variables for SQLite
  const env = {
    ...process.env,
    PYTHONPATH: backendPath,
    USE_SQLITE: 'true',
    ELECTRON_APP_DATA: app.getPath('userData')
  }
  
  backendProcess = spawn(venvPython, ['-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', '8000'], {
    cwd: backendPath,
    env: env
  })

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`)
  })

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`)
  })

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`)
  })
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1400,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#030712',
    show: false
  })

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false)

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../out/index.html')}`
  mainWindow.loadURL(startUrl)

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Create system tray
function createTray() {
  const iconPath = path.join(__dirname, '../public/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Hide App',
      click: () => {
        if (mainWindow) {
          mainWindow.hide()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate', '/dashboard')
        }
      }
    },
    {
      label: 'Cases',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate', '/cases')
        }
      }
    },
    {
      label: 'Emails',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate', '/emails')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Solicitor Brain')
  tray.setContextMenu(contextMenu)
  
  // Click on tray icon shows/hides window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

// App event handlers
app.whenReady().then(async () => {
  await startBackend()
  createWindow()
  createTray()
  
  // Initialize IPC handlers
  const venvPath = path.join(__dirname, '../../venv')
  initializePythonBridge(venvPath)
  setupIPCHandlers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill()
  }
})

// IPC handlers
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url)
})

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData')
})