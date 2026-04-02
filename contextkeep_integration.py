#!/usr/bin/env python3
"""
ContextKeep Beta v1.2 Integration for BigDataClaw
MCP Server integration for semantic memory search and retrieval
"""

import json
import asyncio
from typing import Optional, Dict, List, Any
from datetime import datetime
from dataclasses import dataclass


@dataclass
class Memory:
    """Represents a ContextKeep memory entry"""
    id: str
    content: str
    metadata: Dict[str, Any]
    tags: List[str]
    created_at: str
    modified_at: str
    source_file: Optional[str] = None
    embedding: Optional[List[float]] = None


@dataclass
class MemoryQueryResult:
    """Result from querying memories"""
    memory: Memory
    relevance_score: float
    matched_chunks: List[str]


class ContextKeepClient:
    """
    Client for ContextKeep MCP Server
    Provides semantic memory search and management
    """
    
    def __init__(self, mcp_server_url: str = "http://127.0.0.1:8080"):
        self.mcp_server_url = mcp_server_url
        self.session = None
        
    async def connect(self):
        """Establish connection to MCP server"""
        try:
            # This would use the MCP client SDK
            # For now, we'll use HTTP requests as fallback
            import aiohttp
            self.session = aiohttp.ClientSession()
            # Test connection
            async with self.session.get(f"{self.mcp_server_url}/health") as resp:
                if resp.status == 200:
                    return True, "Connected to ContextKeep MCP"
                return False, f"HTTP {resp.status}"
        except Exception as e:
            return False, str(e)
    
    async def list_all_memories(
        self,
        limit: int = 100,
        offset: int = 0,
        tags: Optional[List[str]] = None,
        source_filter: Optional[str] = None
    ) -> List[Memory]:
        """
        List all memories in the index
        
        Args:
            limit: Maximum memories to return
            offset: Pagination offset
            tags: Filter by specific tags
            source_filter: Filter by source file pattern
            
        Returns:
            List of Memory objects
        """
        params = {
            "limit": limit,
            "offset": offset
        }
        if tags:
            params["tags"] = ",".join(tags)
        if source_filter:
            params["source"] = source_filter
            
        try:
            import aiohttp
            async with self.session.get(
                f"{self.mcp_server_url}/memories",
                params=params
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return [self._parse_memory(m) for m in data.get("memories", [])]
                return []
        except Exception as e:
            print(f"Error listing memories: {e}")
            return []
    
    async def query_memories(
        self,
        query: str,
        top_k: int = 5,
        min_relevance: float = 0.7,
        tags: Optional[List[str]] = None
    ) -> List[MemoryQueryResult]:
        """
        Semantic search through memories
        
        Args:
            query: Natural language query
            top_k: Number of top results to return
            min_relevance: Minimum relevance score (0-1)
            tags: Optional tag filters
            
        Returns:
            List of MemoryQueryResult sorted by relevance
        """
        payload = {
            "query": query,
            "top_k": top_k,
            "min_relevance": min_relevance
        }
        if tags:
            payload["tags"] = tags
            
        try:
            import aiohttp
            async with self.session.post(
                f"{self.mcp_server_url}/query",
                json=payload
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return [
                        MemoryQueryResult(
                            memory=self._parse_memory(r["memory"]),
                            relevance_score=r["score"],
                            matched_chunks=r.get("chunks", [])
                        )
                        for r in data.get("results", [])
                    ]
                return []
        except Exception as e:
            print(f"Error querying memories: {e}")
            return []
    
    async def add_memory(
        self,
        content: str,
        tags: List[str] = None,
        metadata: Dict[str, Any] = None,
        source_file: Optional[str] = None
    ) -> Optional[str]:
        """
        Add a new memory to ContextKeep
        
        Args:
            content: The memory content
            tags: Tags for categorization
            metadata: Additional metadata
            source_file: Source file path in Obsidian
            
        Returns:
            Memory ID if successful
        """
        payload = {
            "content": content,
            "tags": tags or [],
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat()
        }
        if source_file:
            payload["source_file"] = source_file
            
        try:
            import aiohttp
            async with self.session.post(
                f"{self.mcp_server_url}/memories",
                json=payload
            ) as resp:
                if resp.status in (200, 201):
                    data = await resp.json()
                    return data.get("id")
                return None
        except Exception as e:
            print(f"Error adding memory: {e}")
            return None
    
    async def get_buyer_intelligence(self, buyer_name: str) -> Dict[str, Any]:
        """
        Query memories for buyer intelligence
        
        Searches for:
        - Past interactions with buyer
        - Deal history and preferences
        - Notes and observations
        """
        queries = [
            f"interactions with {buyer_name}",
            f"deals closed by {buyer_name}",
            f"{buyer_name} preferences and criteria",
            f"notes about {buyer_name}"
        ]
        
        all_results = []
        for query in queries:
            results = await self.query_memories(query, top_k=3)
            all_results.extend(results)
        
        # Deduplicate and sort by relevance
        seen_ids = set()
        unique_results = []
        for r in sorted(all_results, key=lambda x: x.relevance_score, reverse=True):
            if r.memory.id not in seen_ids:
                seen_ids.add(r.memory.id)
                unique_results.append(r)
        
        return {
            "buyer_name": buyer_name,
            "memories_found": len(unique_results),
            "interactions": [
                {
                    "content": r.memory.content,
                    "relevance": r.relevance_score,
                    "date": r.memory.created_at,
                    "source": r.memory.source_file
                }
                for r in unique_results[:10]
            ]
        }
    
    async def sync_buyer_profile_to_memory(
        self,
        buyer: Dict,
        match_result: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Convert a buyer profile to a ContextKeep memory
        """
        company = buyer.get('company_name', 'Unknown')
        
        # Build rich content for semantic search
        content_parts = [
            f"Buyer Profile: {company}",
            f"Contact: {buyer.get('contact_name', '')}",
            f"Deal Size Range: ${buyer.get('typical_deal_size_min', 0):,.0f} - ${buyer.get('typical_deal_size_max', 0):,.0f}",
        ]
        
        # Add asset classes
        asset_classes = buyer.get('preferred_asset_classes', {}).get('types', [])
        if asset_classes:
            content_parts.append(f"Asset Classes: {', '.join(asset_classes)}")
        
        # Add locations
        cities = buyer.get('geographic_focus', {}).get('cities', [])
        regions = buyer.get('geographic_focus', {}).get('regions', [])
        locations = cities + regions
        if locations:
            content_parts.append(f"Geographic Focus: {', '.join(locations)}")
        
        # Add match info if available
        if match_result:
            content_parts.append(f"Match Score: {match_result.get('match_score', 0)}%")
            reasons = match_result.get('match_reasons', [])
            if reasons:
                content_parts.append(f"Match Reasons: {'; '.join(reasons)}")
        
        content = "\n".join(content_parts)
        
        tags = ["buyer", "profile"]
        if match_result and match_result.get('match_score', 0) > 80:
            tags.append("hot-money")
        
        metadata = {
            "company": company,
            "contact": buyer.get('contact_name', ''),
            "deal_size_min": buyer.get('typical_deal_size_min', 0),
            "deal_size_max": buyer.get('typical_deal_size_max', 0),
            "match_score": match_result.get('match_score', 0) if match_result else 0,
            "last_updated": datetime.now().isoformat()
        }
        
        return await self.add_memory(
            content=content,
            tags=tags,
            metadata=metadata,
            source_file=f"Buyer-Profiles/{company.replace(' ', '_')}.md"
        )
    
    def _parse_memory(self, data: Dict) -> Memory:
        """Parse memory data from API response"""
        return Memory(
            id=data.get("id", ""),
            content=data.get("content", ""),
            metadata=data.get("metadata", {}),
            tags=data.get("tags", []),
            created_at=data.get("created_at", ""),
            modified_at=data.get("modified_at", ""),
            source_file=data.get("source_file"),
            embedding=data.get("embedding")
        )
    
    async def close(self):
        """Close connection"""
        if self.session:
            await self.session.close()


# Synchronous wrapper for easier use
class ContextKeepSync:
    """Synchronous wrapper for ContextKeepClient"""
    
    def __init__(self, mcp_server_url: str = "http://127.0.0.1:8080"):
        self.client = ContextKeepClient(mcp_server_url)
        self._loop = None
    
    def _run(self, coro):
        """Run async coroutine synchronously"""
        try:
            self._loop = asyncio.get_event_loop()
        except RuntimeError:
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
        return self._loop.run_until_complete(coro)
    
    def connect(self):
        return self._run(self.client.connect())
    
    def list_all_memories(self, **kwargs):
        return self._run(self.client.list_all_memories(**kwargs))
    
    def query_memories(self, **kwargs):
        return self._run(self.client.query_memories(**kwargs))
    
    def add_memory(self, **kwargs):
        return self._run(self.client.add_memory(**kwargs))
    
    def get_buyer_intelligence(self, buyer_name: str):
        return self._run(self.client.get_buyer_intelligence(buyer_name))
    
    def sync_buyer_profile_to_memory(self, buyer: Dict, match_result: Optional[Dict] = None):
        return self._run(self.client.sync_buyer_profile_to_memory(buyer, match_result))
    
    def close(self):
        return self._run(self.client.close())


# Integration with existing ObsidianIntegration
class ContextKeepObsidianBridge:
    """
    Bridge between Obsidian REST API and ContextKeep MCP
    Provides best of both worlds
    """
    
    def __init__(
        self,
        obsidian_api_key: str = None,
        obsidian_url: str = "https://127.0.0.1:27124",
        contextkeep_url: str = "http://127.0.0.1:8080"
    ):
        from obsidian_integration import ObsidianIntegration
        self.obsidian = ObsidianIntegration(obsidian_api_key, obsidian_url)
        self.contextkeep = ContextKeepSync(contextkeep_url)
    
    def test_connections(self) -> Dict[str, tuple]:
        """Test both connections"""
        obs_ok, obs_msg = self.obsidian.test_connection()
        ck_ok, ck_msg = self.contextkeep.connect()
        return {
            "obsidian": (obs_ok, obs_msg),
            "contextkeep": (ck_ok, ck_msg)
        }
    
    def enhanced_buyer_search(self, query: str) -> Dict[str, Any]:
        """
        Search buyers using both Obsidian search and ContextKeep semantic search
        """
        # Search Obsidian vault (traditional search)
        obsidian_results = self.obsidian.search_vault(query)
        
        # Search ContextKeep memories (semantic search)
        memory_results = self.contextkeep.query_memories(
            query=f"buyer information {query}",
            top_k=10,
            tags=["buyer", "profile"]
        )
        
        return {
            "query": query,
            "obsidian_matches": len(obsidian_results),
            "semantic_matches": len(memory_results),
            "obsidian_results": obsidian_results,
            "semantic_results": [
                {
                    "content": r.memory.content[:500],
                    "relevance": r.relevance_score,
                    "tags": r.memory.tags,
                    "source": r.memory.source_file
                }
                for r in memory_results
            ]
        }


if __name__ == "__main__":
    # Test the integration
    print("Testing ContextKeep Integration...")
    
    ck = ContextKeepSync()
    connected, msg = ck.connect()
    print(f"Connection: {msg}")
    
    if connected:
        # Test list all memories
        print("\n--- Listing All Memories ---")
        memories = ck.list_all_memories(limit=10)
        print(f"Found {len(memories)} memories")
        for m in memories[:3]:
            print(f"  - {m.id}: {m.content[:100]}...")
        
        # Test semantic query
        print("\n--- Semantic Query: 'buyer interested in industrial properties' ---")
        results = ck.query_memories(
            "buyer interested in industrial properties",
            top_k=5
        )
        print(f"Found {len(results)} relevant memories")
        for r in results:
            print(f"  - Score: {r.relevance_score:.2f}")
            print(f"    {r.memory.content[:200]}...")
    
    ck.close()
