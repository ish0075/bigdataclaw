import React from 'react'

export default function KimiFemaleAvatar({ state = 'idle' }) {
  const isSpeaking = state === 'speaking'
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Background aura */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 ${
          isSpeaking
            ? 'bg-cyan-500/20 animate-pulse'
            : isListening
            ? 'bg-emerald-500/15'
            : isThinking
            ? 'bg-violet-500/15'
            : 'bg-cyan-500/5'
        }`}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/60 rounded-full animate-float"
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
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
          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Holographic base ring */}
        <ellipse
          cx="200"
          cy="360"
          rx="120"
          ry="20"
          fill="url(#glowGrad)"
          opacity={isSpeaking ? 0.6 : 0.3}
          className={isSpeaking ? 'animate-pulse' : ''}
        />

        {/* Shoulders */}
        <path
          d="M120 340 Q200 300 280 340 L280 400 L120 400 Z"
          fill="#1e293b"
          stroke="#22d3ee"
          strokeWidth="2"
          opacity="0.8"
        />
        <path
          d="M140 340 Q200 320 260 340"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Neck */}
        <rect x="185" y="280" width="30" height="60" fill="#f1d4c7" rx="8" />
        <ellipse cx="200" cy="310" rx="12" ry="8" fill="#e8c4b8" opacity="0.5" />

        {/* Face shape */}
        <ellipse cx="200" cy="200" rx="85" ry="100" fill="#f1d4c7" />
        <ellipse cx="200" cy="215" rx="75" ry="80" fill="#f8e4d8" />

        {/* Hair - back */}
        <path
          d="M115 180 Q100 250 110 320 Q130 340 150 320 L150 280 Q130 220 140 160 Z"
          fill="url(#hairGrad)"
        />
        <path
          d="M285 180 Q300 250 290 320 Q270 340 250 320 L250 280 Q270 220 260 160 Z"
          fill="url(#hairGrad)"
        />

        {/* Hair - top */}
        <path
          d="M115 180 Q120 100 200 90 Q280 100 285 180 Q290 220 260 200 Q240 160 200 150 Q160 160 140 200 Q110 220 115 180"
          fill="url(#hairGrad)"
          filter="url(#glow)"
        />
        <path
          d="M130 140 Q200 110 270 140"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Headset */}
        <path
          d="M110 200 Q110 120 200 110 Q290 120 290 200"
          fill="none"
          stroke="#334155"
          strokeWidth="12"
        />
        <rect x="105" y="185" width="20" height="35" rx="8" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
        <rect x="275" y="185" width="20" height="35" rx="8" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
        {/* Headset mic */}
        <path
          d="M285 205 Q285 250 240 265"
          fill="none"
          stroke="#334155"
          strokeWidth="4"
        />
        <circle cx="235" cy="265" r="6" fill="#22d3ee" className={isSpeaking ? 'animate-pulse' : ''} />

        {/* Eyebrows */}
        <path
          d="M155 175 Q170 165 185 175"
          fill="none"
          stroke="#8b5a47"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M215 175 Q230 165 245 175"
          fill="none"
          stroke="#8b5a47"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Eyes */}
        <g>
          <ellipse cx="170" cy="195" rx="14" ry="10" fill="#fff" />
          <circle cx="170" cy="195" r="7" fill="#0ea5e9" />
          <circle cx="170" cy="195" r="3" fill="#1e293b" />
          <circle cx="173" cy="192" r="2" fill="#fff" opacity="0.8" />
        </g>
        <g>
          <ellipse cx="230" cy="195" rx="14" ry="10" fill="#fff" />
          <circle cx="230" cy="195" r="7" fill="#0ea5e9" />
          <circle cx="230" cy="195" r="3" fill="#1e293b" />
          <circle cx="233" cy="192" r="2" fill="#fff" opacity="0.8" />
        </g>

        {/* Blink animation overlay */}
        {state !== 'speaking' && (
          <>
            <ellipse cx="170" cy="195" rx="14" ry="0.5" fill="#f1d4c7" className="animate-blink">
              <animate attributeName="ry" values="0.5;10;0.5" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="230" cy="195" rx="14" ry="0.5" fill="#f1d4c7" className="animate-blink">
              <animate attributeName="ry" values="0.5;10;0.5" dur="4s" repeatCount="indefinite" />
            </ellipse>
          </>
        )}

        {/* Nose */}
        <path
          d="M200 205 Q195 225 200 230 Q205 225 200 205"
          fill="#e8c4b8"
          opacity="0.6"
        />

        {/* Mouth - changes with state */}
        {isSpeaking ? (
          <g>
            <ellipse cx="200" cy="255" rx="18" ry="12" fill="#d4847c" />
            <ellipse cx="200" cy="258" rx="10" ry="5" fill="#b85c5c" opacity="0.6" />
            <rect x="182" y="249" width="36" height="6" rx="3" fill="#fff" opacity="0.9" />
          </g>
        ) : (
          <path
            d="M180 250 Q200 265 220 250"
            fill="none"
            stroke="#d4847c"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Cheeks */}
        <ellipse cx="150" cy="230" rx="12" ry="8" fill="#f4a4a4" opacity="0.3" />
        <ellipse cx="250" cy="230" rx="12" ry="8" fill="#f4a4a4" opacity="0.3" />

        {/* Holographic UI elements around face */}
        <g opacity="0.6">
          <rect x="120" y="140" width="8" height="8" fill="#22d3ee" rx="2" className="animate-pulse" />
          <rect x="272" y="140" width="8" height="8" fill="#22d3ee" rx="2" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <rect x="115" y="240" width="6" height="6" fill="#3b82f6" rx="1" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <rect x="279" y="240" width="6" height="6" fill="#3b82f6" rx="1" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
        </g>

        {/* Thinking sparkles */}
        {isThinking && (
          <g>
            {[...Array(4)].map((_, i) => (
              <polygon
                key={i}
                points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2"
                fill="#a78bfa"
                className="animate-twinkle"
                style={{
                  transform: `translate(${140 + i * 40}px, ${120 + (i % 2) * 20}px) scale(${0.6 + (i % 2) * 0.4})`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </g>
        )}
      </svg>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) opacity(0.6); }
          50% { transform: translateY(-20px) opacity(1); }
        }
        @keyframes subtleBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-subtleBounce {
          animation: subtleBounce 0.6s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
