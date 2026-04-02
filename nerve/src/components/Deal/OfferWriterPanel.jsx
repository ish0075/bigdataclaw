import React, { useState } from 'react'
import { 
  Sparkles, 
  FileText, 
  DollarSign, 
  Calendar, 
  Building2,
  User,
  Download,
  Copy,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'

const OfferWriterPanel = ({ deal, property, onGenerate }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOffer, setGeneratedOffer] = useState(null)
  const [offerParams, setOfferParams] = useState({
    offerPrice: deal?.value || 5000000,
    deposit: 100000,
    closingDays: 60,
    conditions: ['financing', 'inspection'],
    includeLetter: true,
  })
  
  const handleGenerate = async () => {
    setIsGenerating(true)
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const offer = generateOfferText(deal, property, offerParams)
    setGeneratedOffer(offer)
    setIsGenerating(false)
    onGenerate?.(offer)
  }
  
  const generateOfferText = (deal, property, params) => {
    const date = new Date().toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    const offerPrice = params.offerPrice.toLocaleString()
    const deposit = params.deposit.toLocaleString()
    
    return {
      letterOfIntent: `LETTER OF INTENT

Date: ${date}

To: ${deal?.entity || 'Property Owner'}
Re: ${property?.address || 'Property Acquisition'}

Dear Sir/Madam,

We are pleased to submit this non-binding Letter of Intent ("LOI") to acquire the property located at ${property?.address || '[Property Address]'} (the "Property").

1. PURCHASE PRICE
   The proposed purchase price is $${offerPrice} (the "Purchase Price").

2. DEPOSIT
   A refundable deposit of $${deposit} shall be payable upon execution of the Purchase and Sale Agreement.

3. CLOSING DATE
   The transaction shall close within ${params.closingDays} days of the execution of the Purchase and Sale Agreement.

4. CONDITIONS PRECEDENT
   This LOI is subject to the following conditions:
   ${params.conditions.map(c => `   • Satisfactory ${c} review`).join('\n')}

5. DUE DILIGENCE PERIOD
   A due diligence period of 30 days from execution of the Purchase and Sale Agreement.

This LOI represents our sincere interest in acquiring the Property. We look forward to discussing this opportunity further.

Sincerely,
[Your Name]
[Your Title]
`,
      summary: {
        offerPrice: params.offerPrice,
        pricePerSF: property?.size ? (params.offerPrice / property.size).toFixed(2) : 'N/A',
        deposit: params.deposit,
        closingDays: params.closingDays,
        confidence: 87,
      }
    }
  }
  
  const formatCurrency = (value) => {
    if (!value) return '$0'
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
    return `$${value}`
  }
  
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-yellow" />
            AI Offer Writer
          </h3>
          {generatedOffer && (
            <div className="flex items-center gap-2">
              <button 
                className="p-2 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                className="p-2 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {!generatedOffer ? (
        <div className="p-5">
          {/* Offer Parameters */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Offer Price
                </label>
                <input
                  type="number"
                  value={offerParams.offerPrice}
                  onChange={(e) => setOfferParams({...offerParams, offerPrice: Number(e.target.value)})}
                  className="input-field w-full"
                  placeholder="5000000"
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Deposit Amount
                </label>
                <input
                  type="number"
                  value={offerParams.deposit}
                  onChange={(e) => setOfferParams({...offerParams, deposit: Number(e.target.value)})}
                  className="input-field w-full"
                  placeholder="100000"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Closing Timeline (days)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={offerParams.closingDays}
                  onChange={(e) => setOfferParams({...offerParams, closingDays: Number(e.target.value)})}
                  className="flex-1"
                />
                <span className="text-text-primary font-medium w-12">
                  {offerParams.closingDays}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Conditions
              </label>
              <div className="flex flex-wrap gap-2">
                {['financing', 'inspection', 'appraisal', 'environmental'].map((condition) => (
                  <button
                    key={condition}
                    onClick={() => {
                      const newConditions = offerParams.conditions.includes(condition)
                        ? offerParams.conditions.filter(c => c !== condition)
                        : [...offerParams.conditions, condition]
                      setOfferParams({...offerParams, conditions: newConditions})
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      offerParams.conditions.includes(condition)
                        ? 'bg-accent-red text-white'
                        : 'bg-bg-input text-text-secondary hover:bg-bg-card'
                    }`}
                  >
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating Offer...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Offer
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Generated Offer Summary */}
          <div className="p-4 bg-bg-input border-b border-border-subtle">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-text-muted">Offer Price</p>
                <p className="text-lg font-bold text-text-primary">
                  {formatCurrency(generatedOffer.summary.offerPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Price/SF</p>
                <p className="text-lg font-bold text-text-primary">
                  ${generatedOffer.summary.pricePerSF}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">AI Confidence</p>
                <p className="text-lg font-bold text-accent-green">
                  {generatedOffer.summary.confidence}%
                </p>
              </div>
            </div>
          </div>
          
          {/* Generated Text */}
          <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin">
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
              {generatedOffer.letterOfIntent}
            </pre>
          </div>
          
          {/* Actions */}
          <div className="p-4 border-t border-border-subtle flex items-center gap-3">
            <button className="flex-1 btn-primary py-2 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button 
              onClick={() => setGeneratedOffer(null)}
              className="flex-1 btn-secondary py-2 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfferWriterPanel
