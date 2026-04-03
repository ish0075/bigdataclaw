#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           VIDEO PRODUCTION AGENT - Remotion-powered Marketing Videos         ║
║                                                                              ║
║  Creates screen recordings, demo videos, and marketing content using:       ║
║  • Remotion for programmatic video generation                               ║
║  • Puppeteer for screen capture                                             ║
║  • FFmpeg for video editing                                                 ║
║  • Automated agent performance recording                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import json
import subprocess
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path


@dataclass
class VideoProject:
    """Represents a video production project"""
    id: str
    title: str
    video_type: str  # 'demo', 'tutorial', 'showcase', 'report'
    target_agent: Optional[str]
    duration: int  # seconds
    resolution: str  # '1920x1080', '1080x1920' (vertical), etc.
    status: str  # 'pending', 'recording', 'editing', 'rendering', 'completed'
    output_path: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    metadata: Dict


class VideoProductionAgent:
    """
    Marketing Video Production Agent
    
    Capabilities:
    - Screen record agents performing tasks
    - Generate Remotion videos from templates
    - Create marketing demos and tutorials
    - Produce project completion reports
    """
    
    def __init__(self, output_dir: str = "./marketing_videos"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.remotion_dir = Path("./remotion")
        self.templates_dir = self.remotion_dir / "templates"
        
        self.active_projects: Dict[str, VideoProject] = {}
        self.video_history: List[VideoProject] = []
        
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create necessary directory structure"""
        dirs = [
            self.output_dir / "demos",
            self.output_dir / "tutorials",
            self.output_dir / "showcases",
            self.output_dir / "reports",
            self.output_dir / "raw_recordings",
            self.output_dir / "final",
        ]
        for d in dirs:
            d.mkdir(exist_ok=True)
    
    # ═══════════════════════════════════════════════════════════════════════
    # SCREEN RECORDING CAPABILITIES
    # ═══════════════════════════════════════════════════════════════════════
    
    async def record_agent_screen(
        self,
        agent_id: str,
        task_description: str,
        duration: int = 60,
        capture_ui: bool = True,
        capture_terminal: bool = True,
        output_name: Optional[str] = None
    ) -> str:
        """
        Record an agent's screen while performing a task
        
        Args:
            agent_id: The agent to record (e.g., 'transaction-scout')
            task_description: What the agent is doing
            duration: Recording duration in seconds
            capture_ui: Record browser UI
            capture_terminal: Record terminal output
            output_name: Custom output filename
            
        Returns:
            Path to recorded video file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_name = output_name or f"{agent_id}_{timestamp}"
        output_path = self.output_dir / "raw_recordings" / f"{output_name}.mp4"
        
        print(f"🎥 Starting screen recording for {agent_id}...")
        print(f"   Task: {task_description}")
        print(f"   Duration: {duration}s")
        
        # Use ffmpeg for screen capture
        # This captures the entire screen, can be modified for specific windows
        cmd = [
            "ffmpeg",
            "-f", "x11grab",  # Linux screen capture
            "-video_size", "1920x1080",
            "-framerate", "30",
            "-i", ":0.0",  # Display :0
            "-f", "pulse",  # Audio (optional)
            "-i", "default",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "23",
            "-t", str(duration),
            "-y",  # Overwrite if exists
            str(output_path)
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Monitor recording progress
            for i in range(duration):
                await asyncio.sleep(1)
                if i % 10 == 0:
                    print(f"   Recording... {i}/{duration}s")
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                print(f"✅ Recording saved: {output_path}")
                return str(output_path)
            else:
                print(f"❌ Recording failed: {stderr.decode()}")
                return ""
                
        except Exception as e:
            print(f"❌ Error during recording: {e}")
            return ""
    
    async def record_browser_session(
        self,
        url: str,
        actions: List[Dict],
        output_name: str,
        viewport: Tuple[int, int] = (1920, 1080)
    ) -> str:
        """
        Record a browser session with automated actions
        
        Args:
            url: Starting URL
            actions: List of actions to perform
                    [{"type": "click", "selector": "#btn"}, 
                     {"type": "type", "selector": "#input", "text": "hello"}]
            output_name: Output filename
            viewport: (width, height)
            
        Returns:
            Path to recorded video
        """
        output_path = self.output_dir / "raw_recordings" / f"{output_name}.mp4"
        
        # Use Puppeteer for browser automation + recording
        puppeteer_script = f"""
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');

(async () => {{
    const browser = await puppeteer.launch({{
        headless: false,
        defaultViewport: {{ width: {viewport[0]}, height: {viewport[1]} }}
    }});
    
    const page = await browser.newPage();
    await page.goto('{url}');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Perform actions
    const actions = {json.dumps(actions)};
    
    for (const action of actions) {{
        switch(action.type) {{
            case 'click':
                await page.click(action.selector);
                break;
            case 'type':
                await page.type(action.selector, action.text);
                break;
            case 'wait':
                await page.waitForTimeout(action.duration);
                break;
            case 'navigate':
                await page.goto(action.url);
                break;
        }}
        await page.waitForTimeout(500);
    }}
    
    await browser.close();
}})();
"""
        
        # Save and execute puppeteer script
        script_path = self.output_dir / "temp_puppeteer.js"
        with open(script_path, 'w') as f:
            f.write(puppeteer_script)
        
        # Run puppeteer with ffmpeg screen capture
        # This is a simplified version - full implementation would integrate
        # puppeteer-screen-recorder or similar
        
        print(f"🌐 Recording browser session: {url}")
        print(f"   Actions: {len(actions)} steps")
        print(f"   Output: {output_path}")
        
        # Placeholder for actual implementation
        # Would need puppeteer-screen-recorder package
        
        return str(output_path)
    
    # ═══════════════════════════════════════════════════════════════════════
    # REMOTION VIDEO GENERATION
    # ═══════════════════════════════════════════════════════════════════════
    
    def create_remotion_project(self, project_name: str, template: str = "agent-showcase") -> str:
        """
        Create a new Remotion video project
        
        Args:
            project_name: Name of the video project
            template: Template to use ('agent-showcase', 'tutorial', 'demo-reel')
            
        Returns:
            Path to Remotion project directory
        """
        project_dir = self.remotion_dir / project_name
        project_dir.mkdir(parents=True, exist_ok=True)
        
        # Create Remotion project structure
        self._create_remotion_template(project_dir, template)
        
        print(f"🎬 Created Remotion project: {project_name}")
        print(f"   Template: {template}")
        print(f"   Location: {project_dir}")
        
        return str(project_dir)
    
    def _create_remotion_template(self, project_dir: Path, template: str):
        """Create Remotion template files"""
        
        # Ensure src directory exists
        src_dir = project_dir / "src"
        src_dir.mkdir(parents=True, exist_ok=True)
        
        # package.json
        package_json = {
            "name": project_dir.name,
            "version": "1.0.0",
            "dependencies": {
                "remotion": "^4.0.0",
                "@remotion/cli": "^4.0.0",
                "@remotion/player": "^4.0.0"
            },
            "scripts": {
                "start": "remotion studio",
                "build": "remotion render",
                "upgrade": "remotion upgrade"
            }
        }
        
        with open(project_dir / "package.json", 'w') as f:
            json.dump(package_json, f, indent=2)
        
        # Root.tsx - Main composition
        root_tsx = """import { Composition } from 'remotion';
import { AgentShowcase } from './AgentShowcase';
import './styles.css';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AgentShowcase"
        component={AgentShowcase}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          agentName: "Transaction Scout",
          agentIcon: "🎯",
          taskDescription: "Searching for recent commercial real estate transactions",
          steps: [
            { frame: 0, text: "Initializing search..." },
            { frame: 90, text: "Querying database..." },
            { frame: 180, text: "Found 47 transactions" },
            { frame: 270, text: "Analyzing matches..." },
            { frame: 450, text: "Complete! 12 hot money leads identified" }
          ]
        }}
      />
    </>
  );
};
"""
        
        with open(project_dir / "src" / "Root.tsx", 'w') as f:
            project_dir.joinpath("src").mkdir(exist_ok=True)
            f.write(root_tsx)
        
        # AgentShowcase.tsx - Main video component
        agent_showcase_tsx = """import React from 'react';
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
"""
        
        with open(project_dir / "src" / "AgentShowcase.tsx", 'w') as f:
            f.write(agent_showcase_tsx)
        
        # styles.css
        styles_css = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
}
"""
        
        with open(project_dir / "src" / "styles.css", 'w') as f:
            f.write(styles_css)
        
        print(f"   Created template files")
    
    def render_remotion_video(
        self,
        project_dir: str,
        composition_id: str = "AgentShowcase",
        output_filename: Optional[str] = None
    ) -> str:
        """
        Render a Remotion video
        
        Args:
            project_dir: Path to Remotion project
            composition_id: Composition to render
            output_filename: Output filename
            
        Returns:
            Path to rendered video
        """
        project_path = Path(project_dir)
        output_filename = output_filename or f"{composition_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        output_path = self.output_dir / "final" / output_filename
        
        print(f"🎬 Rendering Remotion video...")
        print(f"   Project: {project_dir}")
        print(f"   Composition: {composition_id}")
        print(f"   Output: {output_path}")
        
        # Run remotion render command
        cmd = [
            "npx", "remotion", "render",
            str(project_path / "src" / "Root.tsx"),
            composition_id,
            str(output_path)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                cwd=project_dir,
                capture_output=True,
                text=True,
                check=True
            )
            
            print(f"✅ Video rendered successfully!")
            print(f"   File: {output_path}")
            
            return str(output_path)
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Rendering failed: {e.stderr}")
            return ""
    
    # ═══════════════════════════════════════════════════════════════════════

    # ═══════════════════════════════════════════════════════════════════════
    # MARKETING VIDEO TEMPLATES
    # ═══════════════════════════════════════════════════════════════════════
    
    def create_agent_demo_video(
        self,
        agent_id: str,
        agent_name: str,
        agent_icon: str,
        task_description: str,
        duration: int = 30
    ) -> str:
        """
        Create a demo video showcasing an agent's capabilities
        
        Returns:
            Path to generated video
        """
        project_name = f"{agent_id}_demo_{datetime.now().strftime('%Y%m%d')}"
        project_dir = self.create_remotion_project(project_name, "agent-showcase")
        
        # Generate steps based on agent type
        steps = self._generate_agent_steps(agent_id, duration)
        
        # Update composition props
        props = {
            "agentName": agent_name,
            "agentIcon": agent_icon,
            "taskDescription": task_description,
            "steps": steps
        }
        
        print(f"🎥 Creating demo video for {agent_name}...")
        print(f"   Duration: {duration}s")
        print(f"   Steps: {len(steps)}")
        
        # Render the video
        output_path = self.render_remotion_video(
            project_dir,
            "AgentShowcase",
            f"{agent_id}_demo.mp4"
        )
        
        return output_path
    
    def _generate_agent_steps(self, agent_id: str, duration: int) -> List[Dict]:
        """Generate realistic agent steps for demo video"""
        
        agent_scripts = {
            "transaction-scout": [
                (0, "Initializing Transaction Scout..."),
                (3, "Connecting to property database..."),
                (6, "Querying recent sales (90 days)..."),
                (10, "Found 47 transactions in Niagara region"),
                (15, "Analyzing asset class distribution..."),
                (18, "Filtering by deal size ($2M-$10M)..."),
                (22, "Cross-referencing buyer database..."),
                (26, "Identifying repeat purchasers..."),
                (30, "✅ Complete! 12 hot prospects found")
            ],
            "hot-money-tracker": [
                (0, "Activating Hot Money Radar..."),
                (3, "Scanning for recent sellers..."),
                (6, "Analyzing 47 recent transactions..."),
                (10, "Calculating capital positions..."),
                (15, "Flagging entities with >$5M cash..."),
                (18, "Cross-checking reinvestment patterns..."),
                (22, "Verifying contact information..."),
                (26, "Prioritizing by match score..."),
                (30, "🔥 3 hot money alerts generated!")
            ],
            "portfolio-analyzer": [
                (0, "Loading Portfolio Analyzer..."),
                (3, "Querying buyer portfolios..."),
                (6, "Matching asset class preferences..."),
                (10, "Analyzing geographic overlap..."),
                (15, "Calculating typical deal sizes..."),
                (18, "Scoring portfolio alignment..."),
                (22, "Ranking by investment criteria..."),
                (26, "Generating match report..."),
                (30, "📊 Top 5 buyer matches ready")
            ]
        }
        
        script = agent_scripts.get(agent_id, agent_scripts["transaction-scout"])
        
        # Convert to frames (30fps)
        steps = []
        for seconds, text in script:
            steps.append({
                "frame": seconds * 30,
                "text": text
            })
        
        return steps
    
    def create_tutorial_video(
        self,
        title: str,
        topic: str,
        steps: List[str],
        duration: int = 60
    ) -> str:
        """
        Create an educational tutorial video
        
        Args:
            title: Video title
            topic: Tutorial topic
            steps: List of tutorial steps
            duration: Video duration in seconds
            
        Returns:
            Path to generated video
        """
        project_name = f"tutorial_{topic.replace(' ', '_').lower()}"
        project_dir = self.create_remotion_project(project_name, "tutorial")
        
        # Generate tutorial-specific composition
        print(f"📚 Creating tutorial: {title}")
        print(f"   Steps: {len(steps)}")
        
        # Convert steps to frames
        step_frames = []
        frames_per_step = (duration * 30) // len(steps)
        
        for i, step_text in enumerate(steps):
            step_frames.append({
                "frame": i * frames_per_step,
                "text": f"Step {i+1}: {step_text}"
            })
        
        # Render
        output_path = self.render_remotion_video(
            project_dir,
            "Tutorial",
            f"tutorial_{topic.replace(' ', '_')}.mp4"
        )
        
        return output_path
    
    def create_marketing_showcase(
        self,
        title: str = "BigDataClaw Mission Control",
        subtitle: str = "AI-Powered CRE Intelligence",
        features: List[str] = None
    ) -> str:
        """
        Create a marketing showcase video highlighting platform features
        
        Returns:
            Path to generated video
        """
        features = features or [
            "6-Phase Agent Pipeline",
            "Real-Time Hot Money Radar",
            "Portfolio Matching Engine",
            "Obsidian Vault Integration",
            "96K Agent Database",
            "$1.56M ARR Target"
        ]
        
        project_name = f"showcase_{datetime.now().strftime('%Y%m%d')}"
        project_dir = self.create_remotion_project(project_name, "showcase")
        
        print(f"🎬 Creating marketing showcase...")
        print(f"   Features: {len(features)}")
        
        # This would create a feature-carousel composition
        # For now, use the agent showcase with custom props
        
        output_path = self.render_remotion_video(
            project_dir,
            "AgentShowcase",
            "bigdataclaw_showcase.mp4"
        )
        
        return output_path
    
    # ═══════════════════════════════════════════════════════════════════════
    # PROJECT DELIVERY & REPORTING
    # ═══════════════════════════════════════════════════════════════════════
    
    def generate_project_report(
        self,
        project_id: str,
        agent_id: str,
        task_summary: str,
        metrics: Dict,
        video_path: Optional[str] = None
    ) -> str:
        """
        Generate a comprehensive project completion report with video
        
        Args:
            project_id: Unique project identifier
            agent_id: Agent that completed the work
            task_summary: Description of work completed
            metrics: Performance metrics
            video_path: Path to screen recording/demonstration video
            
        Returns:
            Path to generated report (Markdown + embedded video)
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        report = f"""# Project Completion Report

**Project ID:** {project_id}  
**Completed By:** {agent_id}  
**Date:** {timestamp}  
**Status:** ✅ COMPLETED

---

## 📋 Task Summary

{task_summary}

---

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| **Duration** | {metrics.get('duration', 'N/A')} |
| **Records Processed** | {metrics.get('records_processed', 'N/A')} |
| **Success Rate** | {metrics.get('success_rate', 'N/A')}% |
| **Efficiency Score** | {metrics.get('efficiency', 'N/A')}/100 |
| **Cost** | ${metrics.get('cost', 0):.2f} |

---

## 🎥 Video Documentation

"""
        
        if video_path:
            report += f"""### Screen Recording

A video recording of this agent performing the task has been generated:

**Video File:** `{video_path}`

**Video Details:**
- Format: MP4 (1080p)
- Duration: {metrics.get('duration', 'N/A')}
- Size: {self._get_file_size(video_path)}

<video controls width="100%">
  <source src="{video_path}" type="video/mp4">
  Your browser does not support the video tag.
</video>

---

"""
        
        report += f"""## 📈 Results

{metrics.get('results_summary', 'Task completed successfully.')}

---

## 🎯 Key Achievements

"""
        
        achievements = metrics.get('achievements', [])
        for achievement in achievements:
            report += f"- ✅ {achievement}\n"
        
        report += f"""

---

## 🔄 Next Steps

"""
        
        next_steps = metrics.get('next_steps', ['Review results', 'Archive project'])
        for i, step in enumerate(next_steps, 1):
            report += f"{i}. {step}\n"
        
        report += f"""

---

*Report generated by Video Production Agent*  
*BigDataClaw Mission Control - Marketing Division*
"""
        
        # Save report
        report_path = self.output_dir / "reports" / f"{project_id}_report.md"
        with open(report_path, 'w') as f:
            f.write(report)
        
        print(f"📄 Project report generated: {report_path}")
        
        return str(report_path)
    
    def _get_file_size(self, file_path: str) -> str:
        """Get human-readable file size"""
        try:
            size = os.path.getsize(file_path)
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024:
                    return f"{size:.1f} {unit}"
                size /= 1024
            return f"{size:.1f} TB"
        except:
            return "Unknown"
    
    def create_batch_demo_reel(
        self,
        agent_ids: List[str],
        output_name: str = "bigdataclaw_demo_reel"
    ) -> str:
        """
        Create a demo reel showcasing multiple agents
        
        Args:
            agent_ids: List of agent IDs to feature
            output_name: Output filename
            
        Returns:
            Path to demo reel video
        """
        print(f"🎬 Creating batch demo reel...")
        print(f"   Agents: {len(agent_ids)}")
        
        # Generate individual agent demos
        segment_paths = []
        for agent_id in agent_ids:
            agent_info = self._get_agent_info(agent_id)
            segment_path = self.create_agent_demo_video(
                agent_id=agent_id,
                agent_name=agent_info['name'],
                agent_icon=agent_info['icon'],
                task_description=agent_info['description'],
                duration=15  # Shorter for reel
            )
            if segment_path:
                segment_paths.append(segment_path)
        
        # Concatenate videos using FFmpeg
        if len(segment_paths) > 1:
            return self._concatenate_videos(segment_paths, output_name)
        elif segment_paths:
            return segment_paths[0]
        
        return ""
    
    def _get_agent_info(self, agent_id: str) -> Dict:
        """Get agent information for demos"""
        agent_info = {
            "transaction-scout": {
                "name": "Transaction Scout",
                "icon": "🎯",
                "description": "Finds recent commercial real estate transactions"
            },
            "hot-money-tracker": {
                "name": "Hot Money Tracker",
                "icon": "🔥",
                "description": "Identifies sellers with fresh capital"
            },
            "portfolio-analyzer": {
                "name": "Portfolio Analyzer",
                "icon": "💼",
                "description": "Matches buyer portfolios to opportunities"
            },
            "agent-finder": {
                "name": "Agent Finder",
                "icon": "👤",
                "description": "Sources active commercial brokers"
            },
            "lender-matcher": {
                "name": "Lender Matcher",
                "icon": "🏦",
                "description": "Matches financing sources to deals"
            }
        }
        
        return agent_info.get(agent_id, {
            "name": agent_id.replace("-", " ").title(),
            "icon": "🤖",
            "description": "BigDataClaw autonomous agent"
        })
    
    def _concatenate_videos(self, video_paths: List[str], output_name: str) -> str:
        """Concatenate multiple videos using FFmpeg"""
        output_path = self.output_dir / "final" / f"{output_name}.mp4"
        
        # Create concat list file
        list_file = self.output_dir / "concat_list.txt"
        with open(list_file, 'w') as f:
            for path in video_paths:
                f.write(f"file '{path}'\n")
        
        # Concatenate
        cmd = [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", str(list_file),
            "-c", "copy",
            str(output_path)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"✅ Demo reel created: {output_path}")
            return str(output_path)
        except subprocess.CalledProcessError as e:
            print(f"❌ Concatenation failed: {e}")
            return ""


# ═══════════════════════════════════════════════════════════════════════════════
# STANDALONE EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """Demo video production capabilities"""
    agent = VideoProductionAgent()
    
    print("=" * 70)
    print("🎬 VIDEO PRODUCTION AGENT - Demo")
    print("=" * 70)
    print()
    
    # Create a demo video for Transaction Scout
    video_path = agent.create_agent_demo_video(
        agent_id="transaction-scout",
        agent_name="Transaction Scout",
        agent_icon="🎯",
        task_description="Searching for recent commercial real estate transactions in target market",
        duration=30
    )
    
    # Generate project report
    if video_path:
        report_path = agent.generate_project_report(
            project_id="demo_txn_scout_001",
            agent_id="transaction-scout",
            task_summary="Completed transaction search for industrial properties in Niagara region",
            metrics={
                "duration": "30 seconds",
                "records_processed": 641,
                "success_rate": 94.3,
                "efficiency": 87,
                "cost": 0.15,
                "results_summary": "Found 47 recent transactions, identified 12 hot money prospects",
                "achievements": [
                    "Processed 641 transaction records",
                    "Identified 12 high-priority hot money leads",
                    "Cross-referenced 15,285 buyer profiles",
                    "Generated match scores >80% for 8 prospects"
                ],
                "next_steps": [
                    "Review hot money leads in dashboard",
                    "Export results to Obsidian vault",
                    "Schedule outreach to top 3 prospects",
                    "Archive completed mission"
                ]
            },
            video_path=video_path
        )
        
        print()
        print("=" * 70)
        print("✅ DEMO COMPLETE")
        print("=" * 70)
        print(f"Video: {video_path}")
        print(f"Report: {report_path}")


if __name__ == "__main__":
    main()
