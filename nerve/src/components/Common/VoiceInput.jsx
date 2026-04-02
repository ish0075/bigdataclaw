import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

/**
 * Voice Input Component for NERVE
 * Uses Web Speech API for speech-to-text
 * 
 * Features:
 * - Voice search for agents/properties
 * - Voice commands for navigation
 * - Continuous or single-shot dictation
 * - Visual feedback while listening
 */

const VoiceInput = ({ 
  onResult, 
  onCommand,
  placeholder = 'Click microphone to speak...',
  className = '',
  size = 'md',
  continuous = false,
  commands = null, // Optional: { 'command': handler }
  language = 'en-US'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      // Check for commands
      if (commands && finalTranscript) {
        const lowerTranscript = finalTranscript.toLowerCase().trim();
        for (const [command, handler] of Object.entries(commands)) {
          if (lowerTranscript.includes(command.toLowerCase())) {
            handler(lowerTranscript);
            if (!continuous) {
              stopListening();
            }
            return;
          }
        }
      }
      
      // Auto-stop after silence if not continuous
      if (!continuous) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (finalTranscript) {
            onResult?.(finalTranscript.trim());
            stopListening();
          }
        }, 1500);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      if (transcript && !continuous) {
        onResult?.(transcript.trim());
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      clearTimeout(timeoutRef.current);
      recognition.stop();
    };
  }, [continuous, commands, language, onResult, transcript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-slate-500 text-sm ${className}`}>
        <MicOff className={iconSizes[size]} />
        <span>Voice not supported</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Voice Button with Animation */}
      <button
        onClick={toggleListening}
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center
          transition-all duration-300 relative
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
            : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30'
          }
          ${isListening ? 'animate-pulse' : ''}
        `}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {/* Ripple effect when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
            <span className="absolute -inset-2 rounded-full bg-red-500/20 animate-pulse" />
          </>
        )}
        
        {isListening ? (
          <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
        ) : (
          <Mic className={`${iconSizes[size]} text-white`} />
        )}
      </button>
      
      {/* Transcript Display */}
      {isListening && (
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300 truncate">
            {transcript || placeholder}
          </p>
          <p className="text-xs text-slate-500">
            {continuous ? 'Listening... (click to stop)' : 'Listening...'}
          </p>
        </div>
      )}
      
      {/* Error Message */}
      {error && !isListening && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export default VoiceInput;
