import React, { useState, useEffect } from 'react';
import { Clipboard, Check, Phone, Save, X } from 'lucide-react';

/**
 * Obsidian Web Clipper Integration
 * Captures contact info from Realtor.ca and other sites
 * Stores locally and syncs with agent data
 */

const OBSIDIAN_STORAGE_KEY = 'nerve_obsidian_clips';

export const saveObsidianClip = (agentId, data) => {
  const clips = JSON.parse(localStorage.getItem(OBSIDIAN_STORAGE_KEY) || '{}');
  clips[agentId] = {
    ...clips[agentId],
    ...data,
    clippedAt: new Date().toISOString()
  };
  localStorage.setItem(OBSIDIAN_STORAGE_KEY, JSON.stringify(clips));
  return clips[agentId];
};

export const getObsidianClip = (agentId) => {
  const clips = JSON.parse(localStorage.getItem(OBSIDIAN_STORAGE_KEY) || '{}');
  return clips[agentId] || null;
};

export const getAllClips = () => {
  return JSON.parse(localStorage.getItem(OBSIDIAN_STORAGE_KEY) || '{}');
};

export const mergeAgentWithClips = (agent) => {
  const clip = getObsidianClip(agent.id);
  if (!clip) return agent;
  
  return {
    ...agent,
    phone: clip.phone || agent.phone,
    website: clip.website || agent.website,
    notes: clip.notes || agent.notes,
    clippedAt: clip.clippedAt
  };
};

// Component for capturing manual clip data
export const ObsidianClipForm = ({ agent, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    phone: '',
    website: '',
    notes: ''
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const data = {};
    if (formData.phone) data.phone = formData.phone;
    if (formData.website) data.website = formData.website;
    if (formData.notes) data.notes = formData.notes;
    
    if (Object.keys(data).length > 0) {
      saveObsidianClip(agent.id, data);
      setSaved(true);
      onSave?.({ ...agent, ...data });
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-purple-400" />
            Add Contact Info
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-slate-400 mb-4">
          Manually add contact details for <span className="text-white font-medium">{agent.name}</span>
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">
              Phone Number
            </label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(416) 555-1234"
                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              placeholder="https://..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            />
          </div>
          
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional info from Realtor.ca..."
              rows={3}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              saved 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : (
              <><Save className="w-4 h-4" /> Save Contact</>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
          >
            Cancel
          </button>
        </div>
        
        <p className="text-xs text-slate-500 mt-4 text-center">
          💡 Tip: Use Obsidian Web Clipper on Realtor.ca to auto-capture this info
        </p>
      </div>
    </div>
  );
};

// Indicator badge for clipped data
export const ClipIndicator = ({ agent }) => {
  const clip = getObsidianClip(agent.id);
  if (!clip) return null;
  
  return (
    <span 
      className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-slate-800"
      title={`Clipped: ${new Date(clip.clippedAt).toLocaleDateString()}`}
    />
  );
};

export default ObsidianClipForm;
