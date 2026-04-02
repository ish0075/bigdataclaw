import React, { useState, useCallback } from 'react'
import { Upload, FileText, Image as ImageIcon, X, Check, File, AlertCircle, Building2, MapPin, DollarSign, Maximize2, Tag, Eye, Trash2, FileUp } from 'lucide-react'

const PropertyUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [extractedData, setExtractedData] = useState(null)
  
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])
  
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])
  
  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simulate upload
    newFiles.forEach(fileObj => {
      simulateUpload(fileObj.id)
    })
  }
  
  const simulateUpload = (fileId) => {
    setUploading(true)
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
      
      if (progress >= 100) {
        clearInterval(interval)
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
        ))
        
        // Simulate data extraction for PDFs
        const file = uploadedFiles.find(f => f.id === fileId)
        if (file && file.name.endsWith('.pdf')) {
          setTimeout(() => {
            setExtractedData({
              address: '281 Chippawa Creek Road',
              city: 'Welland',
              assetClass: 'Industrial',
              price: 5200000,
              size: 85000,
              capRate: 6.2,
              confidence: 85
            })
          }, 500)
        }
        
        setUploading(false)
      }
    }, 200)
  }
  
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-accent-red" />
    if (type.includes('image')) return <ImageIcon className="w-8 h-8 text-accent-green" />
    if (type.includes('word') || type.includes('document')) return <FileText className="w-8 h-8 text-accent-blue" />
    return <File className="w-8 h-8 text-text-muted" />
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Upload className="w-6 h-6 text-accent-red" />
          Property Upload
        </h1>
        <p className="text-text-secondary mt-1">Upload property documents, photos, and offering memorandums</p>
      </div>
      
      {/* Upload Area */}
      <div 
        className={`card p-8 border-2 border-dashed ${dragActive ? 'border-accent-red bg-accent-red/5' : 'border-border-subtle'} transition-colors`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-bg-input flex items-center justify-center mx-auto mb-4">
            <FileUp className="w-8 h-8 text-accent-red" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">Drag & Drop files here</h3>
          <p className="text-text-secondary mb-4">or click to browse</p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.csv"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="btn-primary cursor-pointer inline-block">
            Select Files
          </label>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
            <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Images</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Word</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Excel</span>
          </div>
        </div>
      </div>
      
      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-text-primary mb-4">Uploaded Files ({uploadedFiles.length})</h3>
          <div className="space-y-3">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg bg-bg-input">
                {getFileIcon(file.type)}
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
                  {file.status === 'pending' && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent-red rounded-full transition-all"
                          style={{ width: `${uploadProgress[file.id] || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'completed' ? (
                    <Check className="w-5 h-5 text-accent-green" />
                  ) : (
                    <span className="text-xs text-text-muted">{uploadProgress[file.id] || 0}%</span>
                  )}
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 rounded hover:bg-accent-red/20 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Extracted Data Preview */}
      {extractedData && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent-green" />
              Extracted Property Data
            </h3>
            <span className="px-2 py-1 rounded bg-accent-green/20 text-accent-green text-xs">
              {extractedData.confidence}% Confidence
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-bg-input">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Building2 className="w-3 h-3" />
                Address
              </div>
              <p className="font-medium text-text-primary">{extractedData.address}</p>
              <p className="text-sm text-text-secondary">{extractedData.city}</p>
            </div>
            <div className="p-3 rounded-lg bg-bg-input">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Tag className="w-3 h-3" />
                Asset Class
              </div>
              <p className="font-medium text-text-primary">{extractedData.assetClass}</p>
            </div>
            <div className="p-3 rounded-lg bg-bg-input">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <DollarSign className="w-3 h-3" />
                Price
              </div>
              <p className="font-medium text-text-primary">${(extractedData.price / 1e6).toFixed(1)}M</p>
            </div>
            <div className="p-3 rounded-lg bg-bg-input">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Maximize2 className="w-3 h-3" />
                Size
              </div>
              <p className="font-medium text-text-primary">{extractedData.size?.toLocaleString()} SF</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-subtle">
            <button className="btn-primary flex items-center gap-2">
              <Check className="w-4 h-4" />
              Add to Listings
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Document
            </button>
          </div>
        </div>
      )}
      
      {/* Tips */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-accent-yellow" />
          Upload Tips
        </h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-accent-green">✓</span>
            Upload Offering Memorandums (PDF) to auto-extract property details
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-green">✓</span>
            Include property photos for better marketing materials
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-green">✓</span>
            Financial statements help with buyer qualification
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-green">✓</span>
            Site plans and surveys are valuable for due diligence
          </li>
        </ul>
      </div>
    </div>
  )
}

export default PropertyUpload
