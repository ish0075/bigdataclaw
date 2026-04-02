#!/usr/bin/env python3
"""
ContextKeep Usage Examples for BigDataClaw
Demonstrates list_all_memories and buyer matching workflows
"""

import asyncio
from contextkeep_integration import ContextKeepClient, ContextKeepSync, ContextKeepObsidianBridge


# ============================================================================
# EXAMPLE 1: Basic list_all_memories Usage
# ============================================================================

async def example_list_all_memories():
    """List and index all memories in your Obsidian vault"""
    
    client = ContextKeepClient("http://127.0.0.1:8080")
    await client.connect()
    
    print("=" * 60)
    print("EXAMPLE 1: List All Memories")
    print("=" * 60)
    
    # Get all memories (paginated)
    all_memories = []
    offset = 0
    batch_size = 50
    
    while True:
        batch = await client.list_all_memories(
            limit=batch_size,
            offset=offset,
            tags=["buyer", "profile"]  # Filter by tags
        )
        
        if not batch:
            break
            
        all_memories.extend(batch)
        offset += batch_size
        
        if len(batch) < batch_size:
            break
    
    print(f"\nTotal memories indexed: {len(all_memories)}")
    
    # Show breakdown by tag
    tag_counts = {}
    for memory in all_memories:
        for tag in memory.tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    print("\nBreakdown by tag:")
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
        print(f"  #{tag}: {count} memories")
    
    # Show recent memories
    print("\nRecent memories:")
    for m in sorted(all_memories, key=lambda x: x.created_at, reverse=True)[:5]:
        preview = m.content[:100].replace('\n', ' ')
        print(f"  [{m.created_at[:10]}] {preview}...")
    
    await client.close()
    return all_memories


# ============================================================================
# EXAMPLE 2: Buyer Intelligence with Memory Context
# ============================================================================

async def example_buyer_intelligence():
    """Enrich buyer matching with historical memory context"""
    
    client = ContextKeepClient("http://127.0.0.1:8080")
    await client.connect()
    
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Buyer Intelligence from Memories")
    print("=" * 60)
    
    buyer_name = "Acme Properties Inc"
    
    # Get all intelligence about this buyer
    intelligence = await client.get_buyer_intelligence(buyer_name)
    
    print(f"\nBuyer: {intelligence['buyer_name']}")
    print(f"Memories found: {intelligence['memories_found']}")
    
    print("\nHistorical Interactions:")
    for i, interaction in enumerate(intelligence['interactions'][:5], 1):
        print(f"\n  {i}. [{interaction['date'][:10]}] Relevance: {interaction['relevance']:.2f}")
        print(f"     Source: {interaction['source']}")
        print(f"     {interaction['content'][:200]}...")
    
    await client.close()
    return intelligence


# ============================================================================
# EXAMPLE 3: Semantic Search for Matching
# ============================================================================

async def example_semantic_matching():
    """Use semantic search to find relevant buyers for a property"""
    
    client = ContextKeepClient("http://127.0.0.1:8080")
    await client.connect()
    
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Semantic Search for Property Matching")
    print("=" * 60)
    
    # Property characteristics
    property_description = """
    Industrial warehouse in Hamilton
    50,000 sq ft
    $5.5 million
    Rail spur access
    Heavy power
    """
    
    print(f"\nProperty: {property_description.strip()}")
    
    # Search for relevant buyer profiles
    results = await client.query_memories(
        query=property_description,
        top_k=10,
        min_relevance=0.6,
        tags=["buyer", "profile"]
    )
    
    print(f"\nFound {len(results)} relevant buyer memories:")
    print("-" * 60)
    
    for i, result in enumerate(results, 1):
        memory = result.memory
        score = result.relevance_score
        
        # Extract company name from metadata or content
        company = memory.metadata.get('company', 'Unknown')
        deal_size = memory.metadata.get('deal_size_max', 0)
        
        print(f"\n{i}. {company}")
        print(f"   Match Score: {score:.2%}")
        if deal_size:
            print(f"   Deal Capacity: ${deal_size:,.0f}")
        print(f"   Tags: {', '.join(memory.tags)}")
        print(f"   Preview: {memory.content[:150]}...")
        
        if result.matched_chunks:
            print(f"   Matched Chunks: {len(result.matched_chunks)}")
    
    await client.close()
    return results


# ============================================================================
# EXAMPLE 4: Sync Buyer to Memory Index
# ============================================================================

