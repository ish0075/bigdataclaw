#!/usr/bin/env python3
"""
Qdrant Experience Agent - 24/7 Vector Database Management
Ensures Qdrant is healthy, collections are optimized, and data is constantly indexed
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import aiohttp
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, 
    OptimizersConfigDiff, CollectionStatus
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/qdrant_experience_agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('qdrant_experience_agent')

class QdrantExperienceAgent:
    """
    Manages Qdrant vector database 24/7
    - Monitors health
    - Optimizes collections
    - Auto-indexes new data
    - Maintains performance
    """
    
    def __init__(self, host: str = "localhost", port: int = 6333):
        self.client = QdrantClient(host=host, port=port)
        self.host = host
        self.port = port
        self.running = False
        self.stats = {
            'checks_performed': 0,
            'optimizations': 0,
            'indexed_items': 0,
            'errors': 0
        }
        
        # Collections to monitor
        self.monitored_collections = [
            'recruiters',
            'builders', 
            'companies',
            'lenders',
            'contacts',
            'all_contacts'
        ]
        
    async def health_check(self) -> Dict:
        """Check Qdrant health"""
        try:
            # Check if Qdrant is reachable
            collections = self.client.get_collections()
            
            # Check each monitored collection
            collection_status = {}
            for name in self.monitored_collections:
                try:
                    info = self.client.get_collection(name)
                    collection_status[name] = {
                        'status': str(info.status),
                        'points': info.points_count,
                        'vectors': info.config.params.vectors.size if info.config.params.vectors else None
                    }
                except Exception as e:
                    collection_status[name] = {'error': str(e)}
            
            return {
                'healthy': True,
                'collections_count': len(collections.collections),
                'monitored_collections': collection_status,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'healthy': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def optimize_collection(self, collection_name: str) -> bool:
        """Optimize a collection for better performance"""
        try:
            logger.info(f"Optimizing collection: {collection_name}")
            
            # Update optimizers config
            self.client.update_collection(
                collection_name=collection_name,
                optimizers_config=OptimizersConfigDiff(
                    indexing_threshold=20000,
                    memmap_threshold=50000,
                    vacuum_min_vector_number=1000
                )
            )
            
            logger.info(f"✓ Collection '{collection_name}' optimized")
            return True
            
        except Exception as e:
            logger.error(f"Failed to optimize '{collection_name}': {e}")
            return False
    
    def create_collection_if_missing(self, name: str, vector_size: int = 384) -> bool:
        """Create a collection if it doesn't exist"""
        try:
            collections = self.client.get_collections()
            exists = any(c.name == name for c in collections.collections)
            
            if not exists:
                logger.info(f"Creating collection: {name}")
                self.client.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(
                        size=vector_size,
                        distance=Distance.COSINE
                    ),
                    optimizers_config=OptimizersConfigDiff(
                        indexing_threshold=1000
                    )
                )
                logger.info(f"✓ Collection '{name}' created")
                return True
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to create collection '{name}': {e}")
            return False
    
    def index_recruiters_batch(self, start_idx: int = 0, batch_size: int = 1000) -> int:
        """Index a batch of recruiters to Qdrant"""
        try:
            from sentence_transformers import SentenceTransformer
            
            # Load model if not loaded
            if not hasattr(self, '_embedding_model'):
                logger.info("Loading embedding model...")
                self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Load recruiters data
            recruiter_file = Path('recruiter_db_with_quicklinks.json')
            if not recruiter_file.exists():
                logger.error("Recruiter file not found")
                return 0
            
            with open(recruiter_file, 'r') as f:
                data = json.load(f)
            
            recruiters = data.get('recruiters', [])
            end_idx = min(start_idx + batch_size, len(recruiters))
            batch = recruiters[start_idx:end_idx]
            
            if not batch:
                return 0
            
            # Prepare points
            points = []
            for recruiter in batch:
                text = f"{recruiter.get('name', '')} {recruiter.get('jobTitle', '')} {recruiter.get('brokerage', '')}"
                if not text.strip():
                    continue
                
                embedding = self._embedding_model.encode(text, normalize_embeddings=True).tolist()
                
                points.append(PointStruct(
                    id=int(recruiter['id']),
                    vector=embedding,
                    payload={
                        'name': recruiter.get('name'),
                        'brokerage': recruiter.get('brokerage'),
                        'email': recruiter.get('email'),
                        'jobTitle': recruiter.get('jobTitle'),
                        'status': recruiter.get('status'),
                        'search_text': text
                    }
                ))
            
            # Upload to Qdrant
            if points:
                self.client.upsert(
                    collection_name='recruiters',
                    points=points
                )
                logger.info(f"Indexed {len(points)} recruiters (batch {start_idx}-{end_idx})")
                return len(points)
            
            return 0
            
        except Exception as e:
            logger.error(f"Indexing error: {e}")
            return 0
    
    def get_indexing_status(self) -> Dict:
        """Get current indexing status"""
        try:
            info = self.client.get_collection('recruiters')
            return {
                'indexed': info.points_count,
                'total': 28505,  # Total recruiters
                'percentage': (info.points_count / 28505) * 100,
                'status': str(info.status)
            }
        except:
            return {'indexed': 0, 'total': 28505, 'percentage': 0}
    
    async def run_maintenance(self):
        """Run maintenance tasks"""
        logger.info("Running Qdrant maintenance...")
        
        # Health check
        health = await self.health_check()
        if not health['healthy']:
            logger.error("Qdrant is not healthy!")
            self.stats['errors'] += 1
            return
        
        # Ensure collections exist
        for collection in self.monitored_collections:
            self.create_collection_if_missing(collection)
        
        # Optimize collections
        for name in health.get('monitored_collections', {}):
            if 'error' not in health['monitored_collections'][name]:
                if self.optimize_collection(name):
                    self.stats['optimizations'] += 1
        
        # Check indexing status
        status = self.get_indexing_status()
        logger.info(f"Indexing status: {status['indexed']}/{status['total']} ({status['percentage']:.1f}%)")
        
        # Auto-index if needed
        if status['indexed'] < status['total']:
            logger.info("Auto-indexing more recruiters...")
            indexed = self.index_recruiters_batch(start_idx=status['indexed'], batch_size=500)
            self.stats['indexed_items'] += indexed
        
        self.stats['checks_performed'] += 1
        
        # Save status
        self.save_status()
    
    def save_status(self):
        """Save agent status to file"""
        status = {
            'timestamp': datetime.now().isoformat(),
            'stats': self.stats,
            'collections': self.get_indexing_status()
        }
        
        status_file = Path('logs/qdrant_agent_status.json')
        status_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(status_file, 'w') as f:
            json.dump(status, f, indent=2)
    
    async def run(self, interval: int = 300):  # 5 minutes
        """Run the agent loop"""
        logger.info("🚀 Starting Qdrant Experience Agent...")
        self.running = True
        
        while self.running:
            try:
                await self.run_maintenance()
                logger.info(f"Sleeping for {interval}s...")
                await asyncio.sleep(interval)
            except Exception as e:
                logger.error(f"Agent error: {e}")
                await asyncio.sleep(60)
        
        logger.info("Qdrant Experience Agent stopped")
    
    def stop(self):
        """Stop the agent"""
        self.running = False


