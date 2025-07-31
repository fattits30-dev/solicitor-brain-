export interface ElectronAPI {
  // Database operations
  getCases: (params: any) => Promise<any[]>
  createCase: (data: any) => Promise<any>
  updateCase: (id: string, data: any) => Promise<any>
  deleteCase: (id: string) => Promise<void>
  
  getDocuments: (params: any) => Promise<any[]>
  createDocument: (data: any) => Promise<any>
  updateDocument: (id: string, data: any) => Promise<any>
  deleteDocument: (id: string) => Promise<void>
  
  getEmails: (params: any) => Promise<any[]>
  sendEmail: (data: any) => Promise<any>
  
  getEvents: (params: any) => Promise<any[]>
  createEvent: (data: any) => Promise<any>
  updateEvent: (id: string, data: any) => Promise<any>
  deleteEvent: (id: string) => Promise<void>
  
  // AI operations
  chat: (message: string, context?: any) => Promise<any>
  analyzeDocument: (documentId: string, analysisType?: string) => Promise<any>
  analyzeCase: (caseId: string, analysisType?: string) => Promise<any>
  extractFacts: (text: string, documentId?: string) => Promise<any[]>
  generateDocument: (templateId: string, data: any) => Promise<any>
  
  // Search operations
  searchDocuments: (query: string, filters?: any) => Promise<any[]>
  searchCases: (query: string, filters?: any) => Promise<any[]>
  searchAll: (query: string, filters?: any) => Promise<any[]>
  
  // Auth operations
  login: (username: string, password: string) => Promise<any>
  logout: (token?: string) => Promise<void>
  verifyToken: (token: string) => Promise<any>
  changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<void>
  
  // File operations
  uploadFile: (path: string, content: any, metadata?: any) => Promise<any>
  downloadFile: (id: string) => Promise<any>
  deleteFile: (id: string) => Promise<void>
  scanDocument: (imagePath: string) => Promise<{ text: string }>
  
  // Background job operations
  processBackgroundJob: (type: string, data: any) => Promise<any>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}