"""
Test script for AI Agent Meetings
Tests the 3-round consensus meeting logic
"""

import asyncio
import aiohttp
import json
from datetime import datetime


BASE_URL = "http://localhost:8081"


async def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/health") as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Service healthy")
                print(f"   TTS: {data['tts']}")
                print(f"   Agents: {data['agents_available']}")
                return True
            else:
                print(f"❌ Health check failed: {resp.status}")
                return False


async def test_list_agents():
    """Test list agents endpoint"""
    print("\n" + "="*60)
    print("TEST 2: List Available Agents")
    print("="*60)
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/agents") as resp:
            if resp.status == 200:
                agents = await resp.json()
                print(f"✅ Found {len(agents)} agents:")
                for agent_id, info in agents.items():
                    print(f"   • {info['name']} ({agent_id}): {info['role']}")
                return True
            else:
                print(f"❌ Failed to list agents: {resp.status}")
                return False


async def test_schedule_meeting():
    """Test scheduling a meeting"""
    print("\n" + "="*60)
    print("TEST 3: Schedule Agent Meeting (3-Round Consensus)")
    print("="*60)
    
    meeting_request = {
        "meeting_type": "daily_standup",
        "participants": [
            "recruiting_specialist",
            "deal_analyst",
            "market_researcher"
        ],
        "context_data": {
            "deals": [
                {"address": "123 Industrial Way", "price": 2500000, "type": "Industrial"},
                {"address": "456 Retail Plaza", "price": 1800000, "type": "Retail"}
            ],
            "hot_money": [
                {"entity": "ABC Investments", "cash_position": 15000000}
            ]
        },
        "rounds": 3,
        "generate_audio": False,  # Skip audio for faster testing
        "dispatch_telegram": False
    }
    
    async with aiohttp.ClientSession() as session:
        print("  Scheduling meeting...")
        async with session.post(
            f"{BASE_URL}/agents/meeting",
            json=meeting_request
        ) as resp:
            if resp.status == 200:
                result = await resp.json()
                meeting_id = result["meeting_id"]
                print(f"✅ Meeting scheduled: {meeting_id}")
                print(f"   Status: {result['status']}")
                print(f"   Participants: {[p.value if hasattr(p, 'value') else p for p in result['participants']]}")
                return meeting_id
            else:
                error = await resp.text()
                print(f"❌ Failed to schedule meeting: {resp.status} - {error}")
                return None


async def test_get_meeting(meeting_id: str, wait_for_completion: bool = True):
    """Test getting meeting results"""
    print("\n" + "="*60)
    print("TEST 4: Get Meeting Results")
    print("="*60)
    
    async with aiohttp.ClientSession() as session:
        # Poll for completion
        if wait_for_completion:
            print("  Waiting for meeting to complete...")
            max_attempts = 30
            for attempt in range(max_attempts):
                async with session.get(f"{BASE_URL}/agents/meeting/{meeting_id}") as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        status = result["status"]
                        
                        if status == "completed":
                            print(f"✅ Meeting completed!")
                            print(f"\n   Conversation ({len(result['conversation'])} messages):")
                            print("   " + "-"*50)
                            for entry in result["conversation"]:
                                agent = entry["agent_name"]
                                round_num = entry["round"]
                                message = entry["message"]
                                print(f"   [Round {round_num}] {agent}: {message[:100]}...")
                            
                            if result.get("summary"):
                                summary = result["summary"]
                                print(f"\n   Summary:")
                                print("   " + "-"*50)
                                print(f"   Key Points: {summary.get('key_points', [])}")
                                print(f"   Decisions: {summary.get('decisions', [])}")
                                print(f"   Consensus: {summary.get('consensus_reached', False)}")
                                print(f"   Confidence: {summary.get('confidence_score', 0)}")
                            
                            return True
                        elif status == "failed":
                            print(f"❌ Meeting failed")
                            return False
                        else:
                            if attempt % 5 == 0:
                                print(f"    Status: {status}...")
                            await asyncio.sleep(1)
                    else:
                        print(f"❌ Failed to get meeting: {resp.status}")
                        return False
            
            print("⚠️ Timeout waiting for meeting completion")
            return False
        else:
            async with session.get(f"{BASE_URL}/agents/meeting/{meeting_id}") as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(f"✅ Meeting status: {result['status']}")
                    return True
                else:
                    print(f"❌ Failed to get meeting: {resp.status}")
                    return False


async def test_deal_review_meeting():
    """Test a deal review meeting"""
    print("\n" + "="*60)
    print("TEST 5: Deal Review Meeting")
    print("="*60)
    
    meeting_request = {
        "meeting_type": "deal_review",
        "participants": [
            "deal_analyst",
            "market_researcher",
            "coordinator"
        ],
        "context_data": {
            "deals": [
                {
                    "address": "500 Seaway Mall Drive",
                    "price": 8500000,
                    "type": "Commercial",
                    "size_sf": 85000,
                    "cap_rate": 7.5
                }
            ],
            "market_data": {
                "region": "Niagara Region",
                "trend": "Upward",
                "avg_cap_rate": 6.8
            }
        },
        "rounds": 3,
        "generate_audio": False,
        "dispatch_telegram": False
    }
    
    async with aiohttp.ClientSession() as session:
        print("  Scheduling deal review...")
        async with session.post(
            f"{BASE_URL}/agents/meeting",
            json=meeting_request
        ) as resp:
            if resp.status == 200:
                result = await resp.json()
                meeting_id = result["meeting_id"]
                print(f"✅ Deal review scheduled: {meeting_id}")
                return meeting_id
            else:
                print(f"❌ Failed: {resp.status}")
                return None


async def test_list_meetings():
    """Test listing meetings"""
    print("\n" + "="*60)
    print("TEST 6: List Meetings")
    print("="*60)
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/agents/meetings?limit=5") as resp:
            if resp.status == 200:
                meetings = await resp.json()
                print(f"✅ Found {len(meetings)} recent meetings:")
                for m in meetings:
                    print(f"   • {m['meeting_id'][:8]}... - {m['meeting_type']} - {m['status']}")
                return True
            else:
                print(f"❌ Failed to list meetings: {resp.status}")
                return False


async def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("AI AGENT MEETING SYSTEM - TEST SUITE")
    print("="*60)
    print(f"Testing against: {BASE_URL}")
    
    results = []
    
    # Test 1: Health
    results.append(("Health Check", await test_health()))
    
    # Test 2: List agents
    results.append(("List Agents", await test_list_agents()))
    
    # Test 3 & 4: Schedule and get meeting
    meeting_id = await test_schedule_meeting()
    if meeting_id:
        results.append(("Schedule Meeting", True))
        results.append(("Get Meeting Results", await test_get_meeting(meeting_id)))
    else:
        results.append(("Schedule Meeting", False))
        results.append(("Get Meeting Results", False))
    
    # Test 5: Deal review meeting
    deal_meeting_id = await test_deal_review_meeting()
    if deal_meeting_id:
        results.append(("Deal Review Meeting", True))
        await test_get_meeting(deal_meeting_id)
    else:
        results.append(("Deal Review Meeting", False))
    
    # Test 6: List meetings
    results.append(("List Meetings", await test_list_meetings()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! The AI Agent Meeting System is working.")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed.")


if __name__ == "__main__":
    # Check if server is running
    import sys
    
    print("Checking if server is running...")
    try:
        import urllib.request
        urllib.request.urlopen(f"{BASE_URL}/health", timeout=2)
        print("✅ Server is running\n")
    except:
        print("❌ Server not running at", BASE_URL)
        print("   Start it with: python main.py")
        sys.exit(1)
    
    # Run tests
    asyncio.run(run_all_tests())
