import React, { useState, useCallback } from 'react'
import { X, Upload, FileSpreadsheet, Check, AlertCircle, UserPlus } from 'lucide-react'
import { useResidentialAgentStore } from '../../stores/residentialAgentStore'

const EXPECTED_COLUMNS = [
  { key: 'name', label: 'Name', required: true, alternatives: ['full_name', 'agent_name', 'realtor_name'] },
  { key: 'brokerage', label: 'Brokerage', required: true, alternatives: ['company', 'office', 'firm'] },
  { key: 'email', label: 'Email', required: false, alternatives: ['email_address', 'e-mail'] },
  { key: 'phone', label: 'Phone', required: false, alternatives: ['telephone', 'mobile', 'cell'] },
  { key: 'facebook', label: 'Facebook', required: false, alternatives: ['fb', 'facebook_url'] },
  { key: 'instagram', label: 'Instagram', required: false, alternatives: ['ig', 'insta', 'instagram_handle'] },
  { key: 'linkedin', label: 'LinkedIn', required: false, alternatives: ['linkedin_url'] },
  { key: 'city', label: 'City', required: false, alternatives: ['location', 'area', 'town'] },
  { key: 'specialties', label: 'Specialties', required: false, alternatives: ['specialty', 'focus'] }
]

const ImportModal = ({ onClose }) => {
  const { importAgents } = useResidentialAgentStore()
  const [step, setStep] = useState('upload') // upload, mapping, preview, complete
  const [rawData, setRawData] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [previewData, setPreviewData] = useState([])
  const [importCount, setImportCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  
  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row')
    
    // Simple CSV parsing (handles quoted fields)
    const parseLine = (line) => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }
    
    const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').toLowerCase().trim())
    const data = lines.slice(1).map(line => {
      const values = parseLine(line)
      const row = {}
      headers.forEach((header, i) => {
        row[header] = values[i]?.replace(/^"|"$/g, '') || ''
      })
      return row
    })
    
    return { headers, data }
  }
  
  const handleFile = (file) => {
    setError(null)
    
    if (!file) return
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const { headers, data } = parseCSV(text)
        
        if (data.length === 0) {
          setError('No data rows found in CSV')
          return
        }
        
        setRawData(data)
        setHeaders(headers)
        
        // Auto-detect mapping
        const autoMapping = {}
        EXPECTED_COLUMNS.forEach(col => {
          const possibleNames = [col.key, ...col.alternatives]
          const match = headers.find(h => possibleNames.includes(h.toLowerCase().replace(/\s+/g, '_')))
          if (match) {
            autoMapping[col.key] = match
          }
        })
        setMapping(autoMapping)
        setStep('mapping')
      } catch (err) {
        setError(err.message)
      }
    }
    reader.readAsText(file)
  }
  
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [])
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  
  const generatePreview = () => {
    const preview = rawData.slice(0, 5).map(row => {
      const mapped = {}
      EXPECTED_COLUMNS.forEach(col => {
        const sourceCol = mapping[col.key]
        if (sourceCol) {
          mapped[col.key] = row[sourceCol]
        }
      })
      return mapped
    })
    setPreviewData(preview)
    setStep('preview')
  }
  
  const handleImport = () => {
    const agents = rawData.map(row => {
      const agent = {}
      EXPECTED_COLUMNS.forEach(col => {
        const sourceCol = mapping[col.key]
        if (sourceCol && row[sourceCol]) {
          let value = row[sourceCol].trim()
          if (col.key === 'specialties') {
            value = value.split(/[,;]/).map(s => s.trim()).filter(Boolean)
          }
          agent[col.key] = value
        }
      })
      return agent
    }).filter(a => a.name && a.brokerage) // Only include rows with required fields
    
    importAgents(agents)
    setImportCount(agents.length)
    setStep('complete')
  }
  
  const missingRequired = EXPECTED_COLUMNS.filter(col => 
    col.required && !mapping[col.key]
  )
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent-purple" />
            Import Agents
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-input">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center transition-all
                  ${isDragging 
                    ? 'border-accent-purple bg-accent-purple/10' 
                    : 'border-border-subtle hover:border-text-muted'
                  }
                `}
              >
                <FileSpreadsheet className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-primary font-medium mb-2">
                  Drop your CSV file here
                </p>
                <p className="text-text-secondary text-sm mb-4">
                  or click to browse
                </p>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                  id="csv-upload"
                />
                <label 
                  htmlFor="csv-upload"
                  className="btn-secondary cursor-pointer inline-block"
                >
                  Select File
                </label>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div className="text-sm text-text-muted">
                <p className="font-medium text-text-secondary mb-2">Expected CSV columns:</p>
                <div className="flex flex-wrap gap-2">
                  {EXPECTED_COLUMNS.map(col => (
                    <span 
                      key={col.key} 
                      className={`px-2 py-1 rounded text-xs ${col.required ? 'bg-accent-red/20 text-accent-red' : 'bg-bg-input'}`}
                    >
                      {col.label}{col.required ? '*' : ''}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs">* Required fields</p>
              </div>
            </div>
          )}
          
          {/* Step: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-text-secondary">
                Map your CSV columns to the appropriate fields. We've tried to auto-detect matches.
              </p>
              
              <div className="space-y-3">
                {EXPECTED_COLUMNS.map(col => (
                  <div key={col.key} className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-text-primary">
                      {col.label}
                      {col.required && <span className="text-accent-red ml-1">*</span>}
                    </label>
                    <select
                      value={mapping[col.key] || ''}
                      onChange={(e) => setMapping({...mapping, [col.key]: e.target.value})}
                      className={`flex-1 bg-bg-input border rounded-lg px-3 py-2 text-sm ${
                        col.required && !mapping[col.key] 
                          ? 'border-accent-red/50' 
                          : 'border-border-subtle'
                      }`}
                    >
                      <option value="">-- Not mapped --</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              
              {missingRequired.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Missing required mappings: {missingRequired.map(c => c.label).join(', ')}
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setStep('upload')} className="btn-secondary">
                  Back
                </button>
                <button 
                  onClick={generatePreview}
                  disabled={missingRequired.length > 0}
                  className="btn-primary"
                >
                  Preview Import
                </button>
              </div>
            </div>
          )}
          
          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <p className="text-text-secondary">
                Preview of first {previewData.length} agents to be imported:
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {previewData.map((agent, i) => (
                  <div key={i} className="p-3 rounded-lg bg-bg-input flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-sm font-medium text-accent-purple">
                      {agent.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{agent.name || 'Unnamed'}</p>
                      <p className="text-sm text-text-secondary truncate">{agent.brokerage || 'No brokerage'}</p>
                    </div>
                    {agent.email && (
                      <span className="text-xs text-text-muted truncate max-w-[150px]">{agent.email}</span>
                    )}
                  </div>
                ))}
              </div>
              
              {rawData.length > 5 && (
                <p className="text-center text-sm text-text-muted">
                  ...and {rawData.length - 5} more agents
                </p>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setStep('mapping')} className="btn-secondary">
                  Back
                </button>
                <button onClick={handleImport} className="btn-primary">
                  Import {rawData.length} Agents
                </button>
              </div>
            </div>
          )}
          
          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-accent-green" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Import Complete!
              </h3>
              <p className="text-text-secondary mb-6">
                Successfully imported {importCount} agents to your database.
              </p>
              <button onClick={onClose} className="btn-primary">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportModal
