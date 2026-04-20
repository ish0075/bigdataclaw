import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Move, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Triangle,
  Download,
  Undo,
  Redo,
  Trash2,
  Copy,
  Layers,
  Palette,
  Grid,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  TextCursor,
  Frame,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Upload,
  Check,
  Maximize2
} from 'lucide-react';

// Default Templates
const DEFAULT_TEMPLATES = {
  luxury: {
    id: 'luxury',
    name: 'Ultra Luxury',
    background: '#1A1A1A',
    elements: [
      { id: 'header', type: 'rectangle', x: 0, y: 0, width: 800, height: 120, fill: '#D4AF37', locked: true },
      { id: 'title', type: 'text', x: 30, y: 30, width: 500, height: 60, text: 'Exclusive Listing', fontSize: 48, fontFamily: 'Playfair Display', fill: '#1A1A1A', fontWeight: 'bold' },
      { id: 'price', type: 'text', x: 550, y: 30, width: 220, height: 60, text: '$2,500,000', fontSize: 42, fontFamily: 'Playfair Display', fill: '#1A1A1A', fontWeight: 'bold', align: 'right' },
      { id: 'hero-image', type: 'image', x: 0, y: 120, width: 800, height: 400, src: null, placeholder: 'Hero Image' },
      { id: 'address', type: 'text', x: 30, y: 540, width: 400, height: 40, text: '123 Sample Street', fontSize: 32, fontFamily: 'Inter', fill: '#FFFFFF' },
      { id: 'city', type: 'text', x: 30, y: 580, width: 300, height: 30, text: 'Toronto, Ontario', fontSize: 20, fontFamily: 'Inter', fill: '#D4AF37' },
      { id: 'stats-bg', type: 'rectangle', x: 0, y: 630, width: 800, height: 100, fill: '#2A2A2A' },
      { id: 'stat1', type: 'text', x: 100, y: 650, width: 100, height: 30, text: '4', fontSize: 36, fontFamily: 'Inter', fill: '#D4AF37', align: 'center' },
      { id: 'stat1-label', type: 'text', x: 100, y: 690, width: 100, height: 20, text: 'Beds', fontSize: 14, fontFamily: 'Inter', fill: '#888888', align: 'center' },
      { id: 'stat2', type: 'text', x: 250, y: 650, width: 100, height: 30, text: '3', fontSize: 36, fontFamily: 'Inter', fill: '#D4AF37', align: 'center' },
      { id: 'stat2-label', type: 'text', x: 250, y: 690, width: 100, height: 20, text: 'Baths', fontSize: 14, fontFamily: 'Inter', fill: '#888888', align: 'center' },
      { id: 'stat3', type: 'text', x: 400, y: 650, width: 100, height: 30, text: '2', fontSize: 36, fontFamily: 'Inter', fill: '#D4AF37', align: 'center' },
      { id: 'stat3-label', type: 'text', x: 400, y: 690, width: 100, height: 20, text: 'Parking', fontSize: 14, fontFamily: 'Inter', fill: '#888888', align: 'center' },
      { id: 'stat4', type: 'text', x: 550, y: 650, width: 150, height: 30, text: '3,500', fontSize: 36, fontFamily: 'Inter', fill: '#D4AF37', align: 'center' },
      { id: 'stat4-label', type: 'text', x: 550, y: 690, width: 150, height: 20, text: 'Sq Ft', fontSize: 14, fontFamily: 'Inter', fill: '#888888', align: 'center' },
      { id: 'desc-title', type: 'text', x: 30, y: 760, width: 300, height: 30, text: 'About This Property', fontSize: 24, fontFamily: 'Playfair Display', fill: '#D4AF37' },
      { id: 'description', type: 'text', x: 30, y: 800, width: 740, height: 100, text: 'This stunning property features exceptional craftsmanship and modern amenities throughout...', fontSize: 16, fontFamily: 'Inter', fill: '#CCCCCC' },
      { id: 'agent-bg', type: 'rectangle', x: 0, y: 920, width: 800, height: 80, fill: '#D4AF37' },
      { id: 'agent-name', type: 'text', x: 30, y: 940, width: 300, height: 30, text: 'Jane Smith', fontSize: 24, fontFamily: 'Inter', fill: '#1A1A1A', fontWeight: 'bold' },
      { id: 'agent-title', type: 'text', x: 30, y: 970, width: 300, height: 20, text: 'Senior Real Estate Advisor', fontSize: 14, fontFamily: 'Inter', fill: '#1A1A1A' },
      { id: 'agent-phone', type: 'text', x: 550, y: 945, width: 220, height: 30, text: '(416) 555-0123', fontSize: 20, fontFamily: 'Inter', fill: '#1A1A1A', align: 'right' },
    ]
  },
  modern: {
    id: 'modern',
    name: 'Modern Minimalist',
    background: '#FFFFFF',
    elements: [
      { id: 'hero-image', type: 'image', x: 0, y: 0, width: 800, height: 500, src: null, placeholder: 'Hero Image' },
      { id: 'overlay', type: 'rectangle', x: 0, y: 400, width: 800, height: 100, fill: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', locked: true },
      { id: 'price', type: 'text', x: 30, y: 420, width: 300, height: 60, text: '$2,500,000', fontSize: 56, fontFamily: 'Inter', fill: '#FFFFFF', fontWeight: 'bold' },
      { id: 'address', type: 'text', x: 30, y: 520, width: 500, height: 40, text: '123 Sample Street', fontSize: 36, fontFamily: 'Inter', fill: '#1A1A1A', fontWeight: 'bold' },
      { id: 'city', type: 'text', x: 30, y: 560, width: 300, height: 24, text: 'Toronto, Ontario', fontSize: 18, fontFamily: 'Inter', fill: '#666666' },
      { id: 'line', type: 'rectangle', x: 30, y: 600, width: 100, height: 4, fill: '#2563EB' },
      { id: 'stats-row', type: 'rectangle', x: 0, y: 640, width: 800, height: 80, fill: '#F8FAFC' },
      { id: 'stat1', type: 'text', x: 100, y: 655, width: 100, height: 40, text: '4', fontSize: 32, fontFamily: 'Inter', fill: '#2563EB', align: 'center', fontWeight: 'bold' },
      { id: 'stat1-label', type: 'text', x: 100, y: 695, width: 100, height: 20, text: 'Bedrooms', fontSize: 12, fontFamily: 'Inter', fill: '#666666', align: 'center' },
      { id: 'stat2', type: 'text', x: 250, y: 655, width: 100, height: 40, text: '3', fontSize: 32, fontFamily: 'Inter', fill: '#2563EB', align: 'center', fontWeight: 'bold' },
      { id: 'stat2-label', type: 'text', x: 250, y: 695, width: 100, height: 20, text: 'Bathrooms', fontSize: 12, fontFamily: 'Inter', fill: '#666666', align: 'center' },
      { id: 'stat3', type: 'text', x: 400, y: 655, width: 100, height: 40, text: '2', fontSize: 32, fontFamily: 'Inter', fill: '#2563EB', align: 'center', fontWeight: 'bold' },
      { id: 'stat3-label', type: 'text', x: 400, y: 695, width: 100, height: 20, text: 'Parking', fontSize: 12, fontFamily: 'Inter', fill: '#666666', align: 'center' },
      { id: 'stat4', type: 'text', x: 550, y: 655, width: 150, height: 40, text: '3,500', fontSize: 32, fontFamily: 'Inter', fill: '#2563EB', align: 'center', fontWeight: 'bold' },
      { id: 'stat4-label', type: 'text', x: 550, y: 695, width: 150, height: 20, text: 'Square Feet', fontSize: 12, fontFamily: 'Inter', fill: '#666666', align: 'center' },
      { id: 'desc-title', type: 'text', x: 30, y: 760, width: 300, height: 30, text: 'Property Description', fontSize: 20, fontFamily: 'Inter', fill: '#1A1A1A', fontWeight: 'bold' },
      { id: 'description', type: 'text', x: 30, y: 800, width: 740, height: 80, text: 'Exceptional modern living with floor-to-ceiling windows, open concept design, and premium finishes throughout...', fontSize: 14, fontFamily: 'Inter', fill: '#4A5568' },
      { id: 'agent-bar', type: 'rectangle', x: 0, y: 900, width: 800, height: 100, fill: '#1A1A1A' },
      { id: 'agent-name', type: 'text', x: 30, y: 925, width: 300, height: 30, text: 'Jane Smith', fontSize: 22, fontFamily: 'Inter', fill: '#FFFFFF', fontWeight: 'bold' },
      { id: 'agent-title', type: 'text', x: 30, y: 955, width: 300, height: 20, text: 'Real Estate Professional', fontSize: 13, fontFamily: 'Inter', fill: '#888888' },
      { id: 'agent-phone', type: 'text', x: 550, y: 935, width: 220, height: 30, text: '(416) 555-0123', fontSize: 18, fontFamily: 'Inter', fill: '#FFFFFF', align: 'right' },
    ]
  },
  clean: {
    id: 'clean',
    name: 'Clean & Simple',
    background: '#FAFAFA',
    elements: [
      { id: 'main-image', type: 'image', x: 50, y: 50, width: 700, height: 400, src: null, placeholder: 'Main Property Image', borderRadius: 8 },
      { id: 'address', type: 'text', x: 50, y: 480, width: 500, height: 40, text: '123 Sample Street, Toronto', fontSize: 28, fontFamily: 'Inter', fill: '#1A1A1A', fontWeight: '600' },
      { id: 'price', type: 'text', x: 50, y: 520, width: 300, height: 50, text: '$2,500,000', fontSize: 42, fontFamily: 'Inter', fill: '#059669', fontWeight: 'bold' },
      { id: 'type', type: 'text', x: 50, y: 570, width: 200, height: 24, text: 'Single Family Home', fontSize: 16, fontFamily: 'Inter', fill: '#6B7280' },
      { id: 'divider', type: 'rectangle', x: 50, y: 610, width: 700, height: 1, fill: '#E5E7EB' },
      { id: 'features-title', type: 'text', x: 50, y: 630, width: 200, height: 24, text: 'Key Features', fontSize: 18, fontFamily: 'Inter', fill: '#1A1A1A', fontWeight: '600' },
      { id: 'feature1', type: 'text', x: 50, y: 665, width: 150, height: 30, text: '4 Beds', fontSize: 20, fontFamily: 'Inter', fill: '#374151' },
      { id: 'feature2', type: 'text', x: 200, y: 665, width: 150, height: 30, text: '3 Baths', fontSize: 20, fontFamily: 'Inter', fill: '#374151' },
      { id: 'feature3', type: 'text', x: 350, y: 665, width: 150, height: 30, text: '2 Parking', fontSize: 20, fontFamily: 'Inter', fill: '#374151' },
      { id: 'feature4', type: 'text', x: 500, y: 665, width: 200, height: 30, text: '3,500 sqft', fontSize: 20, fontFamily: 'Inter', fill: '#374151' },
      { id: 'desc', type: 'text', x: 50, y: 720, width: 700, height: 100, text: 'Beautiful property in prime location. Recently renovated with modern amenities and stunning views.', fontSize: 15, fontFamily: 'Inter', fill: '#4B5563', lineHeight: 1.6 },
      { id: 'contact-box', type: 'rectangle', x: 50, y: 840, width: 700, height: 80, fill: '#FFFFFF', borderRadius: 8, border: '2px solid #E5E7EB' },
      { id: 'agent-label', type: 'text', x: 70, y: 860, width: 150, height: 20, text: 'Listed by', fontSize: 12, fontFamily: 'Inter', fill: '#6B7280' },
      { id: 'agent-name', type: 'text', x: 70, y: 880, width: 250, height: 28, text: 'Jane Smith', fontSize: 20, fontFamily: 'Inter', fill: '#1A1A1A', fontWeight: '600' },
      { id: 'agent-contact', type: 'text', x: 450, y: 875, width: 280, height: 24, text: '(416) 555-0123', fontSize: 18, fontFamily: 'Inter', fill: '#059669', align: 'right' },
    ]
  }
};

// Tool Panel Component
const ToolPanel = ({ activeTool, setActiveTool, onAddElement, onUndo, onRedo, canUndo, canRedo }) => {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
  ];

  return (
    <div className="w-16 bg-bg-card border-r border-border-subtle flex flex-col items-center py-4 gap-2">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => {
            setActiveTool(tool.id);
            if (tool.id !== 'select') {
              onAddElement(tool.id);
            }
          }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeTool === tool.id
              ? 'bg-accent-coral text-white'
              : 'text-text-secondary hover:bg-bg-input hover:text-text-primary'
          }`}
          title={tool.label}
        >
          <tool.icon className="w-5 h-5" />
        </button>
      ))}
      
      <div className="w-8 h-px bg-border-subtle my-2" />
      
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-text-secondary hover:bg-bg-input hover:text-text-primary transition-all disabled:opacity-30"
        title="Undo"
      >
        <Undo className="w-5 h-5" />
      </button>
      
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-text-secondary hover:bg-bg-input hover:text-text-primary transition-all disabled:opacity-30"
        title="Redo"
      >
        <Redo className="w-5 h-5" />
      </button>
    </div>
  );
};

// Properties Panel
const PropertiesPanel = ({ selectedElement, onUpdate, onDelete, onDuplicate }) => {
  if (!selectedElement) {
    return (
      <div className="w-80 bg-bg-card border-l border-border-subtle p-6">
        <p className="text-text-secondary text-center">Select an element to edit properties</p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    onUpdate(selectedElement.id, { [field]: value });
  };

  return (
    <div className="w-80 bg-bg-card border-l border-border-subtle overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <h3 className="font-semibold capitalize">{selectedElement.type} Properties</h3>
        <div className="flex gap-1">
          <button
            onClick={() => onDuplicate(selectedElement.id)}
            className="p-2 hover:bg-bg-input rounded-lg text-text-secondary"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(selectedElement.id)}
            className="p-2 hover:bg-accent-red/20 rounded-lg text-accent-red"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Position & Size */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Position & Size</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => handleChange('x', parseInt(e.target.value))}
                className="w-full px-2 py-1 bg-bg-input border border-border-subtle rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => handleChange('y', parseInt(e.target.value))}
                className="w-full px-2 py-1 bg-bg-input border border-border-subtle rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Width</label>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => handleChange('width', parseInt(e.target.value))}
                className="w-full px-2 py-1 bg-bg-input border border-border-subtle rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Height</label>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                className="w-full px-2 py-1 bg-bg-input border border-border-subtle rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {selectedElement.type === 'text' && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Text</h4>
            <textarea
              value={selectedElement.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm mb-3"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary">Font Size</label>
                <input
                  type="number"
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                  className="w-full px-2 py-1 bg-bg-input border border-border-subtle rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary">Font Family</label>
                <select
                  value={selectedElement.fontFamily || 'Inter'}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="w-full px-2 py-1 bg-bg-input border border-border-subtle rounded text-sm"
                >
                  <option>Inter</option>
                  <option>Playfair Display</option>
                  <option>Georgia</option>
                  <option>Helvetica</option>
                  <option>Arial</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleChange('fontWeight', selectedElement.fontWeight === 'bold' ? 'normal' : 'bold')}
                className={`p-2 rounded ${selectedElement.fontWeight === 'bold' ? 'bg-accent-coral text-white' : 'bg-bg-input'}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleChange('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')}
                className={`p-2 rounded ${selectedElement.fontStyle === 'italic' ? 'bg-accent-coral text-white' : 'bg-bg-input'}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleChange('textDecoration', selectedElement.textDecoration === 'underline' ? 'none' : 'underline')}
                className={`p-2 rounded ${selectedElement.textDecoration === 'underline' ? 'bg-accent-coral text-white' : 'bg-bg-input'}`}
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleChange('align', 'left')}
                className={`p-2 rounded flex-1 ${selectedElement.align === 'left' ? 'bg-accent-coral text-white' : 'bg-bg-input'}`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleChange('align', 'center')}
                className={`p-2 rounded flex-1 ${selectedElement.align === 'center' ? 'bg-accent-coral text-white' : 'bg-bg-input'}`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleChange('align', 'right')}
                className={`p-2 rounded flex-1 ${selectedElement.align === 'right' ? 'bg-accent-coral text-white' : 'bg-bg-input'}`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Colors */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Colors</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-secondary">
                {selectedElement.type === 'text' ? 'Text Color' : 'Fill Color'}
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={selectedElement.fill || '#000000'}
                  onChange={(e) => handleChange('fill', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedElement.fill || '#000000'}
                  onChange={(e) => handleChange('fill', e.target.value)}
                  className="flex-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        {selectedElement.type === 'image' && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Image</h4>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-subtle rounded-xl cursor-pointer hover:border-accent-coral hover:bg-accent-coral/5 transition-all">
              <Upload className="w-8 h-8 text-text-secondary mb-2" />
              <span className="text-sm text-text-secondary">Click to upload image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      handleChange('src', event.target.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
        )}

        {/* Layer Controls */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Layer</h4>
          <div className="flex gap-2">
            <button
              onClick={() => handleChange('locked', !selectedElement.locked)}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${selectedElement.locked ? 'bg-accent-coral text-white' : 'bg-bg-input'}`}
            >
              {selectedElement.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {selectedElement.locked ? 'Locked' : 'Unlocked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Canvas Element
const CanvasElement = ({ element, isSelected, onSelect, onUpdate, canvasScale }) => {
  const elementRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState(null);

  const handleMouseDown = (e) => {
    if (element.locked) return;
    
    e.stopPropagation();
    onSelect(element.id);
    
    const rect = elementRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || element.locked) return;

    const canvas = document.getElementById('design-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    if (resizeHandle) {
      // Resize logic
      const newWidth = Math.max(20, (e.clientX - canvasRect.left) / canvasScale - element.x);
      const newHeight = Math.max(20, (e.clientY - canvasRect.top) / canvasScale - element.y);
      onUpdate(element.id, { width: newWidth, height: newHeight });
    } else {
      // Move logic
      const newX = (e.clientX - canvasRect.left) / canvasScale - dragStart.x;
      const newY = (e.clientY - canvasRect.top) / canvasScale - dragStart.y;
      onUpdate(element.id, { x: newX, y: newY });
    }
  }, [isDragging, resizeHandle, element, dragStart, canvasScale, onUpdate]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizeHandle(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: `${element.fontSize}px`,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              color: element.fill,
              textAlign: element.align || 'left',
              lineHeight: element.lineHeight || 1.4,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {element.text}
          </div>
        );
      
      case 'image':
        return element.src ? (
          <img
            src={element.src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: `${element.borderRadius || 0}px`,
            }}
          />
        ) : (
          <div className="w-full h-full bg-bg-input flex flex-col items-center justify-center text-text-secondary">
            <ImageIcon className="w-12 h-12 mb-2" />
            <span className="text-sm">{element.placeholder || 'Drop image here'}</span>
          </div>
        );
      
      case 'rectangle':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: element.fill,
              borderRadius: `${element.borderRadius || 0}px`,
              border: element.border,
            }}
          />
        );
      
      case 'circle':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: element.fill,
              borderRadius: '50%',
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        cursor: element.locked ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
        border: isSelected ? '2px solid #FF6B6B' : 'none',
        zIndex: element.locked ? 0 : 1,
        opacity: element.locked ? 0.7 : 1,
      }}
    >
      {renderContent()}
      
      {/* Selection handles */}
      {isSelected && !element.locked && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-accent-coral rounded-full" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-coral rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-accent-coral rounded-full" />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent-coral rounded-full cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setResizeHandle('se');
              setIsDragging(true);
            }}
          />
        </>
      )}
    </div>
  );
};

// Main Canva Editor Component
export default function CanvaEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATES.luxury);
  const [elements, setElements] = useState(DEFAULT_TEMPLATES.luxury.elements);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [canvasScale, setCanvasScale] = useState(0.75);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState([DEFAULT_TEMPLATES.luxury.elements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Add to history
  const addToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Update element
  const updateElement = (id, updates) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    addToHistory(newElements);
  };

  // Add new element
  const addElement = (type) => {
    const newElement = {
      id: `el-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 150,
      fill: type === 'text' ? '#FFFFFF' : '#FF6B6B',
      ...(type === 'text' && {
        text: 'Double click to edit',
        fontSize: 24,
        fontFamily: 'Inter',
      }),
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    addToHistory(newElements);
    setSelectedId(newElement.id);
  };

  // Delete element
  const deleteElement = (id) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    addToHistory(newElements);
    setSelectedId(null);
  };

  // Duplicate element
  const duplicateElement = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: `el-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      addToHistory(newElements);
      setSelectedId(newElement.id);
    }
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Change template
  const changeTemplate = (templateKey) => {
    const template = DEFAULT_TEMPLATES[templateKey];
    setSelectedTemplate(template);
    setElements(template.elements);
    addToHistory(template.elements);
    setSelectedId(null);
  };

  // Export
  const exportDesign = () => {
    const canvas = document.getElementById('design-canvas');
    // In a real implementation, use html2canvas to export
    alert('Export functionality would capture the canvas as PNG/PDF');
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="bg-bg-primary flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <header className="h-14 bg-bg-card border-b border-border-subtle flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">Canva-Style Editor</h1>
          
          {/* Template Selector */}
          <select
            value={selectedTemplate.id}
            onChange={(e) => changeTemplate(e.target.value)}
            className="px-3 py-1.5 bg-bg-input border border-border-subtle rounded-lg text-sm"
          >
            {Object.values(DEFAULT_TEMPLATES).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <button
            onClick={() => setCanvasScale(s => Math.max(0.3, s - 0.1))}
            className="p-2 hover:bg-bg-input rounded-lg"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-text-secondary w-16 text-center">
            {Math.round(canvasScale * 100)}%
          </span>
          <button
            onClick={() => setCanvasScale(s => Math.min(1.5, s + 0.1))}
            className="p-2 hover:bg-bg-input rounded-lg"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-border-subtle" />
          
          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg ${showGrid ? 'bg-accent-coral text-white' : 'hover:bg-bg-input'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          
          {/* Export */}
          <button
            onClick={exportDesign}
            className="flex items-center gap-2 px-4 py-2 bg-accent-coral text-white rounded-lg hover:bg-accent-coral/90"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tools */}
        <ToolPanel
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onAddElement={addElement}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />

        {/* Canvas Area */}
        <div className="flex-1 bg-bg-primary overflow-auto flex items-center justify-center p-4">
          <div
            id="design-canvas"
            className="relative shadow-2xl"
            style={{
              width: 800,
              height: 1000,
              background: selectedTemplate.background,
              transform: `scale(${canvasScale})`,
              transformOrigin: 'center center',
              margin: `${(1 - canvasScale) * 500}px`,
              backgroundImage: showGrid ? `
                linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
              ` : 'none',
              backgroundSize: '20px 20px',
            }}
            onClick={() => setSelectedId(null)}
          >
            {elements.map(element => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={element.id === selectedId}
                onSelect={setSelectedId}
                onUpdate={updateElement}
                canvasScale={canvasScale}
              />
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <PropertiesPanel
          selectedElement={selectedElement}
          onUpdate={updateElement}
          onDelete={deleteElement}
          onDuplicate={duplicateElement}
        />
      </div>
    </div>
  );
}
