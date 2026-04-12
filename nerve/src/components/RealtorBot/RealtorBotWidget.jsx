/**
 * Realtor Bot Widget
 * Smart agent search assistant that sits on agent pages
 * Searches database → Google → Realtor.ca
 * Saves new agents with quick links
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, Sparkles, Database, Globe, 
  ExternalLink, Save, Loader2, User, 
  Building2, MapPin, Linkedin, Wrench
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RealtorBotWidget = ({ context = 'exp-agent-recruiter' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      content: "👋 Hi! I'm your Realtor Assistant. I can search our database of 96,000+ agents, or find new ones on Google and Realtor.ca. Who are you looking for?",
      suggestions: ['Find John Smith', 'Search Toronto agents', 'What can you do?'],
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content = inputMessage) => {
    if (!content.trim()) return;
    
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const chatRes = await fetch('${API_BASE}/api/realtor-bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, context })
      });
      
      const chatData = await chatRes.json();
      
      if (chatData.action === 'search' && chatData.query) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'bot',
          content: `🔍 Searching for "${chatData.query}"...`,
          loading: true,
          timestamp: new Date()
        }]);
        
        const searchRes = await fetch('${API_BASE}/api/realtor-bot/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: chatData.query, context })
        });
        
        const searchData = await searchRes.json();
        
        setMessages(prev => {
          const withoutLoading = prev.filter(m => !m.loading);
          return [...withoutLoading, {
            id: Date.now() + 2,
            role: 'bot',
            content: formatSearchResults(searchData, chatData.query),
            searchResults: searchData,
            query: chatData.query,
            timestamp: new Date()
          }];
        });
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'bot',
          content: chatData.response,
          suggestions: chatData.suggestions,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        content: "❌ Sorry, I encountered an error. Please try again!",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatSearchResults = (data, query) => {
    let text = '';
    
    if (data.from_database?.length > 0) {
      text += `✅ Found **${data.from_database.length} agents** in our database\\n\\n`;
    }
    
    if (data.from_google?.length > 0) {
      text += `🌐 Found **${data.from_google.length} new agents** online\\n`;
      if (data.saved_new?.length > 0) {
        text += `💾 Saved ${data.saved_new.length} to database with quick links!\\n`;
      }
      text += '\\n';
    }
    
    if (data.total_found === 0) {
      text += `❌ No agents found for "${query}"\\n\\nI searched our database (96,000+ agents), Google, and Realtor.ca.`;
    } else {
      text += `Click on any agent below to view their details!`;
    }
    
    return text;
  };
  
  const skills = [
    { name: 'Database Search', icon: Database, desc: '96K+ agents', color: 'text-blue-400' },
    { name: 'Google Search', icon: Globe, desc: 'Find online', color: 'text-green-400' },
    { name: 'Realtor.ca', icon: Building2, desc: 'Official profiles', color: 'text-red-400' },
    { name: 'Auto-Save', icon: Save, desc: 'With quick links', color: 'text-amber-400' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full shadow-2xl hover:scale-105 transition-all"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
        <span className="text-white font-medium">Realtor Assistant</span>
        <Sparkles className="w-4 h-4 text-yellow-300" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Realtor Assistant</h3>
            <p className="text-xs text-text-secondary">96K+ agents • Google • Realtor.ca</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSkills(!showSkills)}
            className="p-2 hover:bg-bg-input rounded-lg text-text-secondary"
            title="My Skills"
          >
            <Wrench className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-bg-input rounded-lg text-text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Skills Panel */}
      {showSkills && (
        <div className="p-4 bg-bg-input border-b border-border-subtle">
          <h4 className="text-xs font-medium text-text-secondary uppercase mb-3">My Skills</h4>
          <div className="grid grid-cols-2 gap-2">
            {skills.map((skill, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-bg-card rounded-lg">
                <skill.icon className={`w-4 h-4 ${skill.color}`} />
                <div>
                  <p className="text-xs font-medium text-text-primary">{skill.name}</p>
                  <p className="text-xs text-text-muted">{skill.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-bg-input'} rounded-2xl px-4 py-3`}>
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
              
              {/* Search Results */}
              {msg.searchResults && (
                <div className="mt-3 space-y-2">
                  {/* Database Results */}
                  {msg.searchResults.from_database?.map((agent, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-bg-card rounded-xl border border-border-subtle hover:border-cyan-500/50 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary">{agent.name}</p>
                          {agent.brokerage && (
                            <p className="text-xs text-text-secondary flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {agent.brokerage}
                            </p>
                          )}
                          {agent.city && (
                            <p className="text-xs text-text-secondary flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {agent.city}
                            </p>
                          )}
                          
                          {/* Quick Links */}
                          {agent.quick_links && (
                            <div className="flex gap-2 mt-2">
                              {agent.quick_links.google && (
                                <a href={agent.quick_links.google} target="_blank" rel="noopener noreferrer"
                                   className="p-1.5 bg-bg-input rounded hover:bg-bg-primary"
                                   title="Google Search">
                                  <Globe className="w-3 h-3 text-blue-400" />
                                </a>
                              )}
                              {agent.quick_links.linkedin && (
                                <a href={agent.quick_links.linkedin} target="_blank" rel="noopener noreferrer"
                                   className="p-1.5 bg-bg-input rounded hover:bg-bg-primary"
                                   title="LinkedIn">
                                  <Linkedin className="w-3 h-3 text-blue-600" />
                                </a>
                              )}
                            </div>
                          )}
                          
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                            <Database className="w-3 h-3" />
                            In Database
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* New Agents from Google */}
                  {msg.searchResults.saved_new?.map((agent, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-bg-card rounded-xl border border-green-500/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary">{agent.name}</p>
                          {agent.brokerage && (
                            <p className="text-xs text-text-secondary">{agent.brokerage}</p>
                          )}
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                            <Save className="w-3 h-3" />
                            Saved to Database
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Suggestions */}
              {msg.suggestions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-3 py-1.5 bg-bg-card border border-border-subtle rounded-full text-xs text-text-secondary hover:text-text-primary hover:border-cyan-500/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {msg.loading && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span className="text-xs text-text-secondary">Searching...</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Search for an agent..."
            className="flex-1 px-4 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm text-text-primary focus:border-cyan-500"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="p-2 bg-cyan-600 rounded-xl hover:bg-cyan-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2 text-center">
          Press Enter to search database, Google, and Realtor.ca
        </p>
      </div>
    </div>
  );
};

export default RealtorBotWidget;
