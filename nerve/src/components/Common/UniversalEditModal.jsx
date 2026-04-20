import React, { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2 } from 'lucide-react'

/**
 * Universal Edit Modal - Works with any entity type
 * Supports dynamic field configuration
 */
const UniversalEditModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  entity = null, 
  entityType = 'generic',
  title = 'Edit'
}) => {
  const [formData, setFormData] = useState({})
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    if (entity) {
      setFormData({ ...entity })
    }
  }, [entity])

  if (!isOpen || !entity) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }))
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  // Field configurations by entity type
  const fieldConfigs = {
    agent: {
      tabs: [
        { id: 'basic', label: 'Basic Info' },
        { id: 'contact', label: 'Contact' },
        { id: 'brokerage', label: 'Brokerage' },
        { id: 'social', label: 'Social Media' },
        { id: 'notes', label: 'Notes' }
      ],
      fields: {
        basic: [
          { name: 'name', label: 'Full Name', type: 'text' },
          { name: 'firstName', label: 'First Name', type: 'text' },
          { name: 'lastName', label: 'Last Name', type: 'text' },
          { name: 'job_title', label: 'Job Title', type: 'text' },
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'license', label: 'License Number', type: 'text' },
        ],
        contact: [
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'mobile', label: 'Mobile', type: 'tel' },
          { name: 'office', label: 'Office Phone', type: 'tel' },
          { name: 'fax', label: 'Fax', type: 'tel' },
        ],
        brokerage: [
          { name: 'brokerage', label: 'Brokerage Name', type: 'text' },
          { name: 'brokerageAddress', label: 'Brokerage Address', type: 'textarea' },
          { name: 'brokeragePhone', label: 'Brokerage Phone', type: 'tel' },
        ],
        social: [
          { name: 'linkedin', label: 'LinkedIn URL', type: 'url', nested: 'socialLinks' },
          { name: 'facebook', label: 'Facebook URL', type: 'url', nested: 'socialLinks' },
          { name: 'instagram', label: 'Instagram URL', type: 'url', nested: 'socialLinks' },
          { name: 'twitter', label: 'Twitter/X URL', type: 'url', nested: 'socialLinks' },
          { name: 'youtube', label: 'YouTube URL', type: 'url', nested: 'socialLinks' },
          { name: 'tiktok', label: 'TikTok URL', type: 'url', nested: 'socialLinks' },
          { name: 'website', label: 'Personal Website', type: 'url' },
        ],
        notes: [
          { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ]
      }
    },
    builder: {
      tabs: [
        { id: 'basic', label: 'Basic Info' },
        { id: 'contact', label: 'Contact' },
        { id: 'details', label: 'Details' },
        { id: 'social', label: 'Social Media' },
        { id: 'notes', label: 'Notes' }
      ],
      fields: {
        basic: [
          { name: 'name', label: 'Company Name', type: 'text' },
          { name: 'legalName', label: 'Legal Name', type: 'text' },
          { name: 'builderNumber', label: 'Builder Number', type: 'text' },
          { name: 'yearsInBusiness', label: 'Years in Business', type: 'number' },
        ],
        contact: [
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'website', label: 'Website', type: 'url' },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'province', label: 'Province', type: 'text' },
          { name: 'postalCode', label: 'Postal Code', type: 'text' },
        ],
        details: [
          { name: 'types', label: 'Builder Types', type: 'text', placeholder: 'e.g., Custom, Semi-custom, Townhomes' },
          { name: 'priceRange', label: 'Price Range', type: 'text', placeholder: 'e.g., $500K - $2M' },
          { name: 'warranty', label: 'Warranty Provider', type: 'text' },
          { name: 'hbcNumber', label: 'HBC/Tarion Number', type: 'text' },
        ],
        social: [
          { name: 'linkedin', label: 'LinkedIn', type: 'url', nested: 'socialLinks' },
          { name: 'facebook', label: 'Facebook', type: 'url', nested: 'socialLinks' },
          { name: 'instagram', label: 'Instagram', type: 'url', nested: 'socialLinks' },
          { name: 'twitter', label: 'Twitter', type: 'url', nested: 'socialLinks' },
          { name: 'livabl', label: 'LIVABL Profile', type: 'url' },
        ],
        notes: [
          { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ]
      }
    },
    buyer: {
      tabs: [
        { id: 'basic', label: 'Basic Info' },
        { id: 'contact', label: 'Contact' },
        { id: 'criteria', label: 'Criteria' },
        { id: 'notes', label: 'Notes' }
      ],
      fields: {
        basic: [
          { name: 'entity', label: 'Company/Entity Name', type: 'text' },
          { name: 'contactName', label: 'Contact Person', type: 'text' },
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'type', label: 'Buyer Type', type: 'select', options: ['Individual', 'Developer', 'Investor', 'REIT', 'Private Equity', 'Builder', 'Other'] },
        ],
        contact: [
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'mobile', label: 'Mobile', type: 'tel' },
          { name: 'address', label: 'Address', type: 'textarea' },
        ],
        criteria: [
          { name: 'assetClass', label: 'Asset Class', type: 'text', placeholder: 'e.g., Retail, Office, Industrial' },
          { name: 'priceRange', label: 'Price Range', type: 'text', placeholder: 'e.g., $1M - $10M' },
          { name: 'locationPreference', label: 'Location Preference', type: 'text' },
          { name: 'timeline', label: 'Purchase Timeline', type: 'text' },
        ],
        notes: [
          { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ]
      }
    },
    lender: {
      tabs: [
        { id: 'basic', label: 'Basic Info' },
        { id: 'contact', label: 'Contact' },
        { id: 'products', label: 'Products' },
        { id: 'notes', label: 'Notes' }
      ],
      fields: {
        basic: [
          { name: 'name', label: 'Lender Name', type: 'text' },
          { name: 'type', label: 'Lender Type', type: 'select', options: ['Bank', 'Credit Union', 'Private', 'Mortgage Investment Corp', 'MIC', 'Individual', 'Other'] },
          { name: 'specialization', label: 'Specialization', type: 'text', placeholder: 'e.g., Commercial, Construction, Land' },
        ],
        contact: [
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'website', label: 'Website', type: 'url' },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'contactPerson', label: 'Primary Contact', type: 'text' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text' },
        ],
        products: [
          { name: 'loanTypes', label: 'Loan Types', type: 'text', placeholder: 'e.g., Construction, Bridge, Term' },
          { name: 'rateRange', label: 'Rate Range', type: 'text', placeholder: 'e.g., Prime + 2-5%' },
          { name: 'ltvMax', label: 'Max LTV', type: 'text' },
          { name: 'minLoan', label: 'Min Loan Amount', type: 'text' },
          { name: 'maxLoan', label: 'Max Loan Amount', type: 'text' },
        ],
        notes: [
          { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ]
      }
    },
    brokerage: {
      tabs: [
        { id: 'basic', label: 'Basic Info' },
        { id: 'contact', label: 'Contact' },
        { id: 'leadership', label: 'Leadership' },
        { id: 'social', label: 'Social Media' },
        { id: 'notes', label: 'Notes' }
      ],
      fields: {
        basic: [
          { name: 'displayName', label: 'Display Name', type: 'text' },
          { name: 'legalName', label: 'Legal Name', type: 'text' },
        ],
        contact: [
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'website', label: 'Website', type: 'url' },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'province', label: 'Province', type: 'text' },
        ],
        leadership: [
          { name: 'brokerOfRecord', label: 'Broker of Record', type: 'text' },
          { name: 'managingBroker', label: 'Managing Broker', type: 'text' },
          { name: 'president', label: 'President/CEO', type: 'text' },
          { name: 'vpSales', label: 'VP of Sales', type: 'text' },
        ],
        social: [
          { name: 'linkedin', label: 'LinkedIn', type: 'url', nested: 'socialLinks' },
          { name: 'facebook', label: 'Facebook', type: 'url', nested: 'socialLinks' },
          { name: 'instagram', label: 'Instagram', type: 'url', nested: 'socialLinks' },
          { name: 'twitter', label: 'Twitter/X', type: 'url', nested: 'socialLinks' },
        ],
        notes: [
          { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ]
      }
    }
  }

  const config = fieldConfigs[entityType] || fieldConfigs.generic || {
    tabs: [{ id: 'basic', label: 'Basic Info' }],
    fields: { basic: [{ name: 'name', label: 'Name', type: 'text' }] }
  }

  const currentFields = config.fields[activeTab] || []

  const renderField = (field) => {
    const value = field.nested 
      ? formData[field.nested]?.[field.name] 
      : formData[field.name]

    const handleFieldChange = (val) => {
      if (field.nested) {
        handleNestedChange(field.nested, field.name, val)
      } else {
        handleChange(field.name, val)
      }
    }

    const baseClasses = "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            rows={field.rows || 3}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={baseClasses}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      default:
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <div className="flex overflow-x-auto">
            {config.tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentFields.map(field => (
              <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                <label className="block text-sm text-slate-400 mb-1">
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default UniversalEditModal
