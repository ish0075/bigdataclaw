import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Settings } from 'lucide-react';

/**
 * Voice Dictation System for NERVE
 * Global voice input that works across the app
 * 
 * Default Keybindings:
 * - Ctrl+Shift+V: Start/Stop dictation (VS Code: uses Ctrl+Alt+V)
 * - Escape: Cancel dictation
 */

const STORAGE_KEY = 'nerve_voice_settings';

// Default settings
const defaultSettings = {
  triggerKey: 'v',        // Ctrl+Shift + this key
  language: 'en-US',
  continuous: false,
  autoInsert: true,       // Auto-insert at cursor
  showNotification: true
};

export const useVoiceDictation = (onResult, options = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const targetRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = settings.continuous;
    recognition.interimResults = true;
    recognition.lang = settings.language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      
      // Store active element
      targetRef.current = document.activeElement;
      
      if (settings.showNotification) {
        showNotification('🎤 Listening...', 'Speak now');
      }
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      const current = final || interim;
      setTranscript(current);

      // Auto-stop after silence if not continuous
      if (!settings.continuous) {
        clearTimeout(timeoutRef.current);
        if (final) {
          timeoutRef.current = setTimeout(() => {
            stopListening();
            if (onResult) onResult(final.trim(), targetRef.current);
          }, 500);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setError(event.error);
      setIsListening(false);
      showNotification('❌ Error', event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript && !settings.continuous) {
        if (onResult) onResult(transcript.trim(), targetRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimeout(timeoutRef.current);
      recognition.stop();
    };
  }, [settings, onResult, transcript]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+V to toggle (won't conflict with VS Code:)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === settings.triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        toggleListening();
      }
      // Escape to cancel
      else if (e.key === 'Escape' && isListening) {
        stopListening();
        showNotification('❌ Cancelled', 'Dictation stopped');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isListening, settings.triggerKey]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const updateSettings = useCallback((newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [settings]);

  return {
    isListening,
    transcript,
    error,
    settings,
    startListening,
    stopListening,
    toggleListening,
    updateSettings
  };
};

// Show desktop notification
const showNotification = (title, body) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🎤' });
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
};

// Voice Dictation UI Component
export const VoiceDictationPanel = ({ isListening, transcript, onClose }) => {
  if (!isListening) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 min-w-[300px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">Listening...</p>
          <p className="text-xs text-slate-400">Ctrl+Shift+V to stop • Esc to cancel</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {transcript && (
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-slate-300 text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
};

// Settings Panel
export const VoiceDictationSettings = ({ settings, onUpdate, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Voice Dictation Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
              Shortcut Key (Ctrl+Shift + key)
            </label>
            <input
              type="text"
              maxLength={1}
              value={settings.triggerKey}
              onChange={(e) => onUpdate({ triggerKey: e.target.value.toLowerCase() })}
              className="w-20 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-center text-white uppercase"
            />
            <p className="text-xs text-slate-500 mt-1">
              Current: Ctrl+Shift+{settings.triggerKey.toUpperCase()}
            </p>
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="en-US">English (US)</option>
              <option value="en-CA">English (Canada)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notifications"
              checked={settings.showNotification}
              onChange={(e) => onUpdate({ showNotification: e.target.checked })}
              className="rounded border-slate-700"
            />
            <label htmlFor="notifications" className="text-sm text-slate-300">
              Show desktop notifications
            </label>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            💡 <strong>Ctrl+Shift+{settings.triggerKey.toUpperCase()}</strong> to start/stop dictation
          </p>
          <p className="text-xs text-slate-500 mt-1">
            💡 <strong>Escape</strong> to cancel
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default VoiceDictationPanel;
