#!/usr/bin/env python3
"""
API Endpoint for Recruiter Data
Serves 28,505 recruiters with pagination and search
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('api_recruiters')

class RecruiterAPI:
    """API for serving recruiter data"""
    
    def __init__(self, data_file: str = "recruiter_db_with_quicklinks.json"):
        self.data_file = Path(data_file)
        self.recruiters = []
        self.loaded = False
        
    def load_data(self):
        """Load recruiter data from JSON"""
        if self.loaded:
            return
            
        try:
            logger.info(f"Loading recruiter data from {self.data_file}...")
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.recruiters = data.get('recruiters', [])
            self.loaded = True
            logger.info(f"✓ Loaded {len(self.recruiters):,} recruiters")
            
        except Exception as e:
            logger.error(f"Failed to load recruiter data: {e}")
            self.recruiters = []
    
    def get_recruiters(self, page: int = 1, limit: int = 100, 
                       search: str = None, city: str = None, 
                       brokerage: str = None) -> Dict:
        """Get recruiters with pagination and filtering"""
        self.load_data()
        
        results = self.recruiters.copy()
        
        # Apply filters
        if search:
            search_lower = search.lower()
            results = [r for r in results if 
                      search_lower in (r.get('name', '')).lower() or
                      search_lower in (r.get('brokerage', '')).lower() or
                      search_lower in (r.get('email', '')).lower()]
        
        if city and city != 'all':
            results = [r for r in results if r.get('city') == city]
        
        if brokerage and brokerage != 'all':
            results = [r for r in results if r.get('brokerage') == brokerage]
        
        # Pagination
        total = len(results)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated = results[start_idx:end_idx]
        
        return {
            'recruiters': paginated,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': (total + limit - 1) // limit
        }
    
    def get_recruiter_by_id(self, recruiter_id: int) -> Optional[Dict]:
        """Get a single recruiter by ID"""
        self.load_data()
        
        for recruiter in self.recruiters:
            if recruiter.get('id') == recruiter_id:
                return recruiter
        return None
    
    def get_cities(self) -> List[str]:
        """Get all unique cities"""
        self.load_data()
        cities = set(r.get('city') for r in self.recruiters if r.get('city'))
        return sorted(list(cities))
    
    def get_brokerages(self) -> List[str]:
        """Get all unique brokerages"""
        self.load_data()
        brokerages = set(r.get('brokerage') for r in self.recruiters if r.get('brokerage'))
        return sorted(list(brokerages))
    
    def search_semantic(self, query: str, limit: int = 10) -> List[Dict]:
        """Semantic search using Qdrant"""
        try:
            from qdrant_client import QdrantClient
            from sentence_transformers import SentenceTransformer
            
            client = QdrantClient(host='localhost', port=6333)
            model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Generate query embedding
            query_vector = model.encode(query, normalize_embeddings=True).tolist()
            
            # Search Qdrant
            results = client.query_points(
                collection_name='recruiters',
                query=query_vector,
                limit=limit
            )
            
            # Get full recruiter data
            recruiters = []
            for point in results.points:
                recruiter = self.get_recruiter_by_id(point.id)
                if recruiter:
                    recruiter['_score'] = point.score
                    recruiters.append(recruiter)
            
            return recruiters
            
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []


# FastAPI endpoint (if available)
try:
    from fastapi import FastAPI, Query
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="Recruiter API")
    api = RecruiterAPI()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/api/recruiters")
    def get_recruiters(
        page: int = Query(1, ge=1),
        limit: int = Query(100, ge=1, le=1000),
        search: str = Query(None),
        city: str = Query(None),
        brokerage: str = Query(None)
    ):
        return api.get_recruiters(page, limit, search, city, brokerage)
    
    @app.get("/api/recruiters/search")
    def search_recruiters(q: str, limit: int = 10):
        return api.search_semantic(q, limit)
    
    @app.get("/api/recruiters/cities")
    def get_cities():
        return api.get_cities()
    
    @app.get("/api/recruiters/brokerages")
    def get_brokerages():
        return api.get_brokerages()
    
    logger.info("FastAPI endpoints registered")
    
except ImportError:
    logger.info("FastAPI not available, using fallback")
    app = None


if __name__ == '__main__':
    # Test the API
    api = RecruiterAPI()
    result = api.get_recruiters(page=1, limit=5)
    print(f"Total recruiters: {result['total']}")
    print(f"First agent: {result['recruiters'][0]['name']}")
