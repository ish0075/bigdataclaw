import { useState, useRef } from 'react';
import { 
  Camera, 
  FileText, 
  Share2, 
  Download, 
  Palette, 
  Layout, 
  Image as ImageIcon,
  Video,
  Instagram,
  Linkedin,
  Facebook,
  Mail,
  Copy,
  Check,
  Sparkles,
  Building2,
  MapPin,
  DollarSign,
  Maximize2,
  BedDouble,
  Bath,
  Car,
  Calendar,
  User,
  Phone,
  Mail as MailIcon,
  Globe,
  Lock,
  Unlock,
  Eye,
  FileUp,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  RefreshCw,
  Wand2,
  Layers,
  PanelLeft,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

// Premium Templates
const TEMPLATES = {
  luxury: {
    id: 'luxury',
    name: 'Ultra Luxury',
    description: 'Elegant gold & black premium design',
    primary: '#D4AF37',
    secondary: '#1A1A1A',
    accent: '#FFFFFF',
    font: 'Playfair Display',
    price: '$299'
  },
  modern: {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Clean lines with bold typography',
    primary: '#2563EB',
    secondary: '#F8FAFC',
    accent: '#0F172A',
    font: 'Inter',
    price: '$199'
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Executive',
    description: 'Professional blue & white business style',
    primary: '#1E40AF',
    secondary: '#FFFFFF',
    accent: '#64748B',
    font: 'Helvetica Neue',
    price: '$249'
  },
  boutique: {
    id: 'boutique',
    name: 'Boutique Creative',
    description: 'Warm tones with artistic flair',
    primary: '#EA580C',
    secondary: '#FEF7ED',
    accent: '#431407',
    font: 'Georgia',
    price: '$179'
  },
  tech: {
    id: 'tech',
    name: 'Tech Forward',
    description: 'Futuristic with gradient accents',
    primary: '#8B5CF6',
    secondary: '#0F0F0F',
    accent: '#22D3EE',
    font: 'SF Pro Display',
    price: '$229'
  }
};

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', maxChars: 2200 },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', maxChars: 3000 },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2', maxChars: 63206 },
  { id: 'email', name: 'Email Blast', icon: Mail, color: '#EA4335', maxChars: 10000 }
];

const FEATURE_HIGHLIGHTS = [
  'Grand entrance with 20ft ceilings',
  'Chef-inspired gourmet kitchen',
  'Primary suite with spa bathroom',
  'Smart home automation throughout',
  'Infinity edge pool with cabana',
  'Wine cellar with tasting room',
  'Home theater with 4K projection',
  'Rooftop terrace with city views',
  'Private elevator access',
  'Climate-controlled 4-car garage'
];

export default function OlenaFeatureSheet() {
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES.luxury);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDataRoom, setShowDataRoom] = useState(false);
  
  // Listing Data
  const [listing, setListing] = useState({
    address: '',
    city: '',
    province: 'Ontario',
    price: '',
    propertyType: 'Single Family',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    sqft: '',
    lotSize: '',
    yearBuilt: '',
    description: '',
    highlights: [],
    agentName: '',
    agentTitle: '',
    agentPhone: '',
    agentEmail: '',
    agentPhoto: null,
    brokerage: '',
    logo: null,
    photos: [],
    virtualTour: '',
    floorPlan: null,
    video: null
  });

  const [socialPosts, setSocialPosts] = useState({});
  const [dataRoomFiles, setDataRoomFiles] = useState([]);
  const [dataRoomAccess, setDataRoomAccess] = useState('public');
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      caption: ''
    }));
    setListing(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos].slice(0, 25) }));
  };

  const removePhoto = (id) => {
    setListing(prev => ({ 
      ...prev, 
      photos: prev.photos.filter(p => p.id !== id) 
    }));
  };

  const generateSocialPosts = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(r => setTimeout(r, 2000));
    
    const posts = {};
    SOCIAL_PLATFORMS.forEach(platform => {
      posts[platform.id] = generatePostForPlatform(platform.id);
    });
    
    setSocialPosts(posts);
    setIsGenerating(false);
    setActiveTab('social');
  };

  const generatePostForPlatform = (platformId) => {
    const address = listing.address || 'Stunning Property';
    const price = listing.price ? `$${Number(listing.price).toLocaleString()}` : 'Contact for Price';
    const beds = listing.bedrooms || '—';
    const baths = listing.bathrooms || '—';
    const sqft = listing.sqft ? `${Number(listing.sqft).toLocaleString()} sqft` : '';
    
    const templates = {
      instagram: `✨ JUST LISTED ✨

${address}
${listing.city || ''}

💰 ${price}
🛏️ ${beds} Beds | 🛁 ${baths} Baths
📐 ${sqft}

${listing.description?.substring(0, 150) || 'Exceptional property in prime location...'}

🏆 Listed by ${listing.agentName || 'Our Team'}
📞 ${listing.agentPhone || 'Contact us today!'}

#JustListed #RealEstate #LuxuryHomes #${listing.city?.replace(' ', '') || 'RealEstate'} #DreamHome #PropertyForSale`,
      
      linkedin: `🏢 NEW LISTING: ${address}

We're proud to present this exceptional ${listing.propertyType?.toLowerCase()} in ${listing.city}.

Key Features:
• ${beds} Bedrooms | ${baths} Bathrooms
• ${sqft} of living space
• ${listing.highlights.slice(0, 3).join('\n• ')}

${listing.description?.substring(0, 200) || ''}

💼 ${price}

Contact ${listing.agentName || 'our team'} for a private viewing:
📧 ${listing.agentEmail}
📞 ${listing.agentPhone}

#CommercialRealEstate #InvestmentProperty #RealEstate`,
      
      facebook: `🎉 NEW TO MARKET! 🎉

${address}, ${listing.city}

This stunning ${listing.propertyType?.toLowerCase()} is now available!

✨ Price: ${price}
🛏️ ${beds} Bedrooms
🛁 ${baths} Bathrooms
📐 ${sqft}

${listing.description?.substring(0, 300) || 'Don\'t miss this opportunity!'}

📞 Call ${listing.agentPhone || 'us today'} to schedule a viewing!

${listing.virtualTour ? `🎥 Virtual Tour: ${listing.virtualTour}` : ''}`,
      
      email: `Subject: Exclusive New Listing - ${address}

Dear Valued Client,

We're excited to share our newest listing with you:

${address}
${listing.city}, ${listing.province}

OFFERED AT: ${price}

PROPERTY HIGHLIGHTS:
• ${beds} Bedrooms | ${baths} Bathrooms
• ${sqft}
• ${listing.highlights.slice(0, 5).join('\n• ')}

${listing.description}

Contact ${listing.agentName} today:
📞 ${listing.agentPhone}
📧 ${listing.agentEmail}

View full details: [DATAROOM LINK]

Best regards,
${listing.brokerage}`
    };
    
    return templates[platformId] || templates.instagram;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="h-16 bg-bg-card border-b border-border-subtle flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-coral to-accent-coral/60 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Olena Feature Sheets</h1>
            <p className="text-xs text-text-secondary">Professional Marketing Suite</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Preview Mode Toggle */}
          <div className="flex items-center bg-bg-input rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-bg-card shadow-sm' : 'hover:text-text-primary'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded-md transition-all ${previewMode === 'tablet' ? 'bg-bg-card shadow-sm' : 'hover:text-text-primary'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-bg-card shadow-sm' : 'hover:text-text-primary'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
          
          {/* Action Buttons */}
          <button
            onClick={generateSocialPosts}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-accent-coral hover:bg-accent-coral/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'AI Generate All'}
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-input hover:bg-border-subtle rounded-lg font-medium transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Editor */}
        <div className="w-96 bg-bg-card border-r border-border-subtle overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-border-subtle">
            {['editor', 'templates', 'social', 'dataroom'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-all border-b-2 ${
                  activeTab === tab 
                    ? 'border-accent-coral text-accent-coral' 
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab === 'dataroom' ? 'Data Room' : tab}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6">
            {activeTab === 'editor' && (
              <>
                {/* Property Details */}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Property Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Address</label>
                      <input
                        type="text"
                        value={listing.address}
                        onChange={(e) => setListing(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Main Street"
                        className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">City</label>
                        <input
                          type="text"
                          value={listing.city}
                          onChange={(e) => setListing(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Toronto"
                          className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Province</label>
                        <select
                          value={listing.province}
                          onChange={(e) => setListing(prev => ({ ...prev, province: e.target.value }))}
                          className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                        >
                          <option>Ontario</option>
                          <option>British Columbia</option>
                          <option>Alberta</option>
                          <option>Quebec</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Price</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                          type="number"
                          value={listing.price}
                          onChange={(e) => setListing(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="2500000"
                          className="w-full pl-10 pr-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Beds</label>
                        <div className="relative">
                          <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                          <input
                            type="number"
                            value={listing.bedrooms}
                            onChange={(e) => setListing(prev => ({ ...prev, bedrooms: e.target.value }))}
                            placeholder="4"
                            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Baths</label>
                        <div className="relative">
                          <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                          <input
                            type="number"
                            value={listing.bathrooms}
                            onChange={(e) => setListing(prev => ({ ...prev, bathrooms: e.target.value }))}
                            placeholder="3"
                            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Parking</label>
                        <div className="relative">
                          <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                          <input
                            type="number"
                            value={listing.parking}
                            onChange={(e) => setListing(prev => ({ ...prev, parking: e.target.value }))}
                            placeholder="2"
                            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Square Feet</label>
                        <div className="relative">
                          <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                          <input
                            type="number"
                            value={listing.sqft}
                            onChange={(e) => setListing(prev => ({ ...prev, sqft: e.target.value }))}
                            placeholder="3500"
                            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Year Built</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                          <input
                            type="number"
                            value={listing.yearBuilt}
                            onChange={(e) => setListing(prev => ({ ...prev, yearBuilt: e.target.value }))}
                            placeholder="2020"
                            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Property Type</label>
                      <select
                        value={listing.propertyType}
                        onChange={(e) => setListing(prev => ({ ...prev, propertyType: e.target.value }))}
                        className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                      >
                        <option>Single Family</option>
                        <option>Condominium</option>
                        <option>Townhouse</option>
                        <option>Commercial</option>
                        <option>Industrial</option>
                        <option>Land</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                      <textarea
                        value={listing.description}
                        onChange={(e) => setListing(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter a compelling property description..."
                        rows={4}
                        className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral resize-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Features & Highlights */}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Key Features
                  </h3>
                  <div className="space-y-2">
                    {FEATURE_HIGHLIGHTS.map((feature, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-input cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={listing.highlights.includes(feature)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setListing(prev => ({ ...prev, highlights: [...prev.highlights, feature] }));
                            } else {
                              setListing(prev => ({ ...prev, highlights: prev.highlights.filter(h => h !== feature) }));
                            }
                          }}
                          className="w-4 h-4 rounded border-border-subtle text-accent-coral focus:ring-accent-coral"
                        />
                        <span className="text-sm">{feature}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Photo Upload */}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photos ({listing.photos.length}/25)
                  </h3>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-border-subtle rounded-xl hover:border-accent-coral hover:bg-accent-coral/5 transition-all flex flex-col items-center gap-2"
                  >
                    <ImageIcon className="w-8 h-8 text-text-secondary" />
                    <span className="text-sm text-text-secondary">Click to upload photos</span>
                    <span className="text-xs text-text-muted">JPG, PNG up to 25MB each</span>
                  </button>

                  {listing.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {listing.photos.map((photo, idx) => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                          <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-accent-coral text-white text-xs rounded">
                              Hero
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Agent Info */}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Agent Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Agent Name</label>
                      <input
                        type="text"
                        value={listing.agentName}
                        onChange={(e) => setListing(prev => ({ ...prev, agentName: e.target.value }))}
                        placeholder="Jane Smith"
                        className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Title</label>
                      <input
                        type="text"
                        value={listing.agentTitle}
                        onChange={(e) => setListing(prev => ({ ...prev, agentTitle: e.target.value }))}
                        placeholder="Senior Real Estate Advisor"
                        className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                          <input
                            type="tel"
                            value={listing.agentPhone}
                            onChange={(e) => setListing(prev => ({ ...prev, agentPhone: e.target.value }))}
                            placeholder="(416) 555-0123"
                            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                        <div className="relative">
                          <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                          <input
                            type="email"
                            value={listing.agentEmail}
                            onChange={(e) => setListing(prev => ({ ...prev, agentEmail: e.target.value }))}
                            placeholder="jane@brokerage.com"
                            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Brokerage</label>
                      <input
                        type="text"
                        value={listing.brokerage}
                        onChange={(e) => setListing(prev => ({ ...prev, brokerage: e.target.value }))}
                        placeholder="Royal LePage"
                        className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-coral"
                      />
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">Select a premium template for your feature sheet</p>
                
                {Object.values(TEMPLATES).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate.id === template.id
                        ? 'border-accent-coral bg-accent-coral/5'
                        : 'border-border-subtle hover:border-accent-coral/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      <span className="text-sm font-medium text-accent-coral">{template.price}</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">{template.description}</p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: template.primary }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: template.secondary }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: template.accent }}
                      />
                      <span className="text-xs text-text-muted ml-2">{template.font}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">AI-generated posts for each platform</p>
                
                {SOCIAL_PLATFORMS.map((platform) => (
                  <div key={platform.id} className="p-4 rounded-xl bg-bg-input">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${platform.color}20` }}
                      >
                        <platform.icon className="w-5 h-5" style={{ color: platform.color }} />
                      </div>
                      <div>
                        <h4 className="font-medium">{platform.name}</h4>
                        <p className="text-xs text-text-secondary">{platform.maxChars.toLocaleString()} characters</p>
                      </div>
                    </div>
                    
                    {socialPosts[platform.id] ? (
                      <div className="relative">
                        <textarea
                          value={socialPosts[platform.id]}
                          readOnly
                          rows={6}
                          className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs resize-none"
                        />
                        <button
                          onClick={() => copyToClipboard(socialPosts[platform.id])}
                          className="absolute top-2 right-2 p-1.5 bg-bg-card rounded-md hover:bg-accent-coral hover:text-white transition-all"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-text-secondary text-sm bg-bg-primary rounded-lg border border-dashed border-border-subtle">
                        Click "AI Generate All" to create posts
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'dataroom' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-bg-input">
                  <div className="flex items-center gap-3">
                    {dataRoomAccess === 'public' ? (
                      <Unlock className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-accent-coral" />
                    )}
                    <div>
                      <h4 className="font-medium">Access Control</h4>
                      <p className="text-xs text-text-secondary">
                        {dataRoomAccess === 'public' ? 'Public link - anyone can view' : 'Private - password protected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDataRoomAccess(dataRoomAccess === 'public' ? 'private' : 'public')}
                    className="text-sm text-accent-coral hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="p-4 rounded-xl border-2 border-dashed border-border-subtle">
                  <h4 className="font-medium mb-3">Upload Documents</h4>
                  <div className="space-y-2">
                    <button className="w-full py-3 px-4 bg-bg-input rounded-lg text-sm text-left hover:bg-border-subtle transition-colors flex items-center gap-3">
                      <FileUp className="w-4 h-4 text-text-secondary" />
                      Offering Memorandum
                    </button>
                    <button className="w-full py-3 px-4 bg-bg-input rounded-lg text-sm text-left hover:bg-border-subtle transition-colors flex items-center gap-3">
                      <FileUp className="w-4 h-4 text-text-secondary" />
                      Financial Statements
                    </button>
                    <button className="w-full py-3 px-4 bg-bg-input rounded-lg text-sm text-left hover:bg-border-subtle transition-colors flex items-center gap-3">
                      <FileUp className="w-4 h-4 text-text-secondary" />
                      Floor Plans
                    </button>
                    <button className="w-full py-3 px-4 bg-bg-input rounded-lg text-sm text-left hover:bg-border-subtle transition-colors flex items-center gap-3">
                      <FileUp className="w-4 h-4 text-text-secondary" />
                      Environmental Reports
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-accent-coral/5 border border-accent-coral/20">
                  <h4 className="font-medium mb-2">Data Room Link</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value="https://bigdataclaw.com/dataroom/abc123"
                      readOnly
                      className="flex-1 px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs"
                    />
                    <button className="p-2 bg-accent-coral text-white rounded-lg hover:bg-accent-coral/90">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="flex-1 bg-bg-primary/50 p-8 overflow-y-auto">
          <div className={`mx-auto transition-all duration-500 ${
            previewMode === 'mobile' ? 'max-w-[375px]' : 
            previewMode === 'tablet' ? 'max-w-[768px]' : 
            'max-w-[1200px]'
          }`}>
            {/* Feature Sheet Preview */}
            <div 
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ 
                backgroundColor: selectedTemplate.secondary,
                color: selectedTemplate.accent
              }}
            >
              {/* Header */}
              <div 
                className="p-8"
                style={{ backgroundColor: selectedTemplate.primary }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80 mb-1">Exclusive Listing</p>
                    <h2 className="text-3xl font-bold">
                      {listing.address || '123 Sample Street'}
                    </h2>
                    <p className="text-lg opacity-90 mt-1">
                      {listing.city || 'Toronto'}, {listing.province}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">
                      {listing.price ? `$${Number(listing.price).toLocaleString()}` : '$2,500,000'}
                    </p>
                    <p className="text-sm opacity-80 mt-1">{listing.propertyType}</p>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative h-[400px] bg-bg-input">
                {listing.photos[0] ? (
                  <img 
                    src={listing.photos[0].preview} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary">
                    <ImageIcon className="w-16 h-16" />
                  </div>
                )}
                
                {/* Photo Strip */}
                {listing.photos.length > 1 && (
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    {listing.photos.slice(1, 5).map((photo, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white/50">
                        <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {listing.photos.length > 5 && (
                      <div className="w-20 h-20 rounded-lg bg-black/60 flex items-center justify-center text-white font-semibold">
                        +{listing.photos.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-4 gap-4 p-8 border-b border-border-subtle">
                <div className="text-center">
                  <BedDouble className="w-6 h-6 mx-auto mb-2" style={{ color: selectedTemplate.primary }} />
                  <p className="text-2xl font-bold">{listing.bedrooms || '4'}</p>
                  <p className="text-sm opacity-60">Bedrooms</p>
                </div>
                <div className="text-center">
                  <Bath className="w-6 h-6 mx-auto mb-2" style={{ color: selectedTemplate.primary }} />
                  <p className="text-2xl font-bold">{listing.bathrooms || '3'}</p>
                  <p className="text-sm opacity-60">Bathrooms</p>
                </div>
                <div className="text-center">
                  <Car className="w-6 h-6 mx-auto mb-2" style={{ color: selectedTemplate.primary }} />
                  <p className="text-2xl font-bold">{listing.parking || '2'}</p>
                  <p className="text-sm opacity-60">Parking</p>
                </div>
                <div className="text-center">
                  <Maximize2 className="w-6 h-6 mx-auto mb-2" style={{ color: selectedTemplate.primary }} />
                  <p className="text-2xl font-bold">{listing.sqft ? `${Number(listing.sqft).toLocaleString()}` : '3,500'}</p>
                  <p className="text-sm opacity-60">Sq Ft</p>
                </div>
              </div>

              {/* Description */}
              <div className="p-8 border-b border-border-subtle">
                <h3 className="text-xl font-semibold mb-4">About This Property</h3>
                <p className="leading-relaxed opacity-80">
                  {listing.description || 'This stunning property features exceptional craftsmanship and modern amenities throughout. The open-concept design seamlessly connects indoor and outdoor living spaces, creating the perfect environment for both entertaining and everyday living.'}
                </p>
              </div>

              {/* Features */}
              {listing.highlights.length > 0 && (
                <div className="p-8 border-b border-border-subtle">
                  <h3 className="text-xl font-semibold mb-4">Key Features</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {listing.highlights.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: selectedTemplate.primary }}
                        />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Info */}
              <div className="p-8" style={{ backgroundColor: selectedTemplate.primary }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{listing.agentName || 'Jane Smith'}</p>
                      <p className="text-sm opacity-80">{listing.agentTitle || 'Senior Real Estate Advisor'}</p>
                      <p className="text-sm opacity-80">{listing.brokerage || 'Royal LePage'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{listing.agentPhone || '(416) 555-0123'}</p>
                    <p className="text-sm opacity-80">{listing.agentEmail || 'jane@brokerage.com'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Controls */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg hover:bg-border-subtle transition-all">
                <Eye className="w-4 h-4" />
                Full Preview
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg hover:bg-border-subtle transition-all">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg hover:bg-border-subtle transition-all">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
