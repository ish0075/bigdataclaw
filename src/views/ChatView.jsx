import { useState, useRef, useEffect } from 'react';
import logo from '../assets/logo.png';
import { 
  Send, 
  Mic, 
  Square,
  Sparkles,
  Globe,
  Cpu,
  Users,
  Building2,
  Upload,
  Copy,
  Check,
  Loader2,
  Linkedin,
  Mail,
  Phone,
  ExternalLink,
  BookOpen
} from 'lucide-react';

const API_URL = 'http://localhost:9999';

// Typewriter Effect Hook
function useTypewriter(texts, speed = 50, pause = 2000) {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const currentText = texts[textIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setDisplayText(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), pause);
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);
    
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed, pause]);
  
  return displayText;
}

// Match Score Badge
function MatchScoreBadge({ score }) {
  let colorClass = 'bg-gray-500/20 text-gray-400';
  if (score >= 90) colorClass = 'bg-green-500/20 text-green-400';
  else if (score >= 75) colorClass = 'bg-coral/20 text-coral';
  else if (score >= 60) colorClass = 'bg-yellow-500/20 text-yellow-400';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {score}% Match
    </span>
  );
}

// Copy Button Component
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button 
      onClick={handleCopy}
      className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
      title="Copy to clipboard"
    >
      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
    </button>
  );
}

// Match Card Component
function MatchCard({ match }) {
  const typeColors = {
    buyer: 'border-coral/30 bg-coral/5',
    agent: 'border-blue-400/30 bg-blue-400/5',
    lender: 'border-green-400/30 bg-green-400/5'
  };
  
  const typeLabels = {
    buyer: 'Buyer',
    agent: 'Agent',
    lender: 'Lender'
  };
  
  return (
    <div className={`border ${typeColors[match.type] || 'border-gray-700'} rounded-lg p-3 mb-2`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-white text-sm">{match.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${
              match.type === 'buyer' ? 'text-coral' : 
              match.type === 'agent' ? 'text-blue-400' : 'text-green-400'
            }`}>
              {typeLabels[match.type]}
            </span>
            <MatchScoreBadge score={match.match_score} />
          </div>
        </div>
        {match.company && match.company !== match.name && (
          <span className="text-xs text-gray-500">{match.company}</span>
        )}
      </div>
      
      {/* Stats */}
      <div className="space-y-1 mb-2">
        {match.total_volume && (
          <p className="text-xs text-gray-400">Volume: ${match.total_volume}M</p>
        )}
        {match.transaction_count && (
          <p className="text-xs text-gray-400">Deals: {match.transaction_count}</p>
        )}
        {match.typical_deal_size && (
          <p className="text-xs text-gray-400">Typical: {match.typical_deal_size}</p>
        )}
        {match.geographic_focus && (
          <p className="text-xs text-gray-400">Area: {match.geographic_focus.split(',')[0]}</p>
        )}
      </div>
      
      {/* Why They Fit */}
      {match.why_they_fit && (
        <p className="text-xs text-gray-500 mb-2 italic">{match.why_they_fit}</p>
      )}
      
      {/* Contact Info */}
      {match.contact && (
        <div className="pt-2 border-t border-gray-700/50 space-y-1">
          {match.contact.email && (
            <a 
              href={`mailto:${match.contact.email}`}
              className="flex items-center gap-1.5 text-xs text-coral hover:text-coral-light"
            >
              <Mail size={12} />
              {match.contact.email}
            </a>
          )}
          {match.contact.phone && (
            <a 
              href={`tel:${match.contact.phone}`}
              className="flex items-center gap-1.5 text-xs text-coral hover:text-coral-light"
            >
              <Phone size={12} />
              {match.contact.phone}
            </a>
          )}
          {match.contact.linkedin ? (
            <a 
              href={match.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#0077b5] hover:text-[#0077b5]/80"
            >
              <Linkedin size={12} />
              LinkedIn Profile
            </a>
          ) : match.social_links?.linkedin_search && (
            <a 
              href={match.social_links.linkedin_search}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#0077b5] hover:text-[#0077b5]/80"
            >
              <Linkedin size={12} />
              Find on LinkedIn
            </a>
          )}
          {match.social_links?.website && (
            <a 
              href={match.social_links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
            >
              <ExternalLink size={12} />
              Website
            </a>
          )}
          {match.social_links?.google_search && (
            <a 
              href={match.social_links.google_search}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
            >
              <ExternalLink size={12} />
              Google Search
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Results Message Component
function ResultsMessage({ results, property }) {
  const [showCopied, setShowCopied] = useState(false);
  const [obsidianStatus, setObsidianStatus] = useState(null);
  const [savingToObsidian, setSavingToObsidian] = useState(false);
  
  const formatResultsForCopy = () => {
    let text = `BIGDATACLAW MATCHING REPORT\n`;
    text += `Property: ${property.address}\n`;
    text += `Type: ${property.property_type} | Price: $${(property.price / 1000000).toFixed(1)}M\n`;
    text += `\n═══════════════════════════════════════\n\n`;
    
    if (results.buyers?.length > 0) {
      text += `TOP ${results.buyers.length} BUYER MATCHES\n\n`;
      results.buyers.forEach((b, i) => {
        text += `${i + 1}. ${b.name}\n`;
        text += `   Match: ${b.match_score}% | Volume: $${b.total_volume}M\n`;
        text += `   ${b.why_they_fit}\n`;
        if (b.contact?.email) text += `   Email: ${b.contact.email}\n`;
        text += `\n`;
      });
    }
    
    if (results.agents?.length > 0) {
      text += `TOP ${results.agents.length} AGENT MATCHES\n\n`;
      results.agents.forEach((a, i) => {
        text += `${i + 1}. ${a.name}\n`;
        text += `   Match: ${a.match_score}% | ${a.company || ''}\n`;
        if (a.contact?.email) text += `   Email: ${a.contact.email}\n`;
        text += `\n`;
      });
    }
    
    if (results.lenders?.length > 0) {
      text += `TOP ${results.lenders.length} LENDER MATCHES\n\n`;
      results.lenders.forEach((l, i) => {
        text += `${i + 1}. ${l.name}\n`;
        text += `   Match: ${l.match_score}%\n`;
        if (l.contact?.email) text += `   Email: ${l.contact.email}\n`;
        text += `\n`;
      });
    }
    
    return text;
  };
  
  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(formatResultsForCopy());
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };
  
  const handleSaveToObsidian = async () => {
    setSavingToObsidian(true);
    try {
      const response = await fetch(`${API_URL}/save-to-obsidian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          matches: results,
          folder: 'BigDataClaw/Reports'
        })
      });
      const data = await response.json();
      setObsidianStatus(data.success ? 'saved' : 'error');
      setTimeout(() => setObsidianStatus(null), 3000);
    } catch {
      setObsidianStatus('error');
      setTimeout(() => setObsidianStatus(null), 3000);
    } finally {
      setSavingToObsidian(false);
    }
  };
  
  return (
    <div className="bg-background-secondary border border-coral/30 rounded-xl p-4 max-w-2xl">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-coral" />
          <span className="font-semibold text-white">Comprehensive Matching Report</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveToObsidian}
            disabled={savingToObsidian}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              obsidianStatus === 'saved' 
                ? 'bg-green-500/20 text-green-400' 
                : obsidianStatus === 'error'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
            }`}
          >
            {savingToObsidian ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
            {obsidianStatus === 'saved' ? 'Saved!' : obsidianStatus === 'error' ? 'Failed' : 'Save to Obsidian'}
          </button>
          <button 
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-coral/20 hover:bg-coral/30 text-coral text-xs rounded-lg transition-colors"
          >
            {showCopied ? <Check size={14} /> : <Copy size={14} />}
            {showCopied ? 'Copied!' : 'Copy All'}
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mb-3">
        Property: {property.address} | {property.property_type} | ${(property.price / 1000000).toFixed(1)}M
      </div>
      
      {/* Buyers */}
      {results.buyers?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-coral mb-2 flex items-center gap-2">
            <Building2 size={14} />
            Top {results.buyers.length} Buyer Matches
          </h3>
          {results.buyers.map(buyer => (
            <MatchCard key={`buyer-${buyer.id}`} match={buyer} />
          ))}
        </div>
      )}
      
      {/* Agents */}
      {results.agents?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <Users size={14} />
            Top {results.agents.length} Agent Matches
          </h3>
          {results.agents.map(agent => (
            <MatchCard key={`agent-${agent.id}`} match={agent} />
          ))}
        </div>
      )}
      
      {/* Lenders */}
      {results.lenders?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
            <Building2 size={14} />
            Top {results.lenders.length} Lender Matches
          </h3>
          {results.lenders.map(lender => (
            <MatchCard key={`lender-${lender.id}`} match={lender} />
          ))}
        </div>
      )}
    </div>
  );
}

// Typewriter Chatbox Component
function TypewriterChatbox() {
  const typewriterTexts = [
    "lets find agents who sold properties like this",
    "lets find lenders who finance this asset class",
    "lets get this listing sold fast"
  ];
  
  const displayText = useTypewriter(typewriterTexts, 50, 2000);
  
  return (
    <div className="w-full max-w-2xl mb-4">
      <div 
        className="bg-[#1a1a1e] border border-coral/50 rounded-2xl p-4 shadow-lg relative overflow-hidden"
        style={{
          boxShadow: '0 0 20px rgba(255, 107, 107, 0.3), 0 0 40px rgba(255, 107, 107, 0.1), inset 0 0 20px rgba(255, 107, 107, 0.05)',
          animation: 'glowPulse 2s ease-in-out infinite alternate'
        }}
      >
        <style>{`
          @keyframes glowPulse {
            0% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.3), 0 0 40px rgba(255, 107, 107, 0.1), inset 0 0 20px rgba(255, 107, 107, 0.05); border-color: rgba(255, 107, 107, 0.5); }
            100% { box-shadow: 0 0 30px rgba(255, 107, 107, 0.5), 0 0 60px rgba(255, 107, 107, 0.2), 0 0 80px rgba(255, 255, 255, 0.1), inset 0 0 30px rgba(255, 107, 107, 0.1); border-color: rgba(255, 255, 255, 0.3); }
          }
        `}</style>
        
        <div className="min-h-[50px] flex items-center">
          <span className="text-gray-400 text-base">
            {displayText}
            <span className="animate-pulse text-coral">|</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Chat Input Component
function ChatInput({ input, setInput, onSend, onUpload, disabled, isRecording, onToggleRecording, placeholder, showUpload = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };
  
  return (
    <div className="w-full max-w-2xl">
      <div 
        className={`bg-background-secondary border rounded-2xl p-3 transition-colors ${
          isDragging ? 'border-coral bg-coral/10' : 'border-border'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex items-end gap-2">
          {/* Upload Button */}
          {showUpload && (
            <>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Upload listing"
              >
                <Upload size={18} />
              </button>
            </>
          )}
          
          {/* Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-0 px-2 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-0"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Voice Button */}
          <button 
            onClick={onToggleRecording}
            className={`p-2.5 rounded-xl transition-colors ${
              isRecording 
                ? 'bg-red-500/20 text-red-400 animate-pulse' 
                : 'bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white'
            }`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
          
          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="p-2.5 bg-coral hover:bg-coral-light disabled:opacity-40 text-white rounded-xl transition-colors"
          >
            {disabled ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        
        {isDragging && showUpload && (
          <div className="mt-2 text-xs text-coral text-center">
            Drop your listing file here
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <img src={logo} alt="BigDataClaw" className="w-[480px] h-auto" />
      </div>
      
      {/* Subtext */}
      <p className="text-gray-300 text-lg mb-6 text-center font-medium">
        <span className="text-white">AI-Powered Commercial Real Estate Intelligence</span>
        <br />
        <span className="text-coral">Buyer Matching Swarm</span>
      </p>
      
      {/* Typewriter */}
      <TypewriterChatbox />
    </div>
  );
}

// Message Bubble
function MessageBubble({ message }) {
  const isUser = message.isUser;
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-coral' : 'bg-background-tertiary'
      }`}>
        {isUser ? (
          <Users size={16} className="text-white" />
        ) : (
          <span className="text-lg">🦞</span>
        )}
      </div>
      <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        {isUser ? (
          <div className="inline-block bg-coral/20 border border-coral/30 rounded-xl px-4 py-2 text-left">
            <p className="text-sm text-white">{message.content}</p>
          </div>
        ) : message.results ? (
          <ResultsMessage results={message.results} property={message.property} />
        ) : (
          <div className="bg-background-tertiary border border-border rounded-xl px-4 py-3">
            <p className="text-sm text-gray-100 whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        <div className={`text-[10px] mt-1 text-gray-500`}>
          {message.time}
        </div>
      </div>
    </div>
  );
}

// Main Chat View
export default function ChatView() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState('matching'); // 'matching' or 'chat'
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize speech recognition once on mount.
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
      };
      
      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice input not supported in your browser');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };
  
  const extractPropertyDetails = (text) => {
    // Simple extraction - in production use NLP
    const priceMatch = text.match(/\$?([0-9,]+)\s*(million|M|m)?/i);
    const price = priceMatch ? 
      (priceMatch[2] ? parseFloat(priceMatch[1].replace(/,/g, '')) * 1000000 : parseFloat(priceMatch[1].replace(/,/g, ''))) 
      : 5000000;
    
    const types = ['industrial', 'office', 'retail', 'multifamily', 'land'];
    const typeMatch = types.find(t => text.toLowerCase().includes(t));
    
    return {
      address: text.length > 50 ? text.substring(0, 50) + '...' : text,
      property_type: typeMatch || 'industrial',
      price: price,
      size_sf: 80000,
      city: 'Ontario',
      features: text
    };
  };
  
  const handleSend = async (content) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      content,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      if (mode === 'chat') {
        // AI Chat mode
        const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content })
        });
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        
        // Add chat response
        const chatMessage = {
          id: Date.now() + 1,
          content: data.response || data.error,
          isUser: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, chatMessage]);
      } else {
        // Property Matching mode
        const propertyDetails = extractPropertyDetails(content);
        
        // Call API
        const response = await fetch(`${API_URL}/match-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(propertyDetails)
        });
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        
        // Add results message
        const resultsMessage = {
          id: Date.now() + 1,
          content: `Found ${data.buyers?.length || 0} buyers, ${data.agents?.length || 0} agents, and ${data.lenders?.length || 0} lenders matching your criteria.`,
          isUser: false,
          results: {
            buyers: data.buyers || [],
            agents: data.agents || [],
            lenders: data.lenders || []
          },
          property: propertyDetails,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, resultsMessage]);
      }
    } catch (err) {
      // Error message
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: `Sorry, I encountered an error: ${err.message}. Please make sure the API is running on port 9999.`,
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleUpload = async (file) => {
    // For now, just acknowledge the upload
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: `Uploaded: ${file.name}. Processing your listing...`,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    
    // In production, you'd OCR/parse the PDF and extract property details
    // For now, trigger a default search
    setTimeout(() => {
      handleSend('Find matches for uploaded listing at 1500 Michael Drive, Welland - Industrial - $5M');
    }, 1000);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-6 bg-background-secondary">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-coral" />
          <span className="font-semibold text-white">OpenClaw Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMode(mode === 'matching' ? 'chat' : 'matching')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              mode === 'matching' 
                ? 'bg-coral/20 text-coral' 
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {mode === 'matching' ? 'Property Matching' : 'AI Chat'}
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-status-active" />
            Connected
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-background-tertiary flex items-center justify-center">
                  <span className="text-lg">🦞</span>
                </div>
                <div className="bg-background-tertiary border border-border rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background-secondary">
        <div className="max-w-3xl mx-auto">
          <ChatInput 
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onUpload={handleUpload}
            disabled={isTyping}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            placeholder={mode === 'chat' ? 'Ask me anything...' : 'Describe your property or upload a listing...'}
            showUpload={mode === 'matching'}
          />
          <div className="flex justify-center gap-2 mt-3">
            <span className="text-[10px] text-gray-500">Text</span>
            <span className="text-[10px] text-gray-600">•</span>
            <span className="text-[10px] text-gray-500">Voice</span>
            <span className="text-[10px] text-gray-600">•</span>
            <span className="text-[10px] text-gray-500">Upload</span>
          </div>
        </div>
      </div>
    </div>
  );
}
