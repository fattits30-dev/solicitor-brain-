'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Brain,
  FileSearch,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Scale,
  Shield,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Download,
  ChevronRight,
  BookOpen,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  Activity,
  Info,
  Award,
  Timer,
  ArrowRight,
  FileCheck
} from 'lucide-react'

interface LegalIssue {
  issue_type: string
  description: string
  severity: string
  applicable_laws: string[]
  evidence_refs: string[]
  remedies: string[]
  time_limits?: string
}

interface CaseAnalysis {
  case_id: string
  case_number: string
  analysis_date: string
  status?: string
  file_structure: any
  evidence_analysis: any
  legal_issues: LegalIssue[]
  legal_framework: any
  violations: any[]
  recommendations: any
  risk_assessment: any
  next_steps: any[]
  compliance_status: any
}

export default function CaseAnalysisPage() {
  const searchParams = useSearchParams()
  const caseId = searchParams.get('caseId')

  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const startAnalysis = useCallback(async () => {
    if (!caseId) return

    setAnalyzing(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90))
    }, 1000)

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/analyze/${caseId}`, {
        method: 'POST'
      })

      // Poll for results
      const pollInterval = setInterval(async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/analysis/${caseId}`)
        const data = await response.json()

        if (data.status === 'completed') {
          setAnalysis(data)
          setAnalyzing(false)
          setProgress(100)
          clearInterval(pollInterval)
          clearInterval(progressInterval)
        }
      }, 3000)

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        clearInterval(progressInterval)
        setAnalyzing(false)
      }, 120000)
    } catch (err) {
      setError('Failed to start analysis')
      setAnalyzing(false)
      clearInterval(progressInterval)
    }
  }, [caseId])

  const loadAnalysis = useCallback(async () => {
    if (!caseId) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/analysis/${caseId}`)
      const data = await response.json()

      if (data.status === 'pending') {
        // Start analysis if not done
        startAnalysis()
      } else {
        setAnalysis(data)
      }
    } catch (err) {
      setError('Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }, [caseId, startAnalysis])

  useEffect(() => {
    if (caseId) {
      loadAnalysis()
    }
  }, [caseId, loadAnalysis])

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'low':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const getRiskBg = (score: number) => {
    if (score >= 70) return 'bg-red-500/10'
    if (score >= 40) return 'bg-amber-500/10'
    return 'bg-emerald-500/10'
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'evidence', label: 'Evidence', icon: FileSearch },
    { id: 'legal', label: 'Legal Issues', icon: Scale },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'recommendations', label: 'Strategy', icon: Target }
  ]

  if (!caseId) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Case Selected</h2>
          <p className="text-gray-400">Please select a case to analyze</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-400 text-sm">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (analyzing) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <div className="relative inline-flex">
              <Brain className="h-16 w-16 text-purple-400" />
              <Sparkles className="h-6 w-6 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold text-white mt-4 mb-2">Analyzing Case</h2>
            <p className="text-gray-400 mb-8">Our AI is performing a comprehensive legal analysis...</p>

            <div className="space-y-3 text-left max-w-md mx-auto mb-8">
              {[
                { step: 'Scanning evidence documents', icon: FileSearch },
                { step: 'Identifying legal issues', icon: Scale },
                { step: 'Checking UK law compliance', icon: Shield },
                { step: 'Assessing case strength', icon: BarChart3 },
                { step: 'Generating recommendations', icon: Target }
              ].map((item, i) => (
                <div
                  key={item.step}
                  className={`flex items-center gap-3 transition-all ${
                    i * 20 < progress ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${
                    i * 20 < progress ? 'text-purple-400' : 'text-gray-600'
                  }`} />
                  <span className={i * 20 < progress ? 'text-gray-200' : 'text-gray-600'}>
                    {item.step}
                  </span>
                  {i * 20 < progress && (
                    <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
                  )}
                </div>
              ))}
            </div>

            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-gray-400">Progress</span>
              <span className="text-gray-400">{progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Estimated time: 2 minutes</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Analysis Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadAnalysis} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Analysis Available</h2>
          <p className="text-gray-400 mb-4">This case hasn&apos;t been analyzed yet</p>
          <button 
            onClick={startAnalysis} 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Brain className="h-4 w-4" />
            Start Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              Case Analysis
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {analysis.case_number} • Analyzed {new Date(analysis.analysis_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={startAnalysis} 
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-gray-400" />
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Risk Assessment Bar */}
      <div className="px-6 py-3 bg-black/30 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className={`px-4 py-2 rounded-lg ${getRiskBg(analysis.risk_assessment?.risk_score || 0)}`}>
            <div className="flex items-center gap-3">
              <Target className={`h-5 w-5 ${getRiskColor(analysis.risk_assessment?.risk_score || 0)}`} />
              <div>
                <div className={`text-lg font-semibold ${getRiskColor(analysis.risk_assessment?.risk_score || 0)}`}>
                  {analysis.risk_assessment?.risk_level || 'Unknown'} Risk
                </div>
                <div className="text-xs text-gray-500">Score: {analysis.risk_assessment?.risk_score || 0}/100</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-400" />
              <span className="text-gray-300">{analysis.legal_issues?.length || 0} Legal Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="text-gray-300">{analysis.evidence_analysis?.total_documents || 0} Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-gray-300">{analysis.violations?.length || 0} Violations</span>
            </div>
          </div>

          {analysis.risk_assessment?.recommendation && (
            <div className="ml-auto text-xs text-gray-400 max-w-xs">
              {analysis.risk_assessment.recommendation}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6">
        <div className="flex gap-6">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-all text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Scale className="h-5 w-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{analysis.legal_issues?.length || 0}</span>
                </div>
                <p className="text-sm text-gray-400">Legal Issues Found</p>
                <div className="mt-2 text-[10px] text-blue-400">
                  {analysis.legal_issues?.filter(i => i.severity === 'critical').length || 0} critical
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <FileCheck className="h-5 w-5 text-emerald-400" />
                  <span className="text-2xl font-bold text-white">{analysis.evidence_analysis?.total_documents || 0}</span>
                </div>
                <p className="text-sm text-gray-400">Documents Analyzed</p>
                <div className="mt-2 text-[10px] text-emerald-400">
                  {analysis.evidence_analysis?.evidence_strength || 'Unknown'} strength
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <span className="text-2xl font-bold text-white">{analysis.violations?.length || 0}</span>
                </div>
                <p className="text-sm text-gray-400">Violations Found</p>
                <div className="mt-2 text-[10px] text-amber-400">
                  {analysis.violations?.filter((v: any) => v.severity === 'high').length || 0} high severity
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  <span className="text-2xl font-bold text-white">{analysis.next_steps?.length || 0}</span>
                </div>
                <p className="text-sm text-gray-400">Next Steps</p>
                <div className="mt-2 text-[10px] text-purple-400">
                  {analysis.next_steps?.filter((s: any) => s.priority === 'URGENT').length || 0} urgent
                </div>
              </div>
            </div>

            {/* Next Steps */}
            {analysis.next_steps && analysis.next_steps.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  Immediate Next Steps
                </h3>
                <div className="space-y-3">
                  {analysis.next_steps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        step.priority === 'URGENT'
                          ? 'bg-red-500/10 border border-red-500/20'
                          : step.priority === 'High'
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <ChevronRight
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          step.priority === 'URGENT'
                            ? 'text-red-400'
                            : step.priority === 'High'
                              ? 'text-amber-400'
                              : 'text-gray-400'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-200">{step.action}</p>
                        {step.deadline && (
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              Due: {new Date(step.deadline).toLocaleDateString()}
                            </span>
                            {step.days_remaining && (
                              <span className={`text-xs ${
                                step.days_remaining <= 7 ? 'text-red-400' : 'text-gray-500'
                              }`}>
                                {step.days_remaining} days remaining
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {step.priority === 'URGENT' && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                          URGENT
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case Strength Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Case Strength Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Evidence Quality</span>
                      <span className="text-xs text-gray-400">
                        {analysis.evidence_analysis?.evidence_strength || 'Unknown'}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className={`h-full rounded-full ${
                        analysis.evidence_analysis?.evidence_strength === 'Strong' ? 'bg-emerald-500 w-full' :
                        analysis.evidence_analysis?.evidence_strength === 'Good' ? 'bg-blue-500 w-3/4' :
                        analysis.evidence_analysis?.evidence_strength === 'Adequate' ? 'bg-amber-500 w-1/2' :
                        'bg-red-500 w-1/4'
                      }`} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Legal Position</span>
                      <span className="text-xs text-gray-400">Strong</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="h-full bg-purple-500 rounded-full w-4/5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Key Insights</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-400 mt-0.5" />
                    <p className="text-xs text-gray-300">Strong documentary evidence supports primary claims</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                    <p className="text-xs text-gray-300">Time-sensitive filing deadlines approaching</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <p className="text-xs text-gray-300">Case complies with SRA regulations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Evidence Summary */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Evidence Analysis</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(analysis.evidence_analysis?.document_types || {}).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">{count as number}</p>
                    <p className="text-sm text-gray-400 capitalize mt-1">{type.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Evidence Strength</span>
                  <span className={`text-sm font-medium ${
                    analysis.evidence_analysis?.evidence_strength === 'Strong' ? 'text-emerald-400' :
                    analysis.evidence_analysis?.evidence_strength === 'Good' ? 'text-blue-400' :
                    analysis.evidence_analysis?.evidence_strength === 'Adequate' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {analysis.evidence_analysis?.evidence_strength || 'Unknown'}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all ${
                    analysis.evidence_analysis?.evidence_strength === 'Strong' ? 'bg-emerald-500 w-full' :
                    analysis.evidence_analysis?.evidence_strength === 'Good' ? 'bg-blue-500 w-3/4' :
                    analysis.evidence_analysis?.evidence_strength === 'Adequate' ? 'bg-amber-500 w-1/2' :
                    'bg-red-500 w-1/4'
                  }`} />
                </div>
              </div>

              {/* Missing Evidence */}
              {analysis.evidence_analysis?.missing_evidence?.length > 0 && (
                <div className="mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <h4 className="font-medium text-amber-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Missing Evidence
                  </h4>
                  <ul className="space-y-1">
                    {analysis.evidence_analysis.missing_evidence.map((item: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                        <ChevronRight className="h-3 w-3 text-amber-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Key Evidence */}
            {analysis.evidence_analysis?.key_evidence?.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Key Evidence Items</h3>
                <div className="space-y-3">
                  {analysis.evidence_analysis.key_evidence.map((evidence: any, i: number) => (
                    <div key={i} className="p-4 bg-black/30 rounded-lg border border-white/5">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-200">{evidence.document}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          evidence.relevance === 'High'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {evidence.relevance} Relevance
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{evidence.type}</p>
                      {evidence.key_points && (
                        <div className="text-sm text-gray-300">
                          <p className="font-medium mb-1">Key Points:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            {Object.entries(evidence.key_points).map(([k, v]: [string, any]) => (
                              <li key={k}>
                                <span className="text-gray-400">{k}:</span> {Array.isArray(v) ? v.join(', ') : v}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Legal Issues */}
            {analysis.legal_issues?.map((issue: LegalIssue, index: number) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-6 border border-white/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{issue.issue_type}</h3>
                    <p className="text-sm text-gray-400 mt-1">{issue.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Applicable Laws */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Applicable Laws</h4>
                    <div className="flex flex-wrap gap-2">
                      {issue.applicable_laws.map((law, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs">
                          {law}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Time Limits */}
                  {issue.time_limits && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Time Limits</h4>
                      <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-amber-400" />
                          <p className="text-sm text-amber-400">{issue.time_limits}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Available Remedies */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Available Remedies</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {issue.remedies.map((remedy, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <ArrowRight className="h-3 w-3 text-purple-400" />
                        {remedy}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Legal Framework */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                Legal Framework
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statutes */}
                {analysis.legal_framework?.statutes?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Relevant Statutes</h4>
                    <div className="space-y-2">
                      {analysis.legal_framework.statutes.map((statute: any, i: number) => (
                        <div key={i} className="p-3 bg-black/30 rounded-lg">
                          <p className="font-medium text-sm text-gray-200">
                            {statute.act_name} {statute.year}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Section {statute.section}</p>
                          <p className="text-xs text-gray-500 mt-1">{statute.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case Law */}
                {analysis.legal_framework?.case_law?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Relevant Cases</h4>
                    <div className="space-y-2">
                      {analysis.legal_framework.case_law.map((case_ref: any, i: number) => (
                        <div key={i} className="p-3 bg-black/30 rounded-lg">
                          <p className="font-medium text-sm text-gray-200">{case_ref.case_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{case_ref.citation}</p>
                          <p className="text-xs text-gray-500 mt-1">{case_ref.principle}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* SRA Compliance */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                SRA Compliance Status
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(analysis.compliance_status || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                    <span className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    {typeof value === 'boolean' ? (
                      value ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )
                    ) : (
                      <span className="text-sm font-medium text-gray-200">{String(value)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Violations */}
            {analysis.violations?.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Legal Violations Identified
                </h3>

                <div className="space-y-4">
                  {analysis.violations.map((violation: any, i: number) => (
                    <div key={i} className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-red-400">{violation.type}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{violation.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {violation.laws_breached && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Laws Breached:</p>
                            <div className="flex flex-wrap gap-1">
                              {violation.laws_breached.map((law: string, j: number) => (
                                <span key={j} className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                  {law}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {violation.remedies_available && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Available Remedies:</p>
                            <p className="text-xs text-gray-300">{violation.remedies_available.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Immediate Actions */}
            {analysis.recommendations?.immediate_actions?.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Immediate Actions Required
                </h3>
                <div className="space-y-3">
                  {analysis.recommendations.immediate_actions.map((action: any, i: number) => (
                    <div key={i} className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-200">{action.action}</p>
                          {action.deadline && (
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-400">
                                Deadline: {new Date(action.deadline).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                        {action.priority === 'URGENT' && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium ml-3">
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Strategy */}
            {analysis.recommendations?.legal_strategy?.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Recommended Legal Strategy
                </h3>
                <ol className="space-y-3">
                  {analysis.recommendations.legal_strategy.map((strategy: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-300">{strategy}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Timeline */}
            {analysis.recommendations?.timeline?.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  Litigation Timeline
                </h3>
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10" />
                  <div className="space-y-4">
                    {analysis.recommendations.timeline.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-16 text-right text-xs text-gray-500">Week {item.week}</div>
                          <div className="absolute left-8 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-black" />
                        </div>
                        <div className="flex-1 p-3 bg-black/30 rounded-lg">
                          <p className="font-medium text-sm text-gray-200">{item.action}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.responsible}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Success Factors */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                Key Success Factors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <h4 className="font-medium text-emerald-400 mb-2">Strengths</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      Strong documentary evidence
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      Clear legal precedents
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      Compliant with regulations
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <h4 className="font-medium text-amber-400 mb-2">Areas to Address</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-amber-400" />
                      Gather additional witness statements
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-amber-400" />
                      File within limitation period
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-amber-400" />
                      Document chain of custody
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}