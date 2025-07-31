const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Navigation
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path))
  },
  
  // System info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
})

// Legal app specific API
contextBridge.exposeInMainWorld('api', {
  // Cases
  getCases: (params) => ipcRenderer.invoke('db:getCases', params),
  getCase: (id) => ipcRenderer.invoke('db:getCase', id),
  createCase: (data) => ipcRenderer.invoke('db:createCase', data),
  updateCase: (id, data) => ipcRenderer.invoke('db:updateCase', id, data),
  deleteCase: (id) => ipcRenderer.invoke('db:deleteCase', id),
  
  // Documents
  getDocuments: (params) => ipcRenderer.invoke('db:getDocuments', params),
  getDocument: (id) => ipcRenderer.invoke('db:getDocument', id),
  uploadDocument: (data) => ipcRenderer.invoke('db:uploadDocument', data),
  deleteDocument: (id) => ipcRenderer.invoke('db:deleteDocument', id),
  scanDocument: (path) => ipcRenderer.invoke('ocr:scanDocument', path),
  
  // Calendar/Deadlines
  getDeadlines: (params) => ipcRenderer.invoke('db:getDeadlines', params),
  createDeadline: (data) => ipcRenderer.invoke('db:createDeadline', data),
  updateDeadline: (id, data) => ipcRenderer.invoke('db:updateDeadline', id, data),
  deleteDeadline: (id) => ipcRenderer.invoke('db:deleteDeadline', id),
  
  // Email
  getEmails: (folder) => ipcRenderer.invoke('email:getEmails', folder),
  sendEmail: (data) => ipcRenderer.invoke('email:sendEmail', data),
  moveEmail: (id, folder) => ipcRenderer.invoke('email:moveEmail', id, folder),
  
  // Search
  searchDocuments: (query) => ipcRenderer.invoke('search:documents', query),
  searchCases: (query) => ipcRenderer.invoke('search:cases', query),
  searchAll: (query) => ipcRenderer.invoke('search:all', query),
  
  // AI Operations
  analyzeDocument: (docId) => ipcRenderer.invoke('ai:analyzeDocument', docId),
  summarizeCase: (caseId) => ipcRenderer.invoke('ai:summarizeCase', caseId),
  checkCompliance: (text) => ipcRenderer.invoke('ai:checkCompliance', text),
  generateTemplate: (type, data) => ipcRenderer.invoke('ai:generateTemplate', type, data),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  
  // Auth
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  
  // Background jobs
  onJobProgress: (callback) => {
    ipcRenderer.on('job:progress', (event, data) => callback(data))
  },
  onJobComplete: (callback) => {
    ipcRenderer.on('job:complete', (event, data) => callback(data))
  },
  onJobError: (callback) => {
    ipcRenderer.on('job:error', (event, data) => callback(data))
  }
})