# Bot Swarm Marketing Visualization Spec

## Overview
A cinematic, animated visualization of the Bot Boardroom showing AI agents collaborating in real-time with "Kimi Swarm" style effects.

---

## Core Visual Elements

### 1. Agent Card States

#### Idle State
- Subtle breathing animation (scale 1.0 → 1.01 → 1.0)
- Soft ambient glow matching team color
- Occasional skill badge shimmer

#### Active/Speaking State
```css
.agent-card.speaking {
  /* Glowing border animation */
  border: 2px solid var(--agent-color);
  box-shadow: 
    0 0 20px var(--agent-color-glow),
    0 0 40px var(--agent-color-glow),
    inset 0 0 20px var(--agent-color-glow);
  
  /* Pulse animation */
  animation: agent-pulse 1.5s ease-in-out infinite;
  
  /* Elevated */
  transform: translateY(-4px) scale(1.02);
  z-index: 10;
}

@keyframes agent-pulse {
  0%, 100% { 
    box-shadow: 0 0 20px var(--agent-color-glow);
  }
  50% { 
    box-shadow: 
      0 0 30px var(--agent-color-glow),
      0 0 60px var(--agent-color-glow);
  }
}
```

#### Working State
- Progress indicator overlay
- Skill badges cycle through "Using: [skill]"
- Mini activity graph in corner

---

### 2. Speech Bubble System

#### Typewriter Text Component
```jsx
const TypewriterText = ({ text, speed = 30, onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => prev + text[index]);
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      onComplete?.();
    }
  }, [index, text, speed]);
  
  return (
    <span className="typewriter">
      {displayed}
      <span className="cursor">▋</span>
    </span>
  );
};
```

#### Speech Bubble Styles
```css
.speech-bubble {
  position: absolute;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid var(--agent-color);
  border-radius: 16px;
  padding: 16px 20px;
  max-width: 300px;
  box-shadow: 
    0 10px 40px rgba(0,0,0,0.5),
    0 0 20px var(--agent-color-glow);
  
  /* Tail */
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 30px;
    border-width: 10px 10px 0;
    border-style: solid;
    border-color: var(--agent-color) transparent transparent;
  }
  
  /* Entrance animation */
  animation: bubble-in 0.3s ease-out;
}

@keyframes bubble-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

### 3. Connection Lines (Message Flow)

#### SVG Animated Path
```jsx
const ConnectionLine = ({ from, to, active, color }) => {
  const pathRef = useRef();
  
  // Calculate path between agent positions
  const path = `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${from.y - 50} ${to.x} ${to.y}`;
  
  return (
    <svg className="connection-overlay">
      <defs>
        <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={active ? "url(#line-gradient)" : "transparent"}
        strokeWidth="2"
        strokeDasharray="8,4"
      >
        {active && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="12"
            dur="0.4s"
            repeatCount="indefinite"
          />
        )}
      </path>
      
      {/* Particle traveling along path */}
      {active && (
        <circle r="4" fill={color}>
          <animateMotion dur="1s" repeatCount="indefinite">
            <mpath href={`#path-${from.id}-${to.id}`} />
          </animateMotion>
        </circle>
      )}
    </svg>
  );
};
```

---

### 4. Skill Visualization

#### Active Skill Highlight
```css
.skill-badge.active {
  position: relative;
  overflow: hidden;
  
  /* Glow effect */
  box-shadow: 0 0 15px currentColor;
  
  /* Shimmer animation */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.3),
      transparent
    );
    animation: shimmer 2s infinite;
  }
}

@keyframes shimmer {
  to { left: 100%; }
}
```

#### Skill Particles
```jsx
const SkillParticles = ({ skill, color }) => {
  return (
    <div className="skill-particles">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            '--delay': `${i * 0.2}s`,
            '--color': color,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

/* Particle rises and fades */
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--color);
  border-radius: 50%;
  animation: particle-rise 2s ease-out infinite;
  animation-delay: var(--delay);
}

@keyframes particle-rise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-40px) scale(0);
    opacity: 0;
  }
}
```

---

### 5. Task Progress Visualization

#### Progress Ring Overlay
```jsx
const TaskProgress = ({ progress, color }) => {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="progress-ring">
      <svg width="48" height="48">
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="#333"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="progress-text">{progress}%</span>
    </div>
  );
};
```

---

## Demo Scenarios

### Scenario 1: Property Deal Analysis
```javascript
const demoScenario = [
  {
    time: 0,
    agent: 'Taylor',
    action: 'speak',
    message: 'New deal alert: 1500 Michael Drive, Welland',
    duration: 3000
  },
  {
    time: 3500,
    agent: 'Parker',
    action: 'speak',
    message: 'Starting property analysis...',
    skills: ['property_analysis', 'comparable_sales'],
    progress: { start: 0, end: 100, duration: 5000 }
  },
  {
    time: 4000,
    agent: 'Scout',
    action: 'speak',
    message: 'Searching buyer database for matches...',
    connection: { from: 'Parker', to: 'Scout' },
    skills: ['buyer_matching', 'criteria_filtering']
  },
  {
    time: 8000,
    agent: 'Parker',
    action: 'complete',
    message: 'Analysis complete. Est. value: $2.1M'
  },
  {
    time: 9000,
    agent: 'Hunter',
    action: 'speak',
    message: 'Found 3 qualified cash buyers!',
    connection: { from: 'Scout', to: 'Hunter' }
  },
  {
    time: 12000,
    agent: 'Quinn',
    action: 'speak',
    message: 'Legal review passed ✓ No title issues.',
    skills: ['legal_review', 'title_search']
  },
  {
    time: 14000,
    agent: 'Scribe',
    action: 'speak',
    message: 'Generating deal briefing...',
    skills: ['content_creation', 'briefing_deck']
  },
  {
    time: 17000,
    all: true,
    action: 'consensus',
    message: 'Deal approved for presentation!'
  }
];
```

---

## Recording Setup

### Screen Recording Configuration
```bash
# Use OBS or similar
Resolution: 1920x1080
FPS: 60
Codec: H.264
Bitrate: 8000 kbps

# Audio
Background music: Ambient electronic, low volume
Sound effects: 
  - Message send: Soft "whoosh"
  - Task complete: Satisfying "ding"
  - Connection: Subtle electronic pulse
```

### Post-Production
```javascript
// Add cinematic elements in post
const postEffects = {
  intro: {
    duration: '0:03',
    text: 'NERVE Bot Boardroom',
    animation: 'Fade in + scale'
  },
  transitions: {
    betweenScenes: 'Smooth dissolve',
    agentFocus: 'Subtle zoom'
  },
  outro: {
    duration: '0:05',
    text: '16 AI Agents. 1 Mission.',
    cta: 'See the demo →'
  }
};
```

---

## Technical Implementation

### Component Structure
```jsx
<BotSwarmVisualization>
  <AgentGrid>
    {agents.map(agent => (
      <AgentCard 
        key={agent.id}
        agent={agent}
        state={agentStates[agent.id]} // idle | speaking | working
        progress={agentProgress[agent.id]}
        activeSkills={agentSkills[agent.id]}
      />
    ))}
  </AgentGrid>
  
  <ConnectionLayer>
    {activeConnections.map(conn => (
      <ConnectionLine {...conn} />
    ))}
  </ConnectionLayer>
  
  <SpeechBubbleLayer>
    {activeMessages.map(msg => (
      <SpeechBubble {...msg}>
        <TypewriterText text={msg.text} />
      </SpeechBubble>
    ))}
  </SpeechBubbleLayer>
  
  <ControlPanel>
    <ScenarioSelector scenarios={demoScenarios} />
    <PlaybackControls 
      play={playScenario}
      pause={pauseScenario}
      reset={resetScenario}
    />
  </ControlPanel>
</BotSwarmVisualization>
```

### Performance Optimizations
```javascript
// Use CSS transforms instead of layout properties
// GPU acceleration for animations
const optimizedStyles = {
  agentCard: {
    willChange: 'transform, box-shadow',
    transform: 'translateZ(0)', // Force GPU layer
  },
  speechBubble: {
    willChange: 'opacity, transform',
  },
  connectionLine: {
    willChange: 'stroke-dashoffset',
  }
};

// Memoize components
const MemoizedAgentCard = React.memo(AgentCard);
const MemoizedSpeechBubble = React.memo(SpeechBubble);
```

---

## Marketing Variations

### 1. "The Deal" (30 seconds)
Quick property deal scenario showing 4-5 agents collaborating

### 2. "The Swarm" (15 seconds)
All 16 agents lighting up simultaneously with skill showcase

### 3. "Deep Dive" (60 seconds)
Detailed walkthrough of one agent's skills and task completion

### 4. "Command Center" (20 seconds)
Commander dashboard + bot boardroom split screen

---

## Color Coding

| Team | Primary | Glow |
|------|---------|------|
| Core Analysis | Purple (#8B5CF6) | rgba(139,92,246,0.5) |
| Property Analysis | Blue (#3B82F6) | rgba(59,130,246,0.5) |
| Operations | Amber (#F59E0B) | rgba(245,158,11,0.5) |
| Sales & Marketing | Pink (#EC4899) | rgba(236,72,153,0.5) |
| Transaction | Green (#10B981) | rgba(16,185,129,0.5) |
| Specialized | Cyan (#06B6D4) | rgba(6,182,212,0.5) |

---

## Deliverables

1. **Interactive Demo** - Live on `/bot-boardroom?demo=swarm`
2. **Screen Recording** - 4 variations, 60fps
3. **GIF Animations** - Short loops for social media
4. **Screenshots** - Key frames for documentation
5. **Source Code** - Reusable components
