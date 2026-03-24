import { useState, createElement } from 'react';
import { 
  Upload, 
  MapPin, 
  Building2, 
  Zap, 
  FileText, 
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';

// Form Section Component
function FormSection({ title, icon, children }) {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        {createElement(icon, { size: 18, className: 'text-coral' })}
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Input Field Component
function InputField({ label, type = 'text', placeholder, value, onChange, required }) {
  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1.5">
        {label}
        {required && <span className="text-coral ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-coral/50"
      />
    </div>
  );
}

// Select Field Component
function SelectField({ label, options, value, onChange, required }) {
  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1.5">
        {label}
        {required && <span className="text-coral ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-coral/50"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// File Upload Zone
function FileUploadZone({ label, accept, icon, onFiles }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
    onFiles?.(droppedFiles);
  };
  
  const handleInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    onFiles?.(selectedFiles);
  };
  
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-coral bg-coral/5' 
            : 'border-border hover:border-border-hover'
        }`}
      >
        {createElement(icon, { size: 32, className: 'text-gray-500 mx-auto mb-2' })}
        <p className="text-sm text-gray-400 mb-1">
          Drag and drop files here, or{' '}
          <label className="text-coral cursor-pointer hover:underline">
            browse
            <input 
              type="file" 
              accept={accept} 
              multiple 
              className="hidden"
              onChange={handleInputChange}
            />
          </label>
        </p>
        <p className="text-xs text-gray-600">Supported: {accept}</p>
      </div>
      
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-background-tertiary rounded-lg px-3 py-2">
              <span className="text-sm text-gray-300 truncate flex-1">{file.name}</span>
              <button 
                onClick={() => removeFile(idx)}
                className="p-1 text-gray-500 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Progress Tracker
function ProgressTracker({ currentStep }) {
  const steps = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Documents' },
    { id: 4, label: 'Review' }
  ];
  
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step.id <= currentStep 
              ? 'bg-coral text-white' 
              : 'bg-background-tertiary text-gray-500'
          }`}>
            {step.id < currentStep ? <Check size={16} /> : step.id}
          </div>
          <span className={`ml-2 text-sm ${
            step.id <= currentStep ? 'text-white' : 'text-gray-500'
          }`}>
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-4 ${
              step.id < currentStep ? 'bg-coral' : 'bg-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Main Property Upload View
export default function PropertyUploadView() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    province: 'ON',
    postalCode: '',
    propertyType: 'industrial',
    price: '',
    lotSize: '',
    buildingSize: '',
    zoning: '',
    yearBuilt: '',
    powerAmps: '',
    powerPhase: '3',
    ceilingHeight: '',
    loadingDocks: '',
    driveInDoors: '',
    description: ''
  });
  
  const propertyTypes = [
    { value: 'industrial', label: 'Industrial' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'retail', label: 'Retail' },
    { value: 'office', label: 'Office' },
    { value: 'mixed_use', label: 'Mixed Use' },
    { value: 'land', label: 'Land' }
  ];
  
  const zoningOptions = [
    { value: '', label: 'Select Zoning' },
    { value: 'M1', label: 'M1 - Light Industrial' },
    { value: 'M2', label: 'M2 - General Industrial' },
    { value: 'M3', label: 'M3 - Heavy Industrial' },
    { value: 'C1', label: 'C1 - Local Commercial' },
    { value: 'C2', label: 'C2 - General Commercial' },
    { value: 'C3', label: 'C3 - Highway Commercial' },
    { value: 'MU', label: 'MU - Mixed Use' },
    { value: 'A1', label: 'A1 - Agricultural' }
  ];
  
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = () => {
    alert('Property submitted successfully! (Demo)');
  };
  
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Upload size={20} className="text-coral" />
          <h1 className="text-2xl font-bold text-white">Property Intake</h1>
        </div>
        <p className="text-gray-500 text-sm">Add a new property to your portfolio</p>
      </div>
      
      {/* Progress */}
      <ProgressTracker currentStep={step} />
      
      {/* Form Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Location Section */}
        <FormSection title="Location" icon={MapPin}>
          <InputField 
            label="Street Address" 
            placeholder="123 Main Street"
            value={formData.address}
            onChange={(v) => updateField('address', v)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="City" 
              placeholder="Welland"
              value={formData.city}
              onChange={(v) => updateField('city', v)}
              required
            />
            <InputField 
              label="Postal Code" 
              placeholder="L3C 5W3"
              value={formData.postalCode}
              onChange={(v) => updateField('postalCode', v)}
              required
            />
          </div>
        </FormSection>
        
        {/* Property Details */}
        <FormSection title="Property Details" icon={Building2}>
          <SelectField 
            label="Property Type"
            options={propertyTypes}
            value={formData.propertyType}
            onChange={(v) => updateField('propertyType', v)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="Asking Price" 
              type="number"
              placeholder="2500000"
              value={formData.price}
              onChange={(v) => updateField('price', v)}
              required
            />
            <InputField 
              label="Year Built" 
              type="number"
              placeholder="2005"
              value={formData.yearBuilt}
              onChange={(v) => updateField('yearBuilt', v)}
            />
          </div>
          <SelectField 
            label="Zoning Classification"
            options={zoningOptions}
            value={formData.zoning}
            onChange={(v) => updateField('zoning', v)}
          />
        </FormSection>
        
        {/* Size & Dimensions */}
        <FormSection title="Size & Dimensions" icon={Building2}>
          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="Lot Size (sq ft)" 
              type="number"
              placeholder="65000"
              value={formData.lotSize}
              onChange={(v) => updateField('lotSize', v)}
            />
            <InputField 
              label="Building Size (sq ft)" 
              type="number"
              placeholder="45000"
              value={formData.buildingSize}
              onChange={(v) => updateField('buildingSize', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="Ceiling Height (ft)" 
              type="number"
              placeholder="24"
              value={formData.ceilingHeight}
              onChange={(v) => updateField('ceilingHeight', v)}
            />
            <InputField 
              label="Loading Docks" 
              type="number"
              placeholder="2"
              value={formData.loadingDocks}
              onChange={(v) => updateField('loadingDocks', v)}
            />
          </div>
        </FormSection>
        
        {/* Power Infrastructure */}
        <FormSection title="Power Infrastructure" icon={Zap}>
          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="Power (Amps)" 
              type="number"
              placeholder="800"
              value={formData.powerAmps}
              onChange={(v) => updateField('powerAmps', v)}
            />
            <SelectField 
              label="Phase"
              options={[
                { value: '1', label: 'Single Phase' },
                { value: '3', label: 'Three Phase' }
              ]}
              value={formData.powerPhase}
              onChange={(v) => updateField('powerPhase', v)}
            />
          </div>
          <InputField 
            label="Drive-In Doors" 
            type="number"
            placeholder="1"
            value={formData.driveInDoors}
            onChange={(v) => updateField('driveInDoors', v)}
          />
        </FormSection>
      </div>
      
      {/* Documents Upload */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <FileUploadZone 
          label="Property Photos"
          accept=".jpg,.jpeg,.png,.webp"
          icon={ImageIcon}
        />
        <FileUploadZone 
          label="Documents (Specs, Surveys, etc.)"
          accept=".pdf,.doc,.docx"
          icon={FileText}
        />
      </div>
      
      {/* Description */}
      <div className="mt-6">
        <label className="block text-sm text-gray-400 mb-1.5">Property Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Describe the property, its features, and any special considerations..."
          rows={4}
          className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-coral/50 resize-none"
        />
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
        <button 
          className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Back
        </button>
        {step < 4 ? (
          <button 
            className="px-6 py-2.5 bg-coral text-white rounded-lg text-sm font-medium hover:bg-coral-light transition-colors"
            onClick={() => setStep(step + 1)}
          >
            Continue
          </button>
        ) : (
          <button 
            className="px-6 py-2.5 bg-coral text-white rounded-lg text-sm font-medium hover:bg-coral-light transition-colors"
            onClick={handleSubmit}
          >
            Submit Property
          </button>
        )}
      </div>
    </div>
  );
}