class QdrantDashboardAPI:
    """API for Qdrant dashboard data"""
    
    def __init__(self, client: QdrantClient):
        self.client = client
    
    def get_dashboard_data(self) -> Dict:
        """Get data for dashboard display"""
        try:
            collections = self.client.get_collections()
            
            collections_data = []
            for col in collections.collections:
                try:
                    info = self.client.get_collection(col.name)
                    collections_data.append({
                        'name': col.name,
                        'points': info.points_count,
                        'status': str(info.status),
                        'vector_size': info.config.params.vectors.size if info.config.params.vectors else None
                    })
                except:
                    collections_data.append({
                        'name': col.name,
                        'error': 'Failed to get info'
                    })
            
            return {
                'healthy': True,
                'collections': collections_data,
                'total_collections': len(collections.collections),
                'total_points': sum(c.get('points', 0) for c in collections_data),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'healthy': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }


def generate_dashboard_html():
    """Generate HTML dashboard for Qdrant"""
    html = """<!DOCTYPE html>
<html>
<head>
    <title>Qdrant Experience Agent Dashboard</title>
    <meta http-equiv="refresh" content="30">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #0f0f0f; 
            color: #fff; 
            margin: 0; 
            padding: 20px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
        }
        .header h1 { margin: 0; }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .card { 
            background: #1a1a1a; 
            border-radius: 12px; 
            padding: 20px; 
            border: 1px solid #333; 
        }
        .card h2 { 
            margin-top: 0; 
            color: #60a5fa; 
            font-size: 18px; 
        }
        .status { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            margin: 10px 0; 
            padding: 10px;
            background: #222;
            border-radius: 8px;
        }
        .status-dot { 
            width: 10px; 
            height: 10px; 
            border-radius: 50%; 
        }
        .status-healthy { background: #22c55e; }
        .status-error { background: #ef4444; }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #333; 
        }
        .metric:last-child { border-bottom: none; }
        .timestamp { 
            text-align: center; 
            color: #666; 
            margin-top: 20px; 
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #333;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 Qdrant Experience Agent</h1>
        <p>24/7 Vector Database Management</p>
    </div>
    <div class="grid">
        <div class="card">
            <h2>📊 System Health</h2>
            <div id="health-status">Loading...</div>
        </div>
        <div class="card">
            <h2>📁 Collections</h2>
            <div id="collections">Loading...</div>
        </div>
        <div class="card">
            <h2>📈 Indexing Progress</h2>
            <div id="indexing">Loading...</div>
        </div>
        <div class="card">
            <h2>⚡ Agent Stats</h2>
            <div id="stats">Loading...</div>
        </div>
    </div>
    <div class="timestamp">Last updated: <span id="timestamp">-</span></div>
    
    <script>
        async function fetchData() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                updateDashboard(data);
            } catch (e) {
                console.error('Failed to fetch data:', e);
            }
        }
        
        function updateDashboard(data) {
            document.getElementById('timestamp').textContent = new Date().toLocaleString();
            
            // Health status
            const healthHtml = data.healthy 
                ? '<div class="status"><div class="status-dot status-healthy"></div>Qdrant is Healthy</div>'
                : '<div class="status"><div class="status-dot status-error"></div>Qdrant is Unhealthy</div>';
            document.getElementById('health-status').innerHTML = healthHtml;
            
            // Collections
            let collectionsHtml = '';
            if (data.collections) {
                data.collections.forEach(col => {
                    collectionsHtml += `<div class="metric"><span>${col.name}</span><span>${col.points?.toLocaleString() || 'Error'} points</span></div>`;
                });
            }
            document.getElementById('collections').innerHTML = collectionsHtml || 'No collections';
            
            // Indexing progress
            if (data.collections && data.collections.find(c => c.name === 'recruiters')) {
                const recruiters = data.collections.find(c => c.name === 'recruiters');
                const percentage = ((recruiters.points / 28505) * 100).toFixed(1);
                document.getElementById('indexing').innerHTML = `
                    <p>Recruiters: ${recruiters.points.toLocaleString()} / 28,505</p>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${percentage}%"></div></div>
                    <p>${percentage}% complete</p>
                `;
            }
            
            // Stats
            document.getElementById('stats').innerHTML = `
                <div class="metric"><span>Checks Performed</span><span>${data.stats?.checks_performed || 0}</span></div>
                <div class="metric"><span>Optimizations</span><span>${data.stats?.optimizations || 0}</span></div>
                <div class="metric"><span>Items Indexed</span><span>${data.stats?.indexed_items?.toLocaleString() || 0}</span></div>
            `;
        }
        
        fetchData();
        setInterval(fetchData, 30000);
    </script>
</body>
</html>"""
    
    with open('qdrant_dashboard.html', 'w') as f:
        f.write(html)
    
    print("✓ Dashboard HTML generated: qdrant_dashboard.html")


