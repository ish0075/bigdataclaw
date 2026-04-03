#!/usr/bin/env python3
"""
BigDataClaw Pixel Office - Video Production Workflow
Automated marketing video generation using the Pablo De Lucca style pixel office

Usage:
    python video_production_workflow.py --scene intro --duration 10
    python video_production_workflow.py --scene stayner_deal --duration 30
    python video_production_workflow.py --scene hot_money --duration 15
"""

import argparse
import subprocess
import time
import os
from datetime import datetime

# Video scene configurations
SCENES = {
    "intro": {
        "description": "BigDataClaw logo reveal with agents booting up",
        "url": "http://localhost:8083/pixel-office-cinematic.html",
        "duration": 10,
        "output": "bigdataclaw_intro.mp4"
    },
    "office_overview": {
        "description": "Full office view showing all 10 agents working",
        "url": "http://localhost:8083/pixel-office.html",
        "duration": 20,
        "output": "office_overview.mp4"
    },
    "stayner_deal": {
        "description": "Stayner $18M deal execution - all agents collaborating",
        "url": "http://localhost:8083/pixel-office-cinematic.html",
        "duration": 30,
        "output": "stayner_deal_execution.mp4",
        "trigger_event": "stayner"
    },
    "hot_money": {
        "description": "Hot Money Tracker detecting motivated seller",
        "url": "http://localhost:8083/pixel-office-cinematic.html", 
        "duration": 15,
        "output": "hot_money_alert.mp4",
        "trigger_event": "hot_money"
    },
    "agent_focus": {
        "description": "Individual agent showcase - pick specific agent",
        "url": "http://localhost:8083/pixel-office.html",
        "duration": 10,
        "output": "agent_focus.mp4"
    },
    "task_execution": {
        "description": "Fast-paced task completion montage",
        "url": "http://localhost:8083/pixel-office-cinematic.html",
        "duration": 20,
        "output": "task_montage.mp4"
    }
}

def check_dependencies():
    """Check if required tools are installed"""
    deps = ["ffmpeg", "chromium-browser"]
    missing = []
    
    for dep in deps:
        result = subprocess.run(
            ["which", dep],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            missing.append(dep)
    
    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print("Install with: sudo apt-get install ffmpeg chromium-browser")
        return False
    
    return True

def record_scene(scene_config, output_dir="./marketing/videos"):
    """Record a specific scene using ffmpeg"""
    
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, scene_config["output"])
    duration = scene_config["duration"]
    
    print(f"\n🎬 Recording: {scene_config['description']}")
    print(f"   Duration: {duration}s")
    print(f"   Output: {output_path}")
    
    # Build ffmpeg command for screen recording
    # This captures the browser window
    cmd = [
        "ffmpeg",
        "-f", "x11grab",           # X11 screen capture
        "-video_size", "1920x1080", # Full HD
        "-framerate", "30",        # 30fps
        "-i", ":0.0",              # Display :0
        "-t", str(duration),       # Duration
        "-c:v", "libx264",         # H.264 codec
        "-preset", "fast",         # Encoding speed
        "-pix_fmt", "yuv420p",     # Compatibility
        "-y",                      # Overwrite output
        output_path
    ]
    
    try:
        # Start browser in background
        browser_cmd = [
            "chromium-browser",
            scene_config["url"],
            "--start-fullscreen",
            "--autoplay-policy=no-user-gesture-required"
        ]
        
        print("   Launching browser...")
        browser_proc = subprocess.Popen(
            browser_cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Wait for page to load
        time.sleep(3)
        
        # Start recording
        print("   🎥 Recording started...")
        subprocess.run(cmd, check=True)
        
        # Cleanup
        browser_proc.terminate()
        
        print(f"   ✅ Saved: {output_path}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Recording failed: {e}")
        return False
    finally:
        if 'browser_proc' in locals():
            browser_proc.terminate()

def generate_marketing_package():
    """Generate complete marketing video package"""
    
    print("=" * 60)
    print("🎬 BIGDATACLAW MARKETING VIDEO PACKAGE")
    print("=" * 60)
    
    if not check_dependencies():
        return
    
    output_dir = f"./marketing/videos/{datetime.now().strftime('%Y%m%d')}"
    os.makedirs(output_dir, exist_ok=True)
    
    results = []
    
    # Record each scene
    for scene_name, config in SCENES.items():
        success = record_scene(config, output_dir)
        results.append((scene_name, success))
        
        # Brief pause between recordings
        time.sleep(2)
    
    # Summary
    print("\n" + "=" * 60)
    print("📦 VIDEO PACKAGE COMPLETE")
    print("=" * 60)
    
    for scene_name, success in results:
        status = "✅" if success else "❌"
        print(f"   {status} {scene_name}")
    
    print(f"\n📁 Output directory: {output_dir}")
    
    # Generate usage guide
    generate_usage_guide(output_dir)

def generate_usage_guide(output_dir):
    """Generate a usage guide for the videos"""
    
    guide = f"""# BigDataClaw Marketing Video Package
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Video Files

### 1. bigdataclaw_intro.mp4 (10s)
- **Use for:** Social media intros, presentation openings
- **Style:** Logo reveal with dramatic agent boot sequence
- **Platform:** LinkedIn, Twitter, Instagram Reels

### 2. office_overview.mp4 (20s)  
- **Use for:** Website hero sections, pitch decks
- **Style:** Full office showing 10 agents working
- **Platform:** Website backgrounds, investor presentations

### 3. stayner_deal_execution.mp4 (30s)
- **Use for:** Case studies, sales presentations
- **Style:** $18M deal workflow, all agents collaborating
- **Platform:** Sales calls, case study pages

### 4. hot_money_alert.mp4 (15s)
- **Use for:** Feature highlights, product demos
- **Style:** Hot Money Tracker detecting opportunities
- **Platform:** Product demos, explainer videos

### 5. agent_focus.mp4 (10s)
- **Use for:** Agent spotlights, feature deep-dives
- **Style:** Individual agent showcase
- **Platform:** Feature announcements, agent pages

### 6. task_montage.mp4 (20s)
- **Use for:** Speed/efficiency messaging
- **Style:** Fast-paced task completion
- **Platform:** Ads, social proof content

## Recommended Video Editing

### For LinkedIn (Professional):
- Combine: intro + office_overview + stayner_deal
- Length: 45-60 seconds
- Caption: "10 AI agents working 24/7 to find your next deal"

### For Instagram/TikTok (Short-form):
- Use: hot_money_alert + stayner_deal highlights
- Length: 15-30 seconds
- Caption: "$360K commission from one AI-discovered deal 🔥"

### For Website (Background):
- Use: office_overview (muted, looped)
- Position: Hero section background
- Style: Subtle, 50% opacity overlay

## Next Steps

1. Import videos into your editing software
2. Add your branding/logo overlay
3. Include captions for accessibility
4. Add background music (corporate/tech vibe)
5. Export in platform-specific formats

## Custom Scenes

To record custom scenarios:
1. Open: http://localhost:8083/pixel-office.html
2. Click agent to assign tasks
3. Use buttons to trigger events
4. Use OBS or QuickTime to record manually

---
Generated by BigDataClaw Video Production Workflow
"""
    
    guide_path = os.path.join(output_dir, "USAGE_GUIDE.md")
    with open(guide_path, 'w') as f:
        f.write(guide)
    
    print(f"\n📝 Usage guide saved: {guide_path}")

def main():
    parser = argparse.ArgumentParser(
        description="BigDataClaw Marketing Video Production"
    )
    parser.add_argument(
        "--scene",
        choices=list(SCENES.keys()) + ["all"],
        default="all",
        help="Which scene to record"
    )
    parser.add_argument(
        "--duration",
        type=int,
        help="Override scene duration (seconds)"
    )
    parser.add_argument(
        "--output",
        help="Output directory for videos"
    )
    
    args = parser.parse_args()
    
    if args.scene == "all":
        generate_marketing_package()
    else:
        if not check_dependencies():
            return
        
        config = SCENES[args.scene].copy()
        if args.duration:
            config["duration"] = args.duration
        
        output_dir = args.output or "./marketing/videos"
        record_scene(config, output_dir)

if __name__ == "__main__":
    main()