async def example_sync_buyer_to_memory():
    """Sync a new buyer profile to ContextKeep memory index"""
    
    client = ContextKeepClient("http://127.0.0.1:8080")
    await client.connect()
    
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Sync Buyer to Memory Index")
    print("=" * 60)
    
    # New buyer data
    new_buyer = {
        'company_name': 'Industrial Ventures Ltd',
        'contact_name': 'Sarah Chen',
        'contact_title': 'Director of Acquisitions',
        'email': 's.chen@industrialventures.com',
        'company_phone': '905-555-0199',
        'linkedin_url': 'https://linkedin.com/in/sarahchen',
        'typical_deal_size_min': 3000000,
        'typical_deal_size_max': 15000000,
        'preferred_asset_classes': {'types': ['industrial', 'warehouse', 'logistics']},
        'geographic_focus': {
            'cities': ['Hamilton', 'Mississauga', 'Burlington'],
            'regions': ['Golden Horseshoe', 'GTA West']
        },
        'last_sale_amount': 8200000,
        'last_sale_date': '2025-02-20'
    }
    
    # Match result
    match_result = {
        'match_score': 92,
        'match_reasons': [
            'Active in Hamilton market',
            'Prefers industrial assets',
            'Deal size aligns ($3M-$15M)',
            'Recent transaction shows hot money'
        ]
    }
    
    print(f"\nSyncing buyer: {new_buyer['company_name']}")
    print(f"Match Score: {match_result['match_score']}%")
    
    # Add to memory index
    memory_id = await client.sync_buyer_profile_to_memory(new_buyer, match_result)
    
    if memory_id:
        print(f"\n✓ Successfully indexed to ContextKeep")
        print(f"  Memory ID: {memory_id}")
        
        # Verify by querying
        verify = await client.query_memories(
            query=f"{new_buyer['company_name']} buyer profile",
            top_k=1
        )
        if verify:
            print(f"  Verification: Memory found in index (score: {verify[0].relevance_score:.2f})")
    else:
        print("\n✗ Failed to index buyer")
    
    await client.close()
    return memory_id


# ============================================================================
# EXAMPLE 5: Combined Obsidian + ContextKeep Workflow
# ============================================================================

async def example_combined_workflow():
    """Use both Obsidian REST API and ContextKeep together"""
    
    bridge = ContextKeepObsidianBridge()
    
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Combined Obsidian + ContextKeep Search")
    print("=" * 60)
    
    # Test connections
    print("\nTesting connections...")
    statuses = bridge.test_connections()
    for service, (ok, msg) in statuses.items():
        status = "✓" if ok else "✗"
        print(f"  {status} {service}: {msg}")
    
    # Perform enhanced search
    query = "industrial buyer Hamilton"
    print(f"\nEnhanced search: '{query}'")
    
    results = bridge.enhanced_buyer_search(query)
    
    print(f"\nResults:")
    print(f"  Obsidian matches: {results['obsidian_matches']}")
    print(f"  Semantic matches: {results['semantic_matches']}")
    
    print("\nTop Semantic Results:")
    for i, r in enumerate(results['semantic_results'][:3], 1):
        print(f"\n  {i}. Relevance: {r['relevance']:.2%}")
        print(f"     Source: {r['source']}")
        print(f"     {r['content'][:200]}...")
    
    bridge.contextkeep.close()
    return results


# ============================================================================
# EXAMPLE 6: Memory Index Statistics
# ============================================================================

async def example_memory_statistics():
    """Get statistics about the memory index"""
    
    client = ContextKeepClient("http://127.0.0.1:8080")
    await client.connect()
    
    print("\n" + "=" * 60)
    print("EXAMPLE 6: Memory Index Statistics")
    print("=" * 60)
    
    # Get all memories
    all_memories = await client.list_all_memories(limit=1000)
    
    # Calculate statistics
    total_memories = len(all_memories)
    
    # Tag distribution
    tag_counts = {}
    source_counts = {}
    monthly_counts = {}
    
    for memory in all_memories:
        # Tags
        for tag in memory.tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        # Sources
        source = memory.source_file or "Unknown"
        source_counts[source] = source_counts.get(source, 0) + 1
        
        # Monthly distribution
        month = memory.created_at[:7] if memory.created_at else "Unknown"
        monthly_counts[month] = monthly_counts.get(month, 0) + 1
    
    print(f"\nTotal Indexed Memories: {total_memories}")
    
    print(f"\nTop 10 Tags:")
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])[:10]:
        bar = "█" * (count * 20 // max(tag_counts.values()))
        print(f"  #{tag:20} {bar} {count}")
    
    print(f"\nTop Sources:")
    for source, count in sorted(source_counts.items(), key=lambda x: -x[1])[:5]:
        short_source = source.split('/')[-1] if '/' in source else source
        print(f"  {short_source:30} {count} memories")
    
    print(f"\nMonthly Activity:")
    for month, count in sorted(monthly_counts.items()):
        bar = "█" * (count * 30 // max(monthly_counts.values()))
        print(f"  {month} {bar} {count}")
    
    await client.close()
    return {
        "total": total_memories,
        "tags": tag_counts,
        "sources": source_counts,
        "monthly": monthly_counts
    }


# ============================================================================
# Run All Examples
# ============================================================================

async def run_all_examples():
    """Run all examples sequentially"""
    
    examples = [
        ("List All Memories", example_list_all_memories),
        ("Buyer Intelligence", example_buyer_intelligence),
        ("Semantic Matching", example_semantic_matching),
        ("Sync to Memory", example_sync_buyer_to_memory),
        ("Combined Workflow", example_combined_workflow),
        ("Memory Statistics", example_memory_statistics),
    ]
    
    results = {}
    
    for name, example_func in examples:
        try:
            print(f"\n\n{'='*60}")
            print(f"Running: {name}")
            print(f"{'='*60}")
            result = await example_func()
            results[name] = {"status": "success", "data": result}
        except Exception as e:
            print(f"\n✗ Error in {name}: {e}")
            results[name] = {"status": "error", "error": str(e)}
    
    print("\n\n" + "=" * 60)
    print("EXAMPLES COMPLETE")
    print("=" * 60)
    
    for name, result in results.items():
        status = "✓" if result["status"] == "success" else "✗"
        print(f"  {status} {name}")
    
    return results


if __name__ == "__main__":
    # Run examples
    asyncio.run(run_all_examples())
