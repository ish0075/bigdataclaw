import React, { useState } from 'react';
import { Plus, ClipboardPaste, X, Save, ExternalLink } from 'lucide-react';

const QuickAddAgent = ({ onSaveToObsidian }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [parsedAgents, setParsedAgents] = useState([]);
  const [saved, setSaved] = useState(false);

  // Parse agent information from pasted text
  const parseAgents = (text) => {
    const agents = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Remove "Welcome " prefix
      let cleanLine = line.replace(/^Welcome\s+/i, '').trim();
      
      // Parse pattern: Name, Brokerage, City
      // Handle variations like:
      // "Peter Van Hezewyk, Royal LePage NRC Realty, St. Catharines"
      // "Chris Amas Asiriuwa, Re/Max Niagara Realty LTD, Brokerage, St. Catharines"
      
      const parts = cleanLine.split(',').map(p => p.trim()).filter(p => p);
      
      if (parts.length >= 3) {
        const name = parts[0];
        // Brokerage might include "Brokerage" or "Inc" - combine if needed
        let brokerage = parts[1];
        let city = parts[parts.length - 1];
        
        // If there's a "Brokerage" part, include it
        if (parts.length > 3 && parts[2].toLowerCase().includes('brokerage')) {
          brokerage = `${parts[1]}, ${parts[2]}`;
        }
        
        agents.push({
          id: Date.now() + Math.random(),
          name,
          brokerage,
          city,
          raw: cleanLine,
          dateAdded: new Date().toISOString().split('T')[0]
        });
      } else if (parts.length >= 2) {
        // Minimum: name and something
        agents.push({
          id: Date.now() + Math.random(),
          name: parts[0],
          brokerage: parts[1] || 'Unknown Brokerage',
          city: parts[2] || 'Unknown City',
          raw: cleanLine,
          dateAdded: new Date().toISOString().split('T')[0]
        });
      }
    });
    
    return agents;
  };

  const handlePaste = (e) => {
    const text = e.target.value;
    setRawText(text);
    const agents = parseAgents(text);
    setParsedAgents(agents);
    setSaved(false);
  };

  const handleSave = async () => {
    if (parsedAgents.length === 0) return;
    
    // Save each agent to Obsidian
    for (const agent of parsedAgents) {
      const markdown = generateAgentMarkdown(agent);
      await onSaveToObsidian?.(agent.name, markdown);
    }
    
    setSaved(true);
    setTimeout(() => {
      setIsOpen(false);
      setRawText('');
      setParsedAgents([]);
      setSaved(false);
    }, 2000);
  };

  const generateAgentMarkdown = (agent) => {
    return `# ${agent.name}

## Agent Information
- **Name:** ${agent.name}
- **Brokerage:** ${agent.brokerage}
- **City:** ${agent.city}
- **Date Added:** ${agent.dateAdded}
- **Source:** New Agent Registration

## Status
- [ ] Initial Contact
- [ ] Sent Welcome Package
- [ ] Scheduled Meeting
- [ ] Joined Team

## Notes
New agent joined the real estate board.

## Quick Links
- [Google Search](https://www.google.com/search?q=${encodeURIComponent(agent.name)})
- [LinkedIn Search](https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(agent.name)})
- [Brokerage Search](https://www.google.com/search?q=${encodeURIComponent(agent.brokerage)})

---
*Added: ${agent.dateAdded}*
#new-agent #${agent.city.toLowerCase().replace(/\s+/g, '-')} #recruitment
`;
  };

  const exampleText = `Welcome Peter Van Hezewyk, Royal LePage NRC Realty, St. Catharines

Welcome Chris Amas Asiriuwa, Re/Max Niagara Realty LTD, Brokerage, St. Catharines

Welcome Tim O'Connor, Re/Max Escarpment Realty Inc, Brokerage, Hamilton

Welcome Danyse Van Dam, Royal LePage NRC Realty, St. Catharines`;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Quick Add Agents
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-2xl mx-4 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-emerald-600/20 to-blue-600/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quick Add New Agents</h2>
              <p className="text-slate-400 text-sm">Paste agent info and save to Obsidian</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Paste Area */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Paste New Agent Information
            </label>
            <textarea
              value={rawText}
              onChange={handlePaste}
              placeholder={exampleText}
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Format: &quot;Welcome Name, Brokerage, City&quot; or just &quot;Name, Brokerage, City&quot;
            </p>
          </div>

          {/* Parsed Results */}
          {parsedAgents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">
                Parsed {parsedAgents.length} Agent{parsedAgents.length !== 1 ? 's' : ''}:
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parsedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <div className="font-medium text-white">{agent.name}</div>
                    <div className="text-sm text-slate-400">{agent.brokerage}</div>
                    <div className="text-sm text-slate-500">{agent.city}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={parsedAgents.length === 0 || saved}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {saved ? (
                <>
                  <Save className="w-4 h-4" />
                  Saved to Obsidian!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save {parsedAgents.length > 0 && `(${parsedAgents.length})`} to Obsidian
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddAgent;
