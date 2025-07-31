import CryptoJS from 'crypto-js'
import bcryptjs from 'bcryptjs'

// Encryption key management
const getEncryptionKey = () => {
  // In production, this should come from a secure environment variable
  const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-change-in-production'
  return CryptoJS.SHA256(key).toString()
}

// Encrypt sensitive data
export const encrypt = (data: string): string => {
  const key = getEncryptionKey()
  return CryptoJS.AES.encrypt(data, key).toString()
}

// Decrypt sensitive data
export const decrypt = (encryptedData: string): string => {
  const key = getEncryptionKey()
  const bytes = CryptoJS.AES.decrypt(encryptedData, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Hash passwords
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcryptjs.genSalt(10)
  return bcryptjs.hash(password, salt)
}

// Verify passwords
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcryptjs.compare(password, hash)
}

// Generate secure tokens
export const generateToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length).toString()
}

// Secure local storage wrapper
export const secureStorage = {
  setItem: (key: string, value: any) => {
    const encrypted = encrypt(JSON.stringify(value))
    localStorage.setItem(key, encrypted)
  },
  
  getItem: (key: string): any => {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    
    try {
      const decrypted = decrypt(encrypted)
      return JSON.parse(decrypted)
    } catch {
      return null
    }
  },
  
  removeItem: (key: string) => {
    localStorage.removeItem(key)
  },
  
  clear: () => {
    localStorage.clear()
  }
}

// Sanitize HTML content
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
}

// Validate and sanitize file uploads
export const validateFile = (file: File, options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
} = {}): { valid: boolean; error?: string } => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options // 10MB default
  
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` }
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} not allowed` }
  }
  
  return { valid: true }
}

// Session management
export class SecureSession {
  private static instance: SecureSession
  private sessionData: Map<string, any> = new Map()
  private sessionTimeout: number = 30 * 60 * 1000 // 30 minutes
  
  static getInstance(): SecureSession {
    if (!SecureSession.instance) {
      SecureSession.instance = new SecureSession()
    }
    return SecureSession.instance
  }
  
  set(key: string, value: any): void {
    this.sessionData.set(key, {
      value,
      timestamp: Date.now()
    })
  }
  
  get(key: string): any {
    const data = this.sessionData.get(key)
    if (!data) return null
    
    if (Date.now() - data.timestamp > this.sessionTimeout) {
      this.sessionData.delete(key)
      return null
    }
    
    return data.value
  }
  
  clear(): void {
    this.sessionData.clear()
  }
}