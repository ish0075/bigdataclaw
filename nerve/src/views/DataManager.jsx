import React, { useState, useEffect } from 'react'
import { 
  Database, Upload, Download, FileText, Trash2, 
  Building2, Users, Landmark, Home, Briefcase,
  CheckCircle, AlertCircle, Loader2, ChevronRight,
  BarChart3, RefreshCw, FileUp, FileDown
} from 'lucide-react'
import { 
  importBuildersCSV, importAgentsCSV, importLendersCSV,
  exportModuleToCSV, downloadCSV, getImportSummary, clearAllData
} from '../utils/dataImportExport'
import { getModuleCounts, addToModule } from '../utils/unifiedSearchDatabase'

/**
 * Data Manager
 * Central hub for importing/exporting data across all modules
 * Shows database statistics and allows bulk operations
 */

const MODULES = {
  builders: {
    label: 'Builders',
    icon: Building2,
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    description: 'Home builders and developers',
    sampleFields: 'name, type, region, city, phone, email, website, projects'
  },
  agents: {
    label: 'Agents',
    icon: Users,
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    description: 'Real estate agents and sales reps',
    sampleFields: 'name, brokerage, brokerOfRecord, city, region, email, phone'
  },
  lenders: {
    label: 'Lenders',
    icon: Landmark,
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/10',
    description: 'Mortgage lenders and financiers',
    sampleFields: 'name, type, contactName, email, assetClasses, minLoan, maxLoan'
  },
  properties: {
    label: 'Properties',
    icon: Home,
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
    description: 'Property listings and research data',
    sampleFields: 'address, city, type, price, sqft, description'
  },
  buyers: {
    label: 'Buyers',
    icon: Briefcase,
    color: 'text-accent-yellow',
    bgColor: 'bg-accent-yellow/10',
    description: 'Buyer profiles for matching',
    sampleFields: 'name, type, criteria, budget, regions'
  }
}

const DataManager = () => {
  const [counts, setCounts] = useState({})
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Import state
  const [importModule, setImportModule] = useState('builders')
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [preview, setPreview] = useState(null)

  // Load stats on mount
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    const [countsData, summaryData] = await Promise.all([
      getModuleCounts(),
      getImportSummary()
    ])
    setCounts(countsData)
    setSummary(summaryData)
    setLoading(false)
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImportFile(file)
      parsePreview(file)
    }
  }

  // Parse preview of CSV
  const parsePreview = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n').filter(l => l.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const previewRows = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] }), {})
      })
      setPreview({ headers, rows: previewRows, total: lines.length - 1 })
    }
    reader.readAsText(file)
  }

  // Handle import
  const handleImport = async () => {
    if (!importFile) return
    
    setImporting(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const csvText = e.target.result
        let result
        
        switch (importModule) {
          case 'builders':
            result = await importBuildersCSV(csvText)
            break
          case 'agents':
            result = await importAgentsCSV(csvText)
            break
          case 'lenders':
            result = await importLendersCSV(csvText)
            break
          default:
            throw new Error('Unknown module')
        }
        
        setImportResult({
          success: true,
          ...result
        })
        
        // Refresh stats
        await loadStats()
      } catch (err) {
        setImportResult({
          success: false,
          error: err.message
        })
      }
      setImporting(false)
    }
    
    reader.readAsText(importFile)
  }

  // Handle export
  const handleExport = async (module) => {
    const csv = await exportModuleToCSV(module)
    if (csv) {
      downloadCSV(csv, `${module}-export-${new Date().toISOString().split('T')[0]}.csv`)
    }
  }

  // Handle clear all
  const handleClearAll = async () => {
    if (!confirm('WARNING: This will delete ALL data from all modules. Are you sure?')) return
    await clearAllData()
    await loadStats()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
        <span className="ml-3 text-text-secondary">Loading database stats...</span>
      </div>
    )
  }

  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Database className="w-6 h-6 text-accent-blue" />
            Data Manager
          </h1>
          <p className="text-text-secondary mt-1">
            {totalRecords.toLocaleString()} total records across {Object.keys(MODULES).length} modules
          </p>
        </div>
        <button onClick={loadStats} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-subtle">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'import', label: 'Import Data', icon: Upload },
          { id: 'export', label: 'Export Data', icon: Download },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-accent-blue text-accent-blue' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(MODULES).map(([key, config]) => {
              const Icon = config.icon
              const count = counts[key] || 0
              return (
                <div key={key} className="card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-text-primary">{count.toLocaleString()}</p>
                  <p className="text-sm text-text-muted">{config.label}</p>
                </div>
              )
            })}
          </div>

          {/* Summary by Location */}
          {summary && summary.stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summary.stats.map(stat => (
                <div key={stat.module} className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    {(() => {
                      const Icon = MODULES[stat.module].icon
                      return <Icon className={`w-5 h-5 ${MODULES[stat.module].color}`} />
                    })()}
                    {MODULES[stat.module].label}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Top Regions */}
                    {stat.topRegions.length > 0 && (
                      <div>
                        <p className="text-xs text-text-muted uppercase mb-2">Top Regions</p>
                        <div className="space-y-1">
                          {stat.topRegions.map(([region, count]) => (
                            <div key={region} className="flex items-center justify-between text-sm">
                              <span className="text-text-secondary">{region}</span>
                              <span className="text-text-muted">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Top Cities */}
                    {stat.topCities.length > 0 && (
                      <div>
                        <p className="text-xs text-text-muted uppercase mb-2">Top Cities</p>
                        <div className="space-y-1">
                          {stat.topCities.slice(0, 5).map(([city, count]) => (
                            <div key={city} className="flex items-center justify-between text-sm">
                              <span className="text-text-secondary">{city}</span>
                              <span className="text-text-muted">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Danger Zone */}
          <div className="card p-4 border border-accent-red/30">
            <h3 className="font-semibold text-accent-red mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Clear all data from all modules. This action cannot be undone.
            </p>
            <button onClick={handleClearAll} className="btn-secondary text-accent-red border-accent-red/30 hover:bg-accent-red/10">
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Module Selection */}
          <div className="card p-4">
            <h3 className="font-semibold text-text-primary mb-4">1. Select Data Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(MODULES).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setImportModule(key)
                      setImportFile(null)
                      setPreview(null)
                      setImportResult(null)
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      importModule === key
                        ? 'border-accent-blue bg-accent-blue/5'
                        : 'border-border-subtle hover:border-accent-blue/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${config.color} mb-2`} />
                    <p className="font-medium text-text-primary">{config.label}</p>
                    <p className="text-xs text-text-muted">{counts[key] || 0} existing</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* File Upload */}
          <div className="card p-4">
            <h3 className="font-semibold text-text-primary mb-2">2. Upload CSV File</h3>
            <p className="text-sm text-text-muted mb-4">
              Expected columns: {MODULES[importModule].sampleFields}
            </p>
            
            <div className="border-2 border-dashed border-border-subtle rounded-xl p-8 text-center hover:border-accent-blue/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-import"
              />
              <label htmlFor="csv-import" className="cursor-pointer">
                <FileUp className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary font-medium">Click to upload CSV</p>
                <p className="text-sm text-text-muted mt-1">or drag and drop</p>
              </label>
            </div>

            {importFile && (
              <div className="mt-4 p-3 rounded-lg bg-accent-green/10 text-accent-green flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{importFile.name} selected</span>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="card p-4">
              <h3 className="font-semibold text-text-primary mb-4">3. Preview ({preview.total} records)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {preview.headers.slice(0, 6).map(h => (
                        <th key={h} className="text-left p-2 text-text-muted font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border-subtle">
                        {preview.headers.slice(0, 6).map(h => (
                          <td key={h} className="p-2 text-text-secondary truncate max-w-[150px]">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {preview && (
            <div className="flex items-center justify-end gap-4">
              {importResult && (
                <div className={`flex items-center gap-2 ${importResult.success ? 'text-accent-green' : 'text-accent-red'}`}>
                  {importResult.success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Imported {importResult.count} records</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>{importResult.error}</span>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={importing}
                className="btn-primary flex items-center gap-2"
              >
                {importing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Import {preview.total} Records</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(MODULES).map(([key, config]) => {
              const Icon = config.icon
              const count = counts[key] || 0
              return (
                <div key={key} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{config.label}</p>
                      <p className="text-sm text-text-muted">{count.toLocaleString()} records</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExport(key)}
                    disabled={count === 0}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              )
            })}
          </div>

          {/* Export All */}
          <div className="card p-6 text-center">
            <FileDown className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="font-semibold text-text-primary mb-2">Export All Data</h3>
            <p className="text-sm text-text-muted mb-4">
              Download all modules as separate CSV files
            </p>
            <button
              onClick={() => Object.keys(MODULES).forEach(handleExport)}
              className="btn-primary"
            >
              <Download className="w-4 h-4" />
              Export All Modules
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataManager
