import React from 'react'

export default function LobsterAvatar({ state = 'idle' }) {
  const isSpeaking = state === 'speaking'
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Background aura */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 ${
          isSpeaking
            ? 'bg-violet-500/20 animate-pulse'
            : isListening
            ? 'bg-emerald-500/15'
            : isThinking
            ? 'bg-fuchsia-500/15'
            : 'bg-violet-500/5'
        }`}
      />

      {/* Bubbles */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-violet-400/30 animate-bubble"
            style={{
              width: `${8 + i * 4}px`,
              height: `${8 + i * 4}px`,
              left: `${15 + i * 15}%`,
              bottom: '10%',
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${2.5 + i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 400 400"
        className={`w-full h-full max-w-[90%] max-h-[90%] transition-transform duration-500 ${
          isSpeaking ? 'animate-subtleBounce' : ''
        }`}
      >
        <defs>
          <linearGradient id="lobsterBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c026d3" />
            <stop offset="50%" stopColor="#a21caf" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="lobsterBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e879f9" />
            <stop offset="100%" stopColor="#c026d3" />
          </linearGradient>
          <linearGradient id="clawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
          <filter id="lobsterGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shadow base */}
        <ellipse
          cx="200"
          cy="360"
          rx="100"
          ry="18"
          fill="url(#lobsterBody)"
          opacity={isSpeaking ? 0.4 : 0.2}
          className={isSpeaking ? 'animate-pulse' : ''}
        />

        {/* Tail segments */}
        <ellipse cx="200" cy="320" rx="35" ry="25" fill="url(#lobsterBody)" />
        <ellipse cx="200" cy="290" rx="30" ry="22" fill="url(#lobsterBody)" />
        <ellipse cx="200" cy="265" rx="25" ry="18" fill="url(#lobsterBody)" />
        {/* Tail fan */}
        <path d="M175 335 Q160 360 170 370 L200 365 L230 370 Q240 360 225 335" fill="#7c3aed" />

        {/* Left big claw */}
        <g
          className={isSpeaking ? 'animate-clawWave' : ''}
          style={{ transformOrigin: '120px 220px' }}
        >
          <path
            d="M160 220 Q120 220 100 190 Q80 160 90 140 Q100 120 120 130 Q140 140 135 160 Q130 180 150 200 Z"
            fill="url(#clawGrad)"
            stroke="#7c3aed"
            strokeWidth="2"
          />
          <path
            d="M100 190 Q90 200 95 210 Q105 215 110 205"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Right big claw */}
        <g
          className={isSpeaking ? 'animate-clawWave2' : ''}
          style={{ transformOrigin: '280px 220px' }}
        >
          <path
            d="M240 220 Q280 220 300 190 Q320 160 310 140 Q300 120 280 130 Q260 140 265 160 Q270 180 250 200 Z"
            fill="url(#clawGrad)"
            stroke="#7c3aed"
            strokeWidth="2"
          />
          <path
            d="M300 190 Q310 200 305 210 Q295 215 290 205"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Left walking legs */}
        <path d="M170 250 Q140 270 130 300" fill="none" stroke="#a21caf" strokeWidth="6" strokeLinecap="round" />
        <path d="M180 270 Q155 295 145 320" fill="none" stroke="#a21caf" strokeWidth="5" strokeLinecap="round" />
        <path d="M190 285 Q170 310 165 335" fill="none" stroke="#a21caf" strokeWidth="4" strokeLinecap="round" />

        {/* Right walking legs */}
        <path d="M230 250 Q260 270 270 300" fill="none" stroke="#a21caf" strokeWidth="6" strokeLinecap="round" />
        <path d="M220 270 Q245 295 255 320" fill="none" stroke="#a21caf" strokeWidth="5" strokeLinecap="round" />
        <path d="M210 285 Q230 310 235 335" fill="none" stroke="#a21caf" strokeWidth="4" strokeLinecap="round" />

        {/* Main body / head */}
        <ellipse cx="200" cy="220" rx="55" ry="65" fill="url(#lobsterBody)" filter="url(#lobsterGlow)" />
        <ellipse cx="200" cy="230" rx="40" ry="45" fill="url(#lobsterBelly)" opacity="0.6" />

        {/* Belly segments */}
        <path d="M170 210 Q200 215 230 210" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.5" />
        <path d="M172 230 Q200 235 228 230" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.5" />
        <path d="M175 250 Q200 255 225 250" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.5" />

        {/* Eyes on stalks */}
        <line x1="175" y1="170" x2="165" y2="140" stroke="#c026d3" strokeWidth="5" strokeLinecap="round" />
        <line x1="225" y1="170" x2="235" y2="140" stroke="#c026d3" strokeWidth="5" strokeLinecap="round" />
        <circle cx="165" cy="135" r="14" fill="#fff" stroke="#a21caf" strokeWidth="2" />
        <circle cx="235" cy="135" r="14" fill="#fff" stroke="#a21caf" strokeWidth="2" />
        <circle cx="165" cy="135" r="8" fill="#1e293b" />
        <circle cx="235" cy="135" r="8" fill="#1e293b" />
        <circle cx="168" cy="132" r="3" fill="#fff" opacity="0.8" />
        <circle cx="238" cy="132" r="3" fill="#fff" opacity="0.8" />

        {/* Antennae */}
        <path
          d="M160 155 Q140 100 120 80"
          fill="none"
          stroke="#e879f9"
          strokeWidth="2"
          className={isListening ? 'animate-antennaWiggle' : ''}
        />
        <path
          d="M240 155 Q260 100 280 80"
          fill="none"
          stroke="#e879f9"
          strokeWidth="2"
          className={isListening ? 'animate-antennaWiggle' : ''}
          style={{ animationDelay: '0.2s' }}
        />

        {/* Sunglasses */}
        <g>
          <rect x="150" y="175" width="45" height="28" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="205" y="175" width="45" height="28" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <line x1="195" y1="185" x2="205" y2="185" stroke="#334155" strokeWidth="3" />
          <line x1="150" y1="182" x2="140" y2="175" stroke="#334155" strokeWidth="2" />
          <line x1="250" y1="182" x2="260" y2="175" stroke="#334155" strokeWidth="2" />
          {/* Reflection on sunglasses */}
          <ellipse cx="170" cy="185" rx="8" ry="4" fill="#22d3ee" opacity="0.3" transform="rotate(-15 170 185)" />
          <ellipse cx="225" cy="185" rx="8" ry="4" fill="#22d3ee" opacity="0.3" transform="rotate(-15 225 185)" />
        </g>

        {/* Mouth - big smile */}
        {isSpeaking ? (
          <g>
            <path
              d="M175 255 Q200 280 225 255"
              fill="#7c2d12"
              stroke="#9a3412"
              strokeWidth="2"
            />
            <path
              d="M180 258 Q200 270 220 258"
              fill="#fb7185"
              opacity="0.6"
            />
            {/* Teeth */}
            <rect x="188" y="255" width="8" height="6" rx="1" fill="#fff" />
            <rect x="198" y="256" width="8" height="6" rx="1" fill="#fff" />
            <rect x="208" y="255" width="8" height="6" rx="1" fill="#fff" />
          </g>
        ) : (
          <path
            d="M175 255 Q200 275 225 255"
            fill="none"
            stroke="#7c2d12"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Thinking bubbles */}
        {isThinking && (
          <g className="animate-thinkBubble">
            <circle cx="280" cy="100" r="4" fill="#a78bfa" />
            <circle cx="295" cy="85" r="6" fill="#a78bfa" />
            <circle cx="315" cy="65" r="10" fill="#c4b5fd" opacity="0.8" />
            <text x="315" y="70" textAnchor="middle" fontSize="10" fill="#5b21b6">?</text>
          </g>
        )}

        {/* Cool sparkles around body */}
        <g opacity="0.5">
          <polygon points="100,200 102,206 108,208 102,210 100,216 98,210 92,208 98,206" fill="#f0abfc" className="animate-twinkle" />
          <polygon points="300,200 302,206 308,208 302,210 300,216 298,210 292,208 298,206" fill="#f0abfc" className="animate-twinkle" style={{ animationDelay: '0.5s' }} />
        </g>
      </svg>

      <style>{`
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-60px) scale(1.3); opacity: 0; }
        }
        @keyframes subtleBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes clawWave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
        @keyframes clawWave2 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes antennaWiggle {
          0%, 100% { d: path('M160 155 Q140 100 120 80'); }
          50% { d: path('M160 155 Q135 95 115 75'); }
        }
        @keyframes thinkBubble {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-5px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-bubble {
          animation: bubble 2.5s ease-in infinite;
        }
        .animate-subtleBounce {
          animation: subtleBounce 0.6s ease-in-out infinite;
        }
        .animate-clawWave {
          animation: clawWave 0.8s ease-in-out infinite;
          transform-origin: 120px 220px;
        }
        .animate-clawWave2 {
          animation: clawWave2 0.8s ease-in-out infinite;
          transform-origin: 280px 220px;
        }
        .animate-antennaWiggle {
          animation: antennaWiggle 0.4s ease-in-out infinite;
        }
        .animate-thinkBubble {
          animation: thinkBubble 1.5s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