async def main():
    """Main entry point"""
    import argparse
    parser = argparse.ArgumentParser(description='Qdrant Experience Agent')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    parser.add_argument('--status', action='store_true', help='Show status')
    parser.add_argument('--index', action='store_true', help='Index recruiters')
    parser.add_argument('--dashboard', action='store_true', help='Generate dashboard')
    
    args = parser.parse_args()
    
    if args.dashboard:
        generate_dashboard_html()
        return
    
    if args.status:
        agent = QdrantExperienceAgent()
        health = await agent.health_check()
        print("\n🧠 Qdrant Status:")
        print(f"  Healthy: {health['healthy']}")
        print(f"  Collections: {health.get('collections_count', 0)}")
        
        status = agent.get_indexing_status()
        print(f"\n📊 Recruiters Indexed:")
        print(f"  {status['indexed']:,} / {status['total']:,} ({status['percentage']:.1f}%)")
        return
    
    if args.index:
        agent = QdrantExperienceAgent()
        print("Indexing recruiters...")
        # Index in batches
        indexed = 0
        while indexed < 28505:
            count = agent.index_recruiters_batch(start_idx=indexed, batch_size=500)
            if count == 0:
                break
            indexed += count
            print(f"  Progress: {indexed}/28505 ({(indexed/28505)*100:.1f}%)")
        print(f"✓ Indexed {indexed} recruiters")
        return
    
    # Run agent
    agent = QdrantExperienceAgent()
    
    if args.daemon:
        await agent.run()
    else:
        # Run once
        await agent.run_maintenance()


if __name__ == '__main__':
    asyncio.run(main())
