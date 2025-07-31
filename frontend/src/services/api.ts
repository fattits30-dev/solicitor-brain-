// API service for centralized API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiResponse<T> {
  data?: T
  error?: string | undefined
  status: number
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      
      // Add timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      clearTimeout(timeoutId)

      const data = response.ok ? await response.json() : null

      return {
        data,
        error: response.ok ? undefined : `Error: ${response.status}`,
        status: response.status,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: 'Request timeout - please check your connection',
          status: 0,
        }
      }
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      }
    }
  }

  // Dashboard endpoints
  async getDashboardData() {
    return this.request<any>('/api/dashboard')
  }

  async getDashboardMetrics() {
    return this.request<any>('/api/dashboard/metrics')
  }

  // Cases endpoints
  async getCases(params?: { status?: string; search?: string; page?: number; per_page?: number }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.request<any>(`/api/cases${query}`)
  }

  async getCase(id: string) {
    return this.request<any>(`/api/cases/${id}`)
  }

  async createCase(data: any) {
    return this.request<any>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCase(id: string, data: any) {
    return this.request<any>(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Documents endpoints
  async getDocuments(caseId?: string) {
    const query = caseId ? `?case_id=${caseId}` : ''
    return this.request<any[]>(`/api/documents${query}`)
  }

  async uploadDocument(formData: FormData) {
    return fetch(`${this.baseUrl}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json())
  }

  // AI endpoints
  async analyzeCase(caseId: string) {
    return this.request<any>(`/api/case-analysis/analyze/${caseId}`, {
      method: 'POST',
    })
  }

  async getCaseAnalysis(caseId: string) {
    return this.request<any>(`/api/case-analysis/analysis/${caseId}`)
  }

  // Health check
  async checkHealth() {
    return this.request<any>('/health')
  }

  // Settings endpoints
  async getSettings() {
    return this.request<any>('/api/settings')
  }

  async updateSettings(category: string, data: any) {
    return this.request<any>(`/api/settings/${category}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // AI Monitor endpoints
  async getAIStatus() {
    return this.request<any>('/api/ai-monitor/status')
  }

  async startAIProcessing() {
    return this.request<any>('/api/ai-monitor/start', {
      method: 'POST',
    })
  }

  async pauseAIProcessing() {
    return this.request<any>('/api/ai-monitor/pause', {
      method: 'POST',
    })
  }

  async resumeAIProcessing() {
    return this.request<any>('/api/ai-monitor/resume', {
      method: 'POST',
    })
  }

  async stopAIProcessing() {
    return this.request<any>('/api/ai-monitor/stop', {
      method: 'POST',
    })
  }

  // Email endpoints
  async getEmailFolders() {
    return this.request<any>('/api/emails/folders')
  }

  async getEmails(params?: { folder?: string; is_read?: boolean; is_flagged?: boolean; case_id?: string; search?: string }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.request<any>(`/api/emails${query}`)
  }

  async getEmail(id: string) {
    return this.request<any>(`/api/emails/${id}`)
  }

  async sendEmail(data: any) {
    return this.request<any>('/api/emails', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmail(id: string, data: any) {
    return this.request<any>(`/api/emails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteEmail(id: string) {
    return this.request<any>(`/api/emails/${id}`, {
      method: 'DELETE',
    })
  }

  async syncEmails() {
    return this.request<any>('/api/emails/sync', {
      method: 'POST',
    })
  }

  async getEmailSettings() {
    return this.request<any>('/api/emails/settings')
  }

  async updateEmailSettings(data: any) {
    return this.request<any>('/api/emails/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiService()