#!/usr/bin/env python3
"""
Setup script for Property Enrichment System
Installs Ollama, models, and dependencies
"""

import subprocess
import sys
import os


def run_command(cmd, description):
    """Run shell command with feedback"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  ✅ {description} complete")
            return True
        else:
            print(f"  ❌ Error: {result.stderr[:200]}")
            return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def main():
    print("="*70)
    print("🏢 PROPERTY ENRICHMENT SYSTEM - SETUP")
    print("="*70)
    
    # 1. Check if Ollama is installed
    print("\n📦 Step 1: Checking Ollama...")
    result = subprocess.run("which ollama", shell=True, capture_output=True)
    
    if result.returncode != 0:
        print("  Ollama not found. Installing...")
        install_cmd = "curl -fsSL https://ollama.com/install.sh | sh"
        if not run_command(install_cmd, "Installing Ollama"):
            print("\n⚠️  Please install Ollama manually from: https://ollama.com")
            sys.exit(1)
    else:
        print("  ✅ Ollama already installed")
    
    # 2. Install Python dependencies
    print("\n📦 Step 2: Installing Python packages...")
    packages = [
        "ollama",
        "pdfplumber",
        "playwright",
        "beautifulsoup4",
        "pandas",
        "fuzzywuzzy",
        "python-Levenshtein"
    ]
    
    for pkg in packages:
        run_command(f"pip install {pkg}", f"Installing {pkg}")
    
    # 3. Install Playwright browsers
    run_command("playwright install chromium", "Installing Playwright browsers")
    
    # 4. Pull Ollama models
    print("\n🤖 Step 3: Pulling AI models (this may take a while)...")
    models = [
        ("llama3.2:3b-instruct-fp16", "Text extraction model"),
        ("llava:7b-v1.6-mistral-fp16", "Image analysis model"),
    ]
    
    for model, desc in models:
        print(f"\n  Downloading {desc} ({model})...")
        run_command(f"ollama pull {model}", f"Pulling {model}")
    
    # 5. Test Ollama
    print("\n🧪 Step 4: Testing Ollama...")
    test_result = subprocess.run(
        ["ollama", "list"],
        capture_output=True,
        text=True
    )
    
    if test_result.returncode == 0:
        print("  ✅ Ollama is running")
        print("  📋 Available models:")
        for line in test_result.stdout.strip().split('\n')[1:]:
            print(f"    • {line}")
    else:
        print("  ⚠️  Ollama service not running")
        print("  💡 Start with: ollama serve")
    
    # 6. Create directories
    print("\n📁 Step 5: Creating directories...")
    dirs = [
        "property_cache",
        "property_pdfs",
        "enrichment_output",
        "scraped_data"
    ]
    
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        print(f"  📂 Created: {d}")
    
    print("\n" + "="*70)
    print("✅ SETUP COMPLETE!")
    print("="*70)
    print("\nNext steps:")
    print("  1. Start Ollama: ollama serve")
    print("  2. Test enrichment: python enrich_property.py")
    print("  3. Batch process: python batch_enrich.py")
    print("\nYour property enrichment system is ready! 🚀")


if __name__ == "__main__":
    main()
