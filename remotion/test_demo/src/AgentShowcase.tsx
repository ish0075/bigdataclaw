import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

interface Step {
  frame: number;
  text: string;
}

interface AgentShowcaseProps {
  agentName: string;
  agentIcon: string;
  taskDescription: string;
  steps: Step[];
}

export const AgentShowcase: React.FC<AgentShowcaseProps> = ({
  agentName,
  agentIcon,
  taskDescription,
  steps
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // Background animation
  const backgroundProgress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 360],
    { extrapolateRight: 'clamp' }
  );
  
  // Agent icon bounce
  const iconY = interpolate(
    frame % 60,
    [0, 30, 60],
    [0, -20, 0],
    { easing: Easing.elastic(1) }
  );
  
  // Find current step
  const currentStep = steps.slice().reverse().find(s => frame >= s.frame);
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(${backgroundProgress}deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '50%',
            left: `${(i * 137.5) % 100}%`,
            top: `${((frame * 0.5 + i * 50) % 100)}%`,
            transform: `scale(${interpolate(frame % 100, [0, 50, 100], [0.5, 1.5, 0.5])})`
          }}
        />
      ))}
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div
          style={{
            fontSize: 120,
            transform: `translateY(${iconY}px)`,
            filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.5))'
          }}
        >
          {agentIcon}
        </div>
        <h1 style={{ fontSize: 48, margin: '20px 0', fontWeight: 700 }}>
          {agentName}
        </h1>
        <p style={{ fontSize: 24, opacity: 0.8, maxWidth: 600 }}>
          {taskDescription}
        </p>
      </div>
      
      {/* Progress indicator */}
      <div style={{ width: 600, marginBottom: 40 }}>
        <div
          style={{
            height: 8,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(frame / durationInFrames) * 100}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              borderRadius: 4,
              transition: 'width 0.1s linear'
            }}
          />
        </div>
      </div>
      
      {/* Current status */}
      {currentStep && (
        <div
          style={{
            padding: '20px 40px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            transform: `scale(${interpolate(
              frame % 30,
              [0, 15, 30],
              [0.95, 1.02, 1],
              { extrapolateRight: 'clamp' }
            )})`
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 8 }}>
            Current Status
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            {currentStep.text}
          </div>
        </div>
      )}
      
      {/* Footer branding */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(frame, [0, 30, durationInFrames - 30, durationInFrames], [0, 1, 1, 0])
        }}
      >
        <div style={{ fontSize: 18, opacity: 0.6 }}>
          Powered by BigDataClaw Mission Control
        </div>
        <div style={{ fontSize: 14, opacity: 0.4, marginTop: 8 }}>
          Autonomous CRE Intelligence
        </div>
      </div>
    </div>
  );
};
