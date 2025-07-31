'use client'

import { useState, useEffect } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Zap, 
  Save, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Settings,
  ChevronRight,
  Lock,
  Smartphone,
  Globe,
  Server,
  Palette,
  FileText,
  HardDrive,
  Cpu,
  Wifi,
  Key,
  Check,
  CheckCircle,
  X,
  RefreshCw,
  Info,
  Brain,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Clock,
  Calendar,
  Languages,
  CreditCard,
  Building,
  Users,
  BarChart
} from 'lucide-react'
import { api } from '@/services/api'

interface Settings {
  profile: {
    full_name: string
    email: string
    role: string
    firm: string
    phone?: string
    timezone?: string
    language?: string
  }
  notifications: {
    email_notifications: boolean
    desktop_alerts: boolean
    weekly_reports: boolean
    client_alerts: boolean
    system_notices: boolean
    sound_enabled: boolean
    quiet_hours: boolean
    quiet_start?: string
    quiet_end?: string
  }
  security: {
    two_factor_enabled: boolean
    session_timeout: number
    password_expiry: number
    login_history?: Array<{
      date: string
      ip: string
      device: string
      status: string
    }>
  }
  ai: {
    model: string
    temperature: number
    max_tokens: number
    citation_required: boolean
    confidence_threshold: number
    auto_suggestions: boolean
  }
  email: {
    email_address: string
    smtp_server: string
    smtp_port: number
    imap_server: string
    imap_port: number
    sync_enabled: boolean
    sync_interval: number
    last_sync?: string
  }
  appearance: {
    theme: 'dark' | 'light' | 'system'
    accent_color: string
    font_size: string
    sidebar_collapsed: boolean
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        setSettings({
          profile: {
            full_name: 'John Smith',
            email: 'john.smith@lawfirm.com',
            role: 'Senior Solicitor',
            firm: 'Smith & Associates',
            phone: '+44 20 7946 0958',
            timezone: 'Europe/London',
            language: 'en-GB'
          },
          notifications: {
            email_notifications: true,
            desktop_alerts: true,
            weekly_reports: false,
            client_alerts: true,
            system_notices: true,
            sound_enabled: true,
            quiet_hours: true,
            quiet_start: '22:00',
            quiet_end: '08:00'
          },
          security: {
            two_factor_enabled: false,
            session_timeout: 30,
            password_expiry: 90,
            login_history: [
              { date: '2024-01-12 14:32', ip: '192.168.1.1', device: 'Chrome / Windows', status: 'success' },
              { date: '2024-01-12 09:15', ip: '192.168.1.1', device: 'Safari / iPhone', status: 'success' },
              { date: '2024-01-11 18:45', ip: '192.168.1.1', device: 'Chrome / Windows', status: 'success' }
            ]
          },
          ai: {
            model: 'mistral-7b',
            temperature: 0.1,
            max_tokens: 1024,
            citation_required: true,
            confidence_threshold: 0.85,
            auto_suggestions: true
          },
          email: {
            email_address: 'john.smith@lawfirm.com',
            smtp_server: 'smtp.gmail.com',
            smtp_port: 587,
            imap_server: 'imap.gmail.com',
            imap_port: 993,
            sync_enabled: true,
            sync_interval: 300,
            last_sync: '2024-01-12T14:30:00Z'
          },
          appearance: {
            theme: 'dark',
            accent_color: 'blue',
            font_size: 'medium',
            sidebar_collapsed: false
          }
        })
        setLoading(false)
      }, 1000)
    } catch (err) {
      setError('Failed to load settings')
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      
      // Simulate API call
      setTimeout(() => {
        setSuccess(true)
        setSaving(false)
        setTimeout(() => setSuccess(false), 3000)
      }, 1000)
    } catch (err) {
      setError('Failed to save settings')
      setSaving(false)
    }
  }

  const updateSetting = (category: keyof Settings, field: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    })
  }

  const testEmailConnection = async () => {
    setTestingConnection(true)
    // Simulate connection test
    setTimeout(() => {
      setTestingConnection(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-400 text-sm">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-400">Failed to load settings</p>
        <button 
          onClick={loadSettings}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, description: 'Personal information' },
    { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Alerts & updates' },
    { id: 'security', name: 'Security', icon: Shield, description: 'Password & access' },
    { id: 'ai', name: 'AI Settings', icon: Brain, description: 'Model configuration' },
    { id: 'email', name: 'Email', icon: Mail, description: 'Email integration' },
    { id: 'appearance', name: 'Appearance', icon: Palette, description: 'Theme & display' },
    { id: 'database', name: 'Database', icon: Database, description: 'Storage settings' },
    { id: 'billing', name: 'Billing', icon: CreditCard, description: 'Subscription & usage' }
  ]

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-black/30 border-r border-white/5 flex flex-col">
        <div className="px-6 py-4 border-b border-white/5">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Settings
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your preferences</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left p-3 rounded-lg transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                    <div>
                      <div className="text-sm font-medium">{tab.name}</div>
                      <div className={`text-[10px] ${activeTab === tab.id ? 'text-blue-200' : 'text-gray-500'}`}>
                        {tab.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-colors ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{settings.profile.full_name}</div>
              <div className="text-xs text-gray-500 truncate">{settings.profile.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Profile Settings</h2>
                  <p className="text-sm text-gray-400">Manage your personal information and preferences</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={settings.profile.full_name} 
                        onChange={(e) => updateSetting('profile', 'full_name', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Role</label>
                      <input 
                        type="text" 
                        value={settings.profile.role} 
                        onChange={(e) => updateSetting('profile', 'role', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={settings.profile.email} 
                        onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={settings.profile.phone || ''} 
                        onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        placeholder="+44 20 0000 0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Law Firm</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input 
                        type="text" 
                        value={settings.profile.firm} 
                        onChange={(e) => updateSetting('profile', 'firm', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Time Zone</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <select 
                          value={settings.profile.timezone || 'Europe/London'} 
                          onChange={(e) => updateSetting('profile', 'timezone', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm appearance-none"
                        >
                          <option value="Europe/London">London (GMT)</option>
                          <option value="Europe/Dublin">Dublin (GMT)</option>
                          <option value="Europe/Paris">Paris (CET)</option>
                          <option value="America/New_York">New York (EST)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Language</label>
                      <div className="relative">
                        <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <select 
                          value={settings.profile.language || 'en-GB'} 
                          onChange={(e) => updateSetting('profile', 'language', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm appearance-none"
                        >
                          <option value="en-GB">English (UK)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Notification Preferences</h2>
                  <p className="text-sm text-gray-400">Control how you receive updates and alerts</p>
                </div>

                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'email_notifications', label: 'Enable email notifications', description: 'Receive updates via email' },
                        { key: 'weekly_reports', label: 'Weekly summary reports', description: 'Get a digest of your weekly activity' },
                        { key: 'client_alerts', label: 'Client communication alerts', description: 'Notifications for client messages' }
                      ].map(item => (
                        <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                            onChange={(e) => updateSetting('notifications', item.key, e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-gray-200 group-hover:text-white transition-colors">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Notifications */}
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-400" />
                      Desktop Notifications
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'desktop_alerts', label: 'Enable desktop alerts', description: 'Show system notifications' },
                        { key: 'sound_enabled', label: 'Notification sounds', description: 'Play sound for important alerts' },
                        { key: 'system_notices', label: 'System maintenance notices', description: 'Updates about system status' }
                      ].map(item => (
                        <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                            onChange={(e) => updateSetting('notifications', item.key, e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-gray-200 group-hover:text-white transition-colors">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Moon className="h-4 w-4 text-gray-400" />
                      Quiet Hours
                    </h3>
                    <label className="flex items-start gap-3 cursor-pointer group mb-4">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.quiet_hours}
                        onChange={(e) => updateSetting('notifications', 'quiet_hours', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-gray-200 group-hover:text-white transition-colors">Enable quiet hours</div>
                        <div className="text-xs text-gray-500">Mute notifications during specified times</div>
                      </div>
                    </label>
                    
                    {settings.notifications.quiet_hours && (
                      <div className="grid grid-cols-2 gap-4 pl-7">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Start time</label>
                          <input 
                            type="time" 
                            value={settings.notifications.quiet_start || '22:00'}
                            onChange={(e) => updateSetting('notifications', 'quiet_start', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">End time</label>
                          <input 
                            type="time" 
                            value={settings.notifications.quiet_end || '08:00'}
                            onChange={(e) => updateSetting('notifications', 'quiet_end', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Security Settings</h2>
                  <p className="text-sm text-gray-400">Manage your account security and access controls</p>
                </div>

                {/* Password Change */}
                <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                  <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-400" />
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Current Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          className="w-full pr-10 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">New Password</label>
                        <input 
                          type="password" 
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Confirm Password</label>
                        <input 
                          type="password" 
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-400" />
                      Two-Factor Authentication
                    </h3>
                    <div className={`px-2 py-1 rounded text-xs ${
                      settings.security.two_factor_enabled 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {settings.security.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Add an extra layer of security to your account with 2FA
                  </p>
                  <button className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    settings.security.two_factor_enabled
                      ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}>
                    {settings.security.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>

                {/* Session Settings */}
                <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                  <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    Session Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input 
                        type="number" 
                        value={settings.security.session_timeout}
                        onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        min="5"
                        max="120"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Automatically log out after {settings.security.session_timeout} minutes of inactivity
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Password Expiry (days)
                      </label>
                      <input 
                        type="number" 
                        value={settings.security.password_expiry}
                        onChange={(e) => updateSetting('security', 'password_expiry', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        min="30"
                        max="365"
                      />
                    </div>
                  </div>
                </div>

                {/* Login History */}
                <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                  <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-400" />
                    Recent Login Activity
                  </h3>
                  <div className="space-y-2">
                    {settings.security.login_history?.map((login, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            login.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <div className="text-xs text-gray-300">{login.device}</div>
                            <div className="text-[10px] text-gray-500">{login.ip}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{login.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">AI Settings</h2>
                  <p className="text-sm text-gray-400">Configure AI behavior and model parameters</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">AI Model</label>
                    <div className="relative">
                      <Brain className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <select 
                        value={settings.ai.model}
                        onChange={(e) => updateSetting('ai', 'model', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm appearance-none"
                      >
                        <option value="mistral-7b">Mistral 7B (Recommended)</option>
                        <option value="llama2-13b">LLaMA 2 13B</option>
                        <option value="gpt4-compatible">GPT-4 Compatible</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Response Creativity ({(settings.ai.temperature * 100).toFixed(0)}%)
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01"
                      value={settings.ai.temperature}
                      onChange={(e) => updateSetting('ai', 'temperature', parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>Precise</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Max Response Length</label>
                    <input 
                      type="number" 
                      value={settings.ai.max_tokens}
                      onChange={(e) => updateSetting('ai', 'max_tokens', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      min="256"
                      max="4096"
                      step="256"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Approximate words: {Math.floor(settings.ai.max_tokens * 0.75)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Confidence Threshold ({(settings.ai.confidence_threshold * 100).toFixed(0)}%)
                    </label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1" 
                      step="0.05"
                      value={settings.ai.confidence_threshold}
                      onChange={(e) => updateSetting('ai', 'confidence_threshold', parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Minimum confidence required for AI suggestions
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={settings.ai.citation_required}
                        onChange={(e) => updateSetting('ai', 'citation_required', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
                          Require citations
                        </div>
                        <div className="text-xs text-gray-500">
                          AI must provide sources for all legal information
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={settings.ai.auto_suggestions}
                        onChange={(e) => updateSetting('ai', 'auto_suggestions', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
                          Enable auto-suggestions
                        </div>
                        <div className="text-xs text-gray-500">
                          Proactively suggest relevant information
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Email Settings</h2>
                  <p className="text-sm text-gray-400">Configure email integration and synchronization</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={settings.email.email_address}
                      onChange={(e) => updateSetting('email', 'email_address', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Outgoing Mail (SMTP)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">SMTP Server</label>
                        <input 
                          type="text" 
                          value={settings.email.smtp_server}
                          onChange={(e) => updateSetting('email', 'smtp_server', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Port</label>
                        <input 
                          type="number" 
                          value={settings.email.smtp_port}
                          onChange={(e) => updateSetting('email', 'smtp_port', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          placeholder="587"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Incoming Mail (IMAP)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">IMAP Server</label>
                        <input 
                          type="text" 
                          value={settings.email.imap_server}
                          onChange={(e) => updateSetting('email', 'imap_server', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          placeholder="imap.gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Port</label>
                        <input 
                          type="number" 
                          value={settings.email.imap_port}
                          onChange={(e) => updateSetting('email', 'imap_port', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          placeholder="993"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer group mb-4">
                      <input 
                        type="checkbox" 
                        checked={settings.email.sync_enabled}
                        onChange={(e) => updateSetting('email', 'sync_enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
                          Enable automatic synchronization
                        </div>
                        <div className="text-xs text-gray-500">
                          Sync emails automatically at regular intervals
                        </div>
                      </div>
                    </label>

                    {settings.email.sync_enabled && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                          Sync Interval (seconds)
                        </label>
                        <input 
                          type="number" 
                          value={settings.email.sync_interval}
                          onChange={(e) => updateSetting('email', 'sync_interval', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          min="60"
                          max="3600"
                        />
                      </div>
                    )}
                  </div>

                  {settings.email.last_sync && (
                    <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-400">Last synchronized</p>
                          <p className="text-sm text-gray-200">
                            {new Date(settings.email.last_sync).toLocaleString('en-GB')}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={testEmailConnection}
                        disabled={testingConnection}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs text-gray-300 disabled:opacity-50 flex items-center gap-2"
                      >
                        {testingConnection ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Wifi className="h-3 w-3" />
                            Test Connection
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Appearance</h2>
                  <p className="text-sm text-gray-400">Customize the look and feel of the application</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor }
                      ].map(theme => (
                        <button
                          key={theme.value}
                          onClick={() => updateSetting('appearance', 'theme', theme.value)}
                          className={`p-4 rounded-lg border transition-all ${
                            settings.appearance.theme === theme.value
                              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <theme.icon className="h-5 w-5 mx-auto mb-2" />
                          <div className="text-xs font-medium">{theme.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-3">Accent Color</label>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { value: 'blue', color: 'bg-blue-500' },
                        { value: 'purple', color: 'bg-purple-500' },
                        { value: 'emerald', color: 'bg-emerald-500' },
                        { value: 'amber', color: 'bg-amber-500' },
                        { value: 'rose', color: 'bg-rose-500' },
                        { value: 'cyan', color: 'bg-cyan-500' }
                      ].map(color => (
                        <button
                          key={color.value}
                          onClick={() => updateSetting('appearance', 'accent_color', color.value)}
                          className={`aspect-square rounded-lg ${color.color} relative ${
                            settings.appearance.accent_color === color.value
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]'
                              : ''
                          }`}
                        >
                          {settings.appearance.accent_color === color.value && (
                            <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-3">Font Size</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'small', label: 'Small', size: 'text-xs' },
                        { value: 'medium', label: 'Medium', size: 'text-sm' },
                        { value: 'large', label: 'Large', size: 'text-base' }
                      ].map(size => (
                        <button
                          key={size.value}
                          onClick={() => updateSetting('appearance', 'font_size', size.value)}
                          className={`p-4 rounded-lg border transition-all ${
                            settings.appearance.font_size === size.value
                              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className={`${size.size} font-medium`}>Aa</div>
                          <div className="text-xs mt-2">{size.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={settings.appearance.sidebar_collapsed}
                        onChange={(e) => updateSetting('appearance', 'sidebar_collapsed', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
                          Collapse sidebar by default
                        </div>
                        <div className="text-xs text-gray-500">
                          Start with a compact sidebar view
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="px-8 py-4 bg-black/30 border-t border-white/5">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Settings saved successfully
                </div>
              )}
            </div>
            <button 
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}