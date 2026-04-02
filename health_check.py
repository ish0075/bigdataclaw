#!/usr/bin/env python3
import requests
import urllib3
urllib3.disable_warnings()

print("=== CONTEXTKEEP HEALTH CHECK ===\n")

# Check 1: ContextKeep MCP
try:
    r = requests.get("http://127.0.0.1:8080/health", timeout=5)
    print(f"✓ ContextKeep MCP: HTTP {r.status_code}")
except Exception as e:
    print(f"✗ ContextKeep MCP: {e}")

# Check 2: Obsidian REST API
try:
    r = requests.get(
        "https://127.0.0.1:27124/vault/",
        headers={"Authorization": "Bearer REDACTED_OBSIDIAN_API_KEY"},
        verify=False,
        timeout=5
    )
    print(f"✓ Obsidian REST API: HTTP {r.status_code}")
except Exception as e:
    print(f"✗ Obsidian REST API: {e}")

# Check 3: Python deps
try:
    import aiohttp, requests
    print("✓ Python dependencies: OK")
except ImportError as e:
    print(f"✗ Python dependencies: {e}")

# Check 4: .env file
import os
if os.path.exists(".env"):
    print("✓ .env file: Exists")
else:
    print("✗ .env file: Missing")

print("\n=== END HEALTH CHECK ===")
