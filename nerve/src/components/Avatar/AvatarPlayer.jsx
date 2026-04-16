import React, { useRef, useEffect } from 'react'
import KimiFemaleAvatar from './KimiFemaleAvatar'
import LobsterAvatar from './LobsterAvatar'

const STATE_META = {
  idle: {
    ring: 'border-slate-600/30',
    glow: 'shadow-[0_0_60px_-10px_rgba(6,182,212,0.25)]',
    pulse: 'animate-[breathe_4s_ease-in-out_infinite]',
    bars: false,
    labelColor: 'text-slate-400',
  },
  listening: {
    ring: 'border-emerald-400/60',
    glow: 'shadow-[0_0_80px_-5px_rgba(52,211,153,0.5)]',
    pulse: 'animate-[listenPulse_1.2s_ease-in-out_infinite]',
    bars: false,
    labelColor: 'text-emerald-400',
  },
  thinking: {
    ring: 'border-violet-400/60',
    glow: 'shadow-[0_0_80px_-5px_rgba(167,139,250,0.5)]',
    pulse: 'animate-[thinkSpin_3s_linear_infinite]',
    bars: false,
    labelColor: 'text-violet-400',
  },
  speaking: {
    ring: 'border-cyan-400/70',
    glow: 'shadow-[0_0_100px_0_rgba(34,211,238,0.6)]',
    pulse: 'animate-[speakBounce_0.6s_ease-in-out_infinite]',
    bars: true,
    labelColor: 'text-cyan-400',
  },
}

const SVG_AVATARS = {
  'kimi-female': KimiFemaleAvatar,
  'openclaw-lobster': LobsterAvatar,
}

const ACCENT_STYLES = {
  cyan: {
    speakingRing: 'border-cyan-400/70',
    speakingGlow: 'shadow-[0_0_100px_0_rgba(34,211,238,0.6)]',
    bars: 'bg-cyan-400/80',
    label: 'text-cyan-400',
  },
  violet: {
    speakingRing: 'border-violet-400/70',
    speakingGlow: 'shadow-[0_0_100px_0_rgba(167,139,250,0.6)]',
    bars: 'bg-violet-400/80',
    label: 'text-violet-400',
  },
}

export default function AvatarPlayer({ character = 'da-da', state = 'idle', label, accent = 'cyan' }) {
  const videoRef = useRef(null)
  const meta = STATE_META[state] || STATE_META.idle
  const SvgAvatar = SVG_AVATARS[character]
  const accentStyle = ACCENT_STYLES[accent] || ACCENT_STYLES.cyan

  // Dynamic classes based on accent and state
  const ringClass = state === 'speaking' ? accentStyle.speakingRing : meta.ring
  const glowClass = state === 'speaking' ? accentStyle.speakingGlow : meta.glow
  const labelClass = state === 'speaking' ? accentStyle.label : meta.labelColor

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = state === 'speaking' ? 1.1 : state === 'thinking' ? 0.85 : 1
    }
  }, [state])

  return (
    <div className={`relative flex flex-col items-center justify-center ${meta.pulse}`}>
      {/* Outer glow rings */}
      <div className={`absolute inset-0 rounded-full border-2 ${ringClass} transition-all duration-700 ${state === 'listening' ? 'scale-110 opacity-100' : 'scale-100 opacity-60'}`} />
      {state === 'listening' && (
        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
      )}
      {state === 'thinking' && (
        <>
          <div className="absolute -inset-4 rounded-full border border-violet-500/20 animate-[spin_8s_linear_infinite]" />
          <div className="absolute -inset-8 rounded-full border border-violet-500/10 animate-[spinReverse_12s_linear_infinite]" />
        </>
      )}

      {/* Avatar container */}
      <div className={`relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-4 border-slate-800/80 bg-slate-900 ${glowClass} transition-all duration-500`}>
        {SvgAvatar ? (
          <SvgAvatar state={state} />
        ) : (
          <video
            ref={videoRef}
            src={`/members/${character}/character.webm`}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        {/* Vignette overlay */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] pointer-events-none" />
      </div>

      {/* Sound-wave bars when speaking */}
      {meta.bars && (
        <div className="absolute -bottom-10 flex items-end gap-1 h-10">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full animate-[soundBar_0.5s_ease-in-out_infinite_alternate] ${accentStyle.bars}`}
              style={{ height: '20%', animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      )}

      {/* Status label */}
      {label && (
        <div className={`mt-10 text-sm md:text-base font-medium tracking-wide uppercase ${labelClass} transition-colors duration-300`}>
          {label}
        </div>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes listenPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes thinkSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.02); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes speakBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes soundBar {
          0% { height: 20%; opacity: 0.5; }
          100% { height: 100%; opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
