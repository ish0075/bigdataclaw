#!/usr/bin/env python3
"""Quick test script for ContextKeep integration"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextkeep_integration import ContextKeepSync, ContextKeepObsidianBridge

def test_connections():
    """Test both Obsidian and ContextKeep connections"""
    print("\n" + "="*60)
    print("CONTEXTKEEP CONNECTION TEST")
    print("="*60)
    
    # Test 1: ContextKeep
    print("\n[1/3] Testing ContextKeep MCP Server...")
    try:
        ck = ContextKeepSync()
        connected, msg = ck.connect()
        if connected:
            print(f"  ✓ ContextKeep: {msg}")
        else:
            print(f"  ✗ ContextKeep: {msg}")
            print("    → Is ContextKeep MCP server running in Obsidian?")
            print("    → Check: curl http://127.0.0.1:8080/health")
    except Exception as e:
        print(f"  ✗ ContextKeep Error: {e}")
    
    # Test 2: Obsidian REST API
    print("\n[2/3] Testing Obsidian REST API...")
    try:
        from obsidian_integration import ObsidianIntegration
        obsidian = ObsidianIntegration()
        connected, msg = obsidian.test_connection()
        if connected:
            print(f"  ✓ Obsidian: {msg}")
        else:
            print(f"  ✗ Obsidian: {msg}")
            print("    → Is Obsidian running with Local REST API enabled?")
    except Exception as e:
        print(f"  ✗ Obsidian Error: {e}")
    
    # Test 3: Bridge both
    print("\n[3/3] Testing combined bridge...")
    try:
        bridge = ContextKeepObsidianBridge()
        statuses = bridge.test_connections()
        for service, (ok, msg) in statuses.items():
            status = "✓" if ok else "✗"
            print(f"  {status} {service}: {msg}")
    except Exception as e:
        print(f"  ✗ Bridge Error: {e}")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)
    print("\nNext steps if any tests failed:")
    print("1. Run: bash setup_contextkeep_complete.sh")
    print("2. Check: cat CONTEXTKEEP_TROUBLESHOOTING.md")

if __name__ == "__main__":
    test_connections()
