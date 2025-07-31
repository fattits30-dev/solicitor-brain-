const { ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

// Import Python bridge for database operations
let pythonBridge = null

function initializePythonBridge(venvPath) {
  const pythonPath = path.join(venvPath, 'bin', 'python')
  pythonBridge = spawn(pythonPath, [
    '-m', 'backend.electron_bridge'
  ], {
    cwd: path.join(__dirname, '../..'),
    env: {
      ...process.env,
      PYTHONPATH: path.join(__dirname, '../..'),
      USE_SQLITE: 'true',
      ELECTRON_MODE: 'true'
    }
  })

  pythonBridge.stdout.on('data', (data) => {
    console.log(`Python Bridge: ${data}`)
  })

  pythonBridge.stderr.on('data', (data) => {
    console.error(`Python Bridge Error: ${data}`)
  })
}

// Helper to call Python functions
async function callPython(method, ...args) {
  return new Promise((resolve, reject) => {
    const request = {
      id: Date.now(),
      method,
      args
    }
    
    pythonBridge.stdin.write(JSON.stringify(request) + '\n')
    
    const handler = (data) => {
      try {
        const response = JSON.parse(data.toString())
        if (response.id === request.id) {
          pythonBridge.stdout.removeListener('data', handler)
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response.result)
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }
    
    pythonBridge.stdout.on('data', handler)
    
    // Timeout after 30 seconds
    setTimeout(() => {
      pythonBridge.stdout.removeListener('data', handler)
      reject(new Error('Python call timeout'))
    }, 30000)
  })
}

function setupIPCHandlers() {
  // Cases
  ipcMain.handle('db:getCases', async (event, params) => {
    return callPython('get_cases', params)
  })
  
  ipcMain.handle('db:getCase', async (event, id) => {
    return callPython('get_case', id)
  })
  
  ipcMain.handle('db:createCase', async (event, data) => {
    return callPython('create_case', data)
  })
  
  ipcMain.handle('db:updateCase', async (event, id, data) => {
    return callPython('update_case', id, data)
  })
  
  ipcMain.handle('db:deleteCase', async (event, id) => {
    return callPython('delete_case', id)
  })
  
  // Documents
  ipcMain.handle('db:getDocuments', async (event, params) => {
    return callPython('get_documents', params)
  })
  
  ipcMain.handle('db:getDocument', async (event, id) => {
    return callPython('get_document', id)
  })
  
  ipcMain.handle('db:uploadDocument', async (event, data) => {
    return callPython('upload_document', data)
  })
  
  ipcMain.handle('db:deleteDocument', async (event, id) => {
    return callPython('delete_document', id)
  })
  
  ipcMain.handle('ocr:scanDocument', async (event, path) => {
    return callPython('scan_document', path)
  })
  
  // Deadlines
  ipcMain.handle('db:getDeadlines', async (event, params) => {
    return callPython('get_deadlines', params)
  })
  
  ipcMain.handle('db:createDeadline', async (event, data) => {
    return callPython('create_deadline', data)
  })
  
  ipcMain.handle('db:updateDeadline', async (event, id, data) => {
    return callPython('update_deadline', id, data)
  })
  
  ipcMain.handle('db:deleteDeadline', async (event, id) => {
    return callPython('delete_deadline', id)
  })
  
  // Email
  ipcMain.handle('email:getEmails', async (event, folder) => {
    return callPython('get_emails', folder)
  })
  
  ipcMain.handle('email:sendEmail', async (event, data) => {
    return callPython('send_email', data)
  })
  
  ipcMain.handle('email:moveEmail', async (event, id, folder) => {
    return callPython('move_email', id, folder)
  })
  
  // Search
  ipcMain.handle('search:documents', async (event, query) => {
    return callPython('search_documents', query)
  })
  
  ipcMain.handle('search:cases', async (event, query) => {
    return callPython('search_cases', query)
  })
  
  ipcMain.handle('search:all', async (event, query) => {
    return callPython('search_all', query)
  })
  
  // AI Operations
  ipcMain.handle('ai:analyzeDocument', async (event, docId) => {
    return callPython('analyze_document', docId)
  })
  
  ipcMain.handle('ai:summarizeCase', async (event, caseId) => {
    return callPython('summarize_case', caseId)
  })
  
  ipcMain.handle('ai:checkCompliance', async (event, text) => {
    return callPython('check_compliance', text)
  })
  
  ipcMain.handle('ai:generateTemplate', async (event, type, data) => {
    return callPython('generate_template', type, data)
  })
  
  // Settings
  ipcMain.handle('settings:get', async (event) => {
    return callPython('get_settings')
  })
  
  ipcMain.handle('settings:update', async (event, settings) => {
    return callPython('update_settings', settings)
  })
  
  // Auth
  ipcMain.handle('auth:login', async (event, credentials) => {
    return callPython('login', credentials)
  })
  
  ipcMain.handle('auth:logout', async (event) => {
    return callPython('logout')
  })
  
  ipcMain.handle('auth:getCurrentUser', async (event) => {
    return callPython('get_current_user')
  })
}

module.exports = {
  initializePythonBridge,
  setupIPCHandlers,
  callPython
}