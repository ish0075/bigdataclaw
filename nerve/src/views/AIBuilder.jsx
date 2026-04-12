/**
 * AI Builder - VS Code Style AI Assistant
 * Built-in code editor with AI chat for building the platform
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Folder, File, ChevronRight, ChevronDown, Save, Play, 
  MessageSquare, X, Send, Plus, Trash2, RefreshCw, Search,
  Code, Terminal, Layout, Settings, Bot, Sparkles, Copy,
  Check, MoreVertical, FolderOpen, FileCode, FileText,
  Wand2, Lightbulb, Zap, AlertCircle, Cpu, BrainCircuit,
  ShieldCheck, Flame
} from 'lucide-react';
import Editor from '@monaco-editor/react';


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// File icon mapping
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap = {
    'jsx': <FileCode className="w-4 h-4 text-blue-400" />,
    'js': <FileCode className="w-4 h-4 text-yellow-400" />,
    'ts': <FileCode className="w-4 h-4 text-blue-500" />,
    'tsx': <FileCode className="w-4 h-4 text-blue-600" />,
    'py': <FileCode className="w-4 h-4 text-green-400" />,
    'css': <FileCode className="w-4 h-4 text-cyan-400" />,
    'scss': <FileCode className="w-4 h-4 text-pink-400" />,
    'html': <FileCode className="w-4 h-4 text-orange-400" />,
    'json': <FileText className="w-4 h-4 text-yellow-300" />,
    'md': <FileText className="w-4 h-4 text-white" />,
    'sql': <FileCode className="w-4 h-4 text-purple-400" />,
  };
  return iconMap[ext] || <File className="w-4 h-4 text-text-muted" />;
};

const AIBuilder = () => {
  // State
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "👋 Hi! I'm your AI Builder assistant. I can help you:\n\n• Create new components\n• Fix bugs and errors\n• Add styling with Tailwind\n• Explain existing code\n• Refactor and optimize\n\nWhat would you like to build today?",
      suggestions: ['Create a new component', 'Fix an error', 'Add styling', 'Explain this code'],
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [availableModels, setAvailableModels] = useState({});
  const [expandedDirs, setExpandedDirs] = useState(new Set(['nerve', 'nerve/src']));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  
  const chatEndRef = useRef(null);
  
  // Load files and models on mount
  useEffect(() => {
    loadFiles('');
    loadModels();
  }, []);
  
  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const loadFiles = async (path = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/ai-builder/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setFiles(data.items);
      setCurrentPath(data.current_path);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };
  
  const loadModels = async () => {
    try {
      const res = await fetch('${API_BASE}/api/ai-builder/models');
      const data = await res.json();
      setAvailableModels(data.models || {});
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };
  
  const loadFile = async (path) => {
    try {
      const res = await fetch(`${API_BASE}/api/ai-builder/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      
      // Add to open files if not already
      if (!openFiles.find(f => f.path === path)) {
        setOpenFiles(prev => [...prev, { path, name: path.split('/').pop() }]);
      }
      
      setActiveFile(data);
      setFileContent(data.content);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };
  
  const saveFile = async () => {
    if (!activeFile) return;
    
    try {
      await fetch('${API_BASE}/api/ai-builder/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activeFile.path,
          content: fileContent
        })
      });
      
      // Show success
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        content: `✅ Saved ${activeFile.path}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };
  
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);
    
    try {
      const res = await fetch('${API_BASE}/api/ai-builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          context: fileContent,
          file_path: activeFile?.path,
          model: selectedModel
        })
      });
      
      const data = await res.json();
      
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        code_blocks: data.code_blocks,
        suggestions: data.suggestions,
        actions: data.actions,
        model_used: data.model_used,
        task_type: data.task_type,
        timestamp: new Date()
      }]);
      
      // Handle actions (like create file)
      if (data.actions) {
        for (const action of data.actions) {
          if (action.type === 'create_file' && data.code_blocks?.[0]) {
            // Auto-create the file
            await fetch('${API_BASE}/api/ai-builder/file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                path: action.path,
                content: data.code_blocks[0].content
              })
            });
            
            // Reload files
            loadFiles('');
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleDir = (path) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  const closeFile = (path, e) => {
    e.stopPropagation();
    setOpenFiles(prev => prev.filter(f => f.path !== path));
    if (activeFile?.path === path) {
      setActiveFile(null);
      setFileContent('');
    }
  };
  
  const searchFiles = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/ai-builder/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };
  
  // File tree renderer
  const renderFileTree = (items, depth = 0) => {
    return items.map(item => {
      const isExpanded = expandedDirs.has(item.path);
      const paddingLeft = depth * 12 + 8;
      
      if (item.type === 'directory') {
        return (
          <div key={item.path}>
            <div
              className="flex items-center gap-1 px-2 py-1 hover:bg-bg-input cursor-pointer text-text-secondary text-sm"
              style={{ paddingLeft }}
              onClick={() => toggleDir(item.path)}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <Folder className="w-4 h-4 text-yellow-500" />
              <span className="truncate">{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div>{renderFileTree(item.children, depth + 1)}</div>
            )}
          </div>
        );
      }
      
      return (
        <div
          key={item.path}
          className={`flex items-center gap-2 px-2 py-1 hover:bg-bg-input cursor-pointer text-sm ${
            activeFile?.path === item.path ? 'bg-cyan-500/20 text-cyan-400' : 'text-text-secondary'
          }`}
          style={{ paddingLeft: paddingLeft + 12 }}
          onClick={() => loadFile(item.path)}
        >
          {getFileIcon(item.name)}
          <span className="truncate">{item.name}</span>
        </div>
      );
    });
  };
  
  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="h-12 bg-bg-card border-b border-border-subtle flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Code className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">AI Builder</h1>
            <p className="text-xs text-text-muted">VS Code Style Editor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg ${showSearch ? 'bg-cyan-500/20 text-cyan-400' : 'text-text-secondary hover:bg-bg-input'}`}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-2 rounded-lg ${showTerminal ? 'bg-cyan-500/20 text-cyan-400' : 'text-text-secondary hover:bg-bg-input'}`}
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            onClick={saveFile}
            disabled={!activeFile}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 rounded-lg text-sm hover:bg-cyan-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Explorer */}
        <div className="w-64 bg-bg-card border-r border-border-subtle flex flex-col">
          <div className="p-3 border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">Explorer</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-bg-input rounded" title="New File">
                <Plus className="w-3 h-3 text-text-secondary" />
              </button>
              <button className="p-1 hover:bg-bg-input rounded" title="Refresh">
                <RefreshCw className="w-3 h-3 text-text-secondary" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            {renderFileTree(files)}
          </div>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          {openFiles.length > 0 && (
            <div className="flex bg-bg-card border-b border-border-subtle overflow-x-auto">
              {openFiles.map(file => (
                <div
                  key={file.path}
                  onClick={() => loadFile(file.path)}
                  className={`flex items-center gap-2 px-3 py-2 border-r border-border-subtle cursor-pointer min-w-fit ${
                    activeFile?.path === file.path 
                      ? 'bg-bg-primary text-text-primary' 
                      : 'text-text-secondary hover:bg-bg-input'
                  }`}
                >
                  {getFileIcon(file.name)}
                  <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={(e) => closeFile(file.path, e)}
                    className="p-0.5 hover:bg-bg-input rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Editor */}
          <div className="flex-1 relative">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language}
                value={fileContent}
                onChange={setFileContent}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted">
                <div className="text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Select a file to start editing</p>
                  <p className="text-sm mt-2">or ask the AI to create one for you</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 bg-bg-card border-t border-border-subtle flex flex-col">
              <div className="flex items-center justify-between px-3 py-1 border-b border-border-subtle">
                <span className="text-xs font-semibold text-text-muted uppercase">Terminal</span>
                <button onClick={() => setShowTerminal(false)}>
                  <X className="w-3 h-3 text-text-secondary" />
                </button>
              </div>
              <div className="flex-1 p-3 font-mono text-sm overflow-y-auto">
                {terminalOutput.length === 0 ? (
                  <span className="text-text-muted">Ready for commands...</span>
                ) : (
                  terminalOutput.map((line, i) => (
                    <div key={i} className={line.type === 'error' ? 'text-red-400' : 'text-text-secondary'}>
                      {line.content}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* AI Chat Panel */}
        {isChatOpen && (
          <div className="w-96 bg-bg-card border-l border-border-subtle flex flex-col">
            {/* Chat Header */}
            <div className="p-3 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-text-primary">AI Assistant</span>
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Model Selector */}
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-2 py-1 bg-bg-input border border-border-subtle rounded-lg text-xs text-text-primary focus:border-purple-500 outline-none"
                  title="Select AI model"
                >
                  <option value="auto">🎯 Auto</option>
                  {Object.entries(availableModels).map(([id, m]) => (
                    <option key={id} value={id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-bg-input rounded"
                >
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] ${msg.role === 'user' ? 'bg-cyan-600' : 'bg-bg-input'} rounded-2xl px-4 py-3`}>
                    {/* Avatar for assistant */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-text-muted">AI Assistant</span>
                        {msg.model_used && (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide"
                            style={{ 
                              backgroundColor: `${availableModels[msg.model_used]?.color || '#6366f1'}20`,
                              color: availableModels[msg.model_used]?.color || '#6366f1'
                            }}
                            title={msg.task_type ? `Task: ${msg.task_type}` : ''}
                          >
                            {availableModels[msg.model_used]?.name || msg.model_used}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Message content */}
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    
                    {/* Code blocks */}
                    {msg.code_blocks?.map((block, idx) => (
                      <div key={idx} className="mt-3 bg-bg-primary rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-bg-input border-b border-border-subtle">
                          <span className="text-xs text-text-muted">{block.language || 'code'}</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(block.content)}
                            className="p-1 hover:bg-bg-card rounded"
                          >
                            <Copy className="w-3 h-3 text-text-secondary" />
                          </button>
                        </div>
                        <pre className="p-3 text-xs overflow-x-auto">
                          <code>{block.content}</code>
                        </pre>
                      </div>
                    ))}
                    
                    {/* Suggestions */}
                    {msg.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setChatInput(suggestion);
                            }}
                            className="px-3 py-1.5 bg-bg-card border border-border-subtle rounded-full text-xs text-text-secondary hover:text-text-primary hover:border-cyan-500/50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-bg-input rounded-2xl px-4 py-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t border-border-subtle">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask AI to build something..."
                  className="flex-1 px-4 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm text-text-primary focus:border-purple-500"
                  disabled={isLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={isLoading || !chatInput.trim()}
                  className="p-2 bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-text-muted">
                  AI can create, edit, and explain code
                </p>
                {activeFile && (
                  <span className="text-xs text-cyan-400">
                    Context: {activeFile.path}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Toggle Chat Button (when closed) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl hover:scale-105 transition-all"
        >
          <Bot className="w-5 h-5 text-white" />
          <span className="text-white font-medium">AI Assistant</span>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </button>
      )}
    </div>
  );
};

export default AIBuilder;
