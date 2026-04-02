import React, { useState } from 'react'
import { 
  X, 
  Mail, 
  Phone, 
  Facebook, 
  Instagram, 
  Linkedin, 
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Copy,
  Check
} from 'lucide-react'
import { useResidentialAgentStore } from '../../stores/residentialAgentStore'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  { value: 'contacted', label: 'Contacted', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { value: 'added', label: 'Added', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { value: 'friend', label: 'Friend', color: 'text-green-400', bg: 'bg-green-500/20' },
  { value: 'declined', label: 'Declined', color: 'text-red-400', bg: 'bg-red-500/20' }
]

const NOTE_TYPES = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'text', label: 'Text', icon: MessageCircle },
  { value: 'other', label: 'Other', icon: MessageCircle }
]

const AgentDetailModal = ({ agent, onClose }) => {
  const { updateStatus, addNote, deleteNote, updateAgent, deleteAgent } = useResidentialAgentStore()
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState('other')
  const [isEditing, setIsEditing] = useState(false)
  const [editedAgent, setEditedAgent] = useState(agent)
  const [copiedField, setCopiedField] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const initials = agent.name.split(' ').map(n => n[0]).join('').toUpperCase()
  const currentStatus = STATUS_OPTIONS.find(s => s.value === agent.status)
  
  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(agent.id, newNote.trim(), noteType)
      setNewNote('')
      setNoteType('other')
    }
  }
  
  const handleSaveEdit = () => {
    updateAgent(agent.id, editedAgent)
    setIsEditing(false)
  }
  
  const handleCopy = (field, value) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }
  
  const handleDelete = () => {
    deleteAgent(agent.id)
    onClose()
  }
  
  const getRealtorCaUrl = () => {
    if (agent.realtorCaUrl) return agent.realtorCaUrl
    const searchQuery = encodeURIComponent(`${agent.name} realtor realtor.ca`)
    return `https://www.google.com/search?q=${searchQuery}`
  }
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${currentStatus.bg} ${currentStatus.color} flex items-center justify-center text-2xl font-bold`}>
              {initials}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedAgent.name}
                  onChange={(e) => setEditedAgent({...editedAgent, name: e.target.value})}
                  className="input-field text-lg font-semibold mb-1"
                />
              ) : (
                <h2 className="text-xl font-semibold text-text-primary">{agent.name}</h2>
              )}
              
              {isEditing ? (
                <input
                  type="text"
                  value={editedAgent.brokerage}
                  onChange={(e) => setEditedAgent({...editedAgent, brokerage: e.target.value})}
                  className="input-field text-sm"
                  placeholder="Brokerage"
                />
              ) : (
                <p className="text-text-secondary flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {agent.brokerage}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <button onClick={handleSaveEdit} className="p-2 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green/30">
                <Save className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-2 rounded-lg bg-bg-input hover:bg-bg-card">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg bg-bg-input hover:bg-red-500/20 text-text-secondary hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg bg-bg-input hover:bg-bg-card">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status & Date Info */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={agent.status}
              onChange={(e) => updateStatus(agent.id, e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${currentStatus.bg} ${currentStatus.color} border-current`}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Calendar className="w-4 h-4" />
              Added: {formatDate(agent.dateAdded)}
            </div>
            
            {agent.lastContacted && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <MessageCircle className="w-4 h-4" />
                Last contact: {formatDate(agent.lastContacted)}
              </div>
            )}
          </div>
          
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="p-3 rounded-lg bg-bg-input">
              <label className="text-xs text-text-muted block mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedAgent.email || ''}
                  onChange={(e) => setEditedAgent({...editedAgent, email: e.target.value})}
                  className="input-field w-full text-sm"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <a href={`mailto:${agent.email}`} className="text-sm text-accent-blue hover:underline truncate">
                    {agent.email}
                  </a>
                  <button 
                    onClick={() => handleCopy('email', agent.email)}
                    className="p-1 rounded hover:bg-bg-card ml-2"
                  >
                    {copiedField === 'email' ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
            
            {/* Phone */}
            <div className="p-3 rounded-lg bg-bg-input">
              <label className="text-xs text-text-muted block mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedAgent.phone || ''}
                  onChange={(e) => setEditedAgent({...editedAgent, phone: e.target.value})}
                  className="input-field w-full text-sm"
                />
              ) : (
                <div className="flex items-center justify-between">
                  {agent.phone ? (
                    <>
                      <a href={`tel:${agent.phone}`} className="text-sm text-accent-green hover:underline">
                        {agent.phone}
                      </a>
                      <button 
                        onClick={() => handleCopy('phone', agent.phone)}
                        className="p-1 rounded hover:bg-bg-card ml-2"
                      >
                        {copiedField === 'phone' ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-text-muted">Not provided</span>
                  )}
                </div>
              )}
            </div>
            
            {/* City */}
            <div className="p-3 rounded-lg bg-bg-input">
              <label className="text-xs text-text-muted block mb-1">City</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedAgent.city || ''}
                  onChange={(e) => setEditedAgent({...editedAgent, city: e.target.value})}
                  className="input-field w-full text-sm"
                />
              ) : (
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-text-muted" />
                  {agent.city || 'Not specified'}
                </div>
              )}
            </div>
            
            {/* Realtor.ca Link */}
            <div className="p-3 rounded-lg bg-bg-input">
              <label className="text-xs text-text-muted block mb-1">Realtor.ca</label>
              <a 
                href={getRealtorCaUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-accent-red hover:underline flex items-center gap-1"
              >
                View Profile <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          
          {/* Social Links */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-3">Social Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Facebook */}
              <div className="p-3 rounded-lg bg-bg-input">
                <label className="text-xs text-text-muted block mb-1 flex items-center gap-1">
                  <Facebook className="w-3 h-3" /> Facebook
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editedAgent.facebook || ''}
                    onChange={(e) => setEditedAgent({...editedAgent, facebook: e.target.value})}
                    className="input-field w-full text-sm"
                    placeholder="https://facebook.com/..."
                  />
                ) : agent.facebook ? (
                  <a href={agent.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline truncate block">
                    {agent.facebook.replace('https://', '')}
                  </a>
                ) : (
                  <span className="text-sm text-text-muted">Not provided</span>
                )}
              </div>
              
              {/* Instagram */}
              <div className="p-3 rounded-lg bg-bg-input">
                <label className="text-xs text-text-muted block mb-1 flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> Instagram
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAgent.instagram || ''}
                    onChange={(e) => setEditedAgent({...editedAgent, instagram: e.target.value})}
                    className="input-field w-full text-sm"
                    placeholder="@username"
                  />
                ) : agent.instagram ? (
                  <a 
                    href={`https://instagram.com/${agent.instagram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-pink-400 hover:underline"
                  >
                    {agent.instagram}
                  </a>
                ) : (
                  <span className="text-sm text-text-muted">Not provided</span>
                )}
              </div>
              
              {/* LinkedIn */}
              <div className="p-3 rounded-lg bg-bg-input">
                <label className="text-xs text-text-muted block mb-1 flex items-center gap-1">
                  <Linkedin className="w-3 h-3" /> LinkedIn
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editedAgent.linkedin || ''}
                    onChange={(e) => setEditedAgent({...editedAgent, linkedin: e.target.value})}
                    className="input-field w-full text-sm"
                    placeholder="https://linkedin.com/in/..."
                  />
                ) : agent.linkedin ? (
                  <a href={agent.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate block">
                    View Profile
                  </a>
                ) : (
                  <span className="text-sm text-text-muted">Not provided</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Specialties & Tags */}
          {(agent.specialties?.length > 0 || isEditing) && (
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {agent.specialties?.map((spec, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-accent-purple/20 text-accent-purple text-sm">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Notes Section */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Correspondence History ({agent.notes.length})
            </h3>
            
            {/* Add Note Form */}
            <div className="p-3 rounded-lg bg-bg-input mb-4">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="bg-bg-card border border-border-subtle rounded px-2 py-1 text-xs"
                >
                  {NOTE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about your interaction..."
                  className="flex-1 input-field text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="btn-primary px-3"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Notes List */}
            <div className="space-y-2">
              {agent.notes.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  No notes yet. Add your first interaction above.
                </p>
              ) : (
                agent.notes.map((note) => {
                  const NoteIcon = NOTE_TYPES.find(t => t.value === note.type)?.icon || MessageCircle
                  return (
                    <div key={note.id} className="p-3 rounded-lg bg-bg-input flex items-start gap-3">
                      <div className="p-2 rounded-full bg-bg-card">
                        <NoteIcon className="w-4 h-4 text-text-muted" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-text-secondary capitalize">
                            {note.type}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatDate(note.date)}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary">{note.content}</p>
                      </div>
                      <button 
                        onClick={() => deleteNote(agent.id, note.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-10">
            <div className="card p-6 max-w-sm">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Agent?</h3>
              <p className="text-text-secondary text-sm mb-4">
                This will permanently remove {agent.name} from your database. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 btn-primary bg-red-500 hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentDetailModal
