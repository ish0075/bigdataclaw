import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Send, Search, Brain, RefreshCw,
  ChevronLeft, BookOpen, Activity, Zap, Volume2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://bigdataclaw.srv1368913.hstgr.cloud';

// Simple Cytoscape loader
function useCytoscape(containerRef, elements, activePaths) {
  const cyRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (initRef.current || !containerRef.current || !mounted) return;
      initRef.current = true;
      const cytoscape = (await import('cytoscape')).default;
      if (!mounted || !containerRef.current) return;
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#0ea5e9',
              'width': 8,
              'height': 8,
              'border-width': 0,
              'label': 'data(label)',
              'color': '#e2e8f0',
              'font-size': 6,
              'text-opacity': 0.7,
              'text-valign': 'bottom',
              'text-halign': 'center',
              'text-margin-y': 4,
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 0.5,
              'line-color': '#334155',
              'target-arrow-color': '#334155',
              'target-arrow-shape': 'none',
              'curve-style': 'bezier',
              'opacity': 0.4,
            },
          },
          {
            selector: '.active',
            style: {
              'background-color': '#22d3ee',
              'width': 14,
              'height': 14,
              'border-width': 2,
              'border-color': '#0891b2',
              'text-opacity': 1,
              'font-size': 8,
              'z-index': 999,
            },
          },
          {
            selector: '.dim',
            style: {
              'opacity': 0.15,
              'text-opacity': 0.1,
            },
          },
        ],
        layout: {
          name: 'cose',
          padding: 20,
          animate: true,
          animationDuration: 500,
          fit: true,
          componentSpacing: 60,
          nodeRepulsion: 8000,
          idealEdgeLength: 30,
          gravity: 0.1,
        },
        minZoom: 0.2,
        maxZoom: 4,
        wheelSensitivity: 0.3,
      });
      cyRef.current = cy;
    };

    const t = setTimeout(init, 0);

    return () => {
      mounted = false;
      clearTimeout(t);
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      initRef.current = false;
    };
  }, []);

  // Update elements when they change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().remove();
    cy.add(elements);
    cy.layout({ name: 'cose', padding: 20, animate: true, animationDuration: 500, fit: true }).run();
  }, [elements]);

  // Highlight active nodes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass('active dim');
    if (activePaths.length > 0) {
      cy.nodes().addClass('dim');
      activePaths.forEach((path) => {
        const node = cy.getElementById(path);
        if (node.length) {
          node.removeClass('dim').addClass('active');
        }
      });
    }
  }, [activePaths]);

  return cyRef;
}

export default function VoiceAgentView() {
  const navigate = useNavigate();
  const graphRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [vaultFiles, setVaultFiles] = useState([]);
  const [indexing, setIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch vault files
  const fetchVaultFiles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/obsidian/files?vault=main`);
      const data = await res.json();
      const files = data.files || [];
      setVaultFiles(files);
    } catch (e) {
      console.error('Failed to fetch vault files', e);
    }
  }, []);

  useEffect(() => {
    fetchVaultFiles();
  }, [fetchVaultFiles]);

  // Build graph elements from vault files
  const graphElements = React.useMemo(() => {
    const mdFiles = vaultFiles.filter((f) => f.endsWith('.md'));
    const nodes = mdFiles.slice(0, 300).map((file, i) => ({
      data: {
        id: file,
        label: file.replace(/\.md$/, '').split('/').pop(),
      },
    }));
    // Simple edges: connect nearby files in same folder
    const edges = [];
    const folderMap = {};
    nodes.forEach((n) => {
      const folder = n.data.id.split('/').slice(0, -1).join('/') || 'root';
      if (!folderMap[folder]) folderMap[folder] = [];
      folderMap[folder].push(n.data.id);
    });
    Object.values(folderMap).forEach((files) => {
      for (let i = 0; i < Math.min(files.length - 1, 3); i++) {
        edges.push({
          data: {
            id: `${files[i]}->${files[i + 1]}`,
            source: files[i],
            target: files[i + 1],
          },
        });
      }
    });
    return [...nodes, ...edges];
  }, [vaultFiles]);

  const activePaths = React.useMemo(() => results.map((r) => r.file_path).filter(Boolean), [results]);
  useCytoscape(graphRef, graphElements, activePaths);

  const handleIndex = async () => {
    setIndexing(true);
    try {
      await fetch(`${API_BASE}/api/obsidian/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recreate: true, limit: 2000 }),
      });
      // Poll status
      const poll = setInterval(async () => {
        const res = await fetch(`${API_BASE}/api/obsidian/index-status`);
        const status = await res.json();
        setIndexStatus(status);
        if (!status.running) clearInterval(poll);
      }, 2000);
    } catch (e) {
      console.error(e);
      setIndexing(false);
    }
  };

  const runSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/obsidian/semantic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 8 }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runVoiceAgent = async (q, audioBlob = null) => {
    setLoading(true);
    try {
      let data;
      if (audioBlob) {
        const form = new FormData();
        form.append('audio', audioBlob, 'recording.webm');
        form.append('use_elevenlabs', 'false');
        const res = await fetch(`${API_BASE}/api/voice/agent/audio`, {
          method: 'POST',
          body: form,
        });
        data = await res.json();
      } else {
        const res = await fetch(`${API_BASE}/api/voice/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, use_elevenlabs: false }),
        });
        data = await res.json();
      }
      setTranscript(data.transcript || q);
      setResponse(data.response || '');
      setResults(data.sources || []);
      if (data.audio_base64) {
        const mimeType = data.audio_mime_type || 'audio/wav';
        const blob = new Blob([Uint8Array.from(atob(data.audio_base64), (c) => c.charCodeAt(0))], {
          type: mimeType,
        });
        setAudioUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error(e);
      setResponse('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        runVoiceAgent('', blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (e) {
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0f] text-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 bg-[#0a0a0f]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h1 className="font-semibold tracking-wide">Voice Agent</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleIndex}
            disabled={indexing && indexStatus?.running}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${indexStatus?.running ? 'animate-spin' : ''}`} />
            Index Vault
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph area */}
        <div className="flex-1 relative">
          <div ref={graphRef} className="absolute inset-0" />
          {/* Overlay stats */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              {vaultFiles.length.toLocaleString()} files
            </div>
            {indexStatus?.message && (
              <div className="mt-1 text-cyan-300">{indexStatus.message}</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-[420px] border-l border-slate-800 bg-[#0f1117] flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-slate-800">
            <form onSubmit={onSearchSubmit} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your vault..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Voice panel */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" /> Voice Query
              </span>
              {recording && (
                <span className="text-xs text-red-400 animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full" /> Recording
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                  recording
                    ? 'bg-red-600 hover:bg-red-500 animate-pulse'
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div className="flex-1 text-sm text-slate-400">
                {recording
                  ? 'Listening... click to stop'
                  : 'Hold mic to ask your vault a question'}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcript && (
              <div className="bg-slate-900/60 border border-slate-800 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">You asked</div>
                <div className="text-sm text-slate-200">{transcript}</div>
              </div>
            )}

            {response && (
              <div className="bg-cyan-950/20 border border-cyan-900/40 rounded p-3">
                <div className="text-xs text-cyan-400 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Response
                </div>
                <div className="text-sm text-slate-200 leading-relaxed">{response}</div>
                {audioUrl && (
                  <div className="mt-3">
                    <audio controls src={audioUrl} className="w-full h-8" />
                  </div>
                )}
              </div>
            )}

            {loading && !response && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            )}

            {results.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Sources
                </div>
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 border border-slate-800 rounded p-3 hover:border-cyan-700 transition cursor-pointer"
                      onClick={() => {
                        // Open note in new tab via obsidian API
                        window.open(`${API_BASE}/api/obsidian/files/${encodeURIComponent(r.file_path)}?vault=main`, '_blank');
                      }}
                    >
                      <div className="text-sm font-medium text-slate-200">{r.title || r.file_path}</div>
                      <div className="text-xs text-slate-500 mt-1 truncate">{r.file_path}</div>
                      {r.score !== undefined && (
                        <div className="text-xs text-cyan-500 mt-1">Score: {(r.score * 100).toFixed(1)}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
