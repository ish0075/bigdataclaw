#!/usr/bin/env python3
"""
BigDataClaw NERVE - Contact Indexing System
Indexes 164K+ contacts to Qdrant vector database for semantic search
"""

import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Iterator
import argparse

import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/qdrant_indexing.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('qdrant_indexer')

class ContactIndexer:
    """Index contacts to Qdrant vector database"""
    
    # Collection names
    COLLECTION_RECRUITERS = "recruiters"
    COLLECTION_BUILDERS = "builders"
    COLLECTION_COMPANIES = "companies"
    COLLECTION_LENDERS = "lenders"
    COLLECTION_ALL_CONTACTS = "all_contacts"
    
    # Vector size for all-MiniLM-L6-v2 model
    VECTOR_SIZE = 384
    BATCH_SIZE = 100
    
    def __init__(self, qdrant_host: str = "localhost", qdrant_port: int = 6333):
        self.client = QdrantClient(host=qdrant_host, port=qdrant_port)
        self.embedding_model = None
        self.stats = {
            'processed': 0,
            'indexed': 0,
            'errors': 0,
            'start_time': None,
            'end_time': None
        }
        
    def init_embedding_model(self):
        """Initialize sentence transformer model for embeddings"""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading embedding model: all-MiniLM-L6-v2")
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✓ Embedding model loaded")
            return True
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            return False
    
    def create_collection(self, name: str, recreate: bool = False) -> bool:
        """Create a Qdrant collection"""
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            exists = any(c.name == name for c in collections.collections)
            
            if exists:
                if recreate:
                    logger.info(f"Deleting existing collection: {name}")
                    self.client.delete_collection(name)
                else:
                    logger.info(f"Collection '{name}' already exists")
                    return True
            
            # Create collection
            logger.info(f"Creating collection: {name}")
            self.client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(
                    size=self.VECTOR_SIZE,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"✓ Collection '{name}' created")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create collection '{name}': {e}")
            return False
    
    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text"""
        if self.embedding_model is None:
            return None
        
        try:
            embedding = self.embedding_model.encode(text, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None
    
    def prepare_recruiter_text(self, recruiter: dict) -> str:
        """Prepare text for embedding from recruiter data"""
        parts = [
            recruiter.get('name', ''),
            recruiter.get('jobTitle', ''),
            recruiter.get('brokerage', ''),
            recruiter.get('email', ''),
        ]
        return ' '.join(filter(None, parts))
    
    def prepare_company_text(self, company: dict) -> str:
        """Prepare text for embedding from company data"""
        parts = [
            company.get('name', ''),
            company.get('category', ''),
            company.get('type', ''),
            company.get('address', ''),
            company.get('description', ''),
        ]
        return ' '.join(filter(None, parts))
    
    def index_recruiters(self, json_file: str = "recruiter_db_with_quicklinks.json", 
                         recreate: bool = False) -> bool:
        """Index recruiters from JSON file"""
        logger.info(f"\n{'='*60}")
        logger.info("INDEXING RECRUITERS TO QDRANT")
        logger.info(f"{'='*60}")
        
        # Create collection
        if not self.create_collection(self.COLLECTION_RECRUITERS, recreate):
            return False
        
        # Load data
        file_path = Path(json_file)
        if not file_path.exists():
            logger.error(f"File not found: {json_file}")
            return False
        
        logger.info(f"Loading data from {json_file}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            recruiters = data.get('recruiters', [])
            logger.info(f"✓ Loaded {len(recruiters)} recruiters")
        except Exception as e:
            logger.error(f"Failed to load JSON: {e}")
            return False
        
        # Index in batches
        return self._index_batch(
            collection_name=self.COLLECTION_RECRUITERS,
            items=recruiters,
            text_preparer=self.prepare_recruiter_text,
            id_field='id',
            payload_fields=['name', 'brokerage', 'email', 'jobTitle', 'status', 'quickLinks']
        )
    
    def index_companies_from_csv(self, csv_file: str = "QUICK_LINKS_COMPANIES_CATEGORIZED.csv",
                                  recreate: bool = False) -> bool:
        """Index companies from CSV file"""
        logger.info(f"\n{'='*60}")
        logger.info("INDEXING COMPANIES TO QDRANT")
        logger.info(f"{'='*60}")
        
        # Create collection
        if not self.create_collection(self.COLLECTION_COMPANIES, recreate):
            return False
        
        # Load data
        file_path = Path(csv_file)
        if not file_path.exists():
            logger.error(f"File not found: {csv_file}")
            return False
        
        logger.info(f"Loading data from {csv_file}...")
        try:
            import csv
            companies = []
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    row['id'] = i + 1  # Add ID
                    companies.append(row)
            logger.info(f"✓ Loaded {len(companies)} companies")
        except Exception as e:
            logger.error(f"Failed to load CSV: {e}")
            return False
        
        # Index in batches
        return self._index_batch(
            collection_name=self.COLLECTION_COMPANIES,
            items=companies,
            text_preparer=self.prepare_company_text,
            id_field='id',
            payload_fields=['name', 'category', 'subcategory', 'type', 'address', 'phone', 'email']
        )
    
    def _index_batch(self, collection_name: str, items: List[dict],
                     text_preparer, id_field: str, payload_fields: List[str]) -> bool:
        """Index items to Qdrant in batches"""
        self.stats['start_time'] = datetime.now()
        self.stats['processed'] = 0
        self.stats['indexed'] = 0
        self.stats['errors'] = 0
        
        total = len(items)
        batch = []
        
        logger.info(f"Starting indexing of {total} items...")
        logger.info(f"Batch size: {self.BATCH_SIZE}")
        
        for i, item in enumerate(items):
            try:
                # Prepare text for embedding
                text = text_preparer(item)
                
                if not text.strip():
                    self.stats['errors'] += 1
                    continue
                
                # Generate embedding
                embedding = self.generate_embedding(text)
                if embedding is None:
                    self.stats['errors'] += 1
                    continue
                
                # Prepare payload
                payload = {k: item.get(k) for k in payload_fields if k in item}
                payload['search_text'] = text  # Store searchable text
                
                # Create point
                point = PointStruct(
                    id=int(item.get(id_field, i)),
                    vector=embedding,
                    payload=payload
                )
                batch.append(point)
                
                # Upload batch when full
                if len(batch) >= self.BATCH_SIZE:
                    self._upload_batch(collection_name, batch)
                    batch = []
                
                self.stats['processed'] += 1
                
                # Progress report every 1000 items
                if (i + 1) % 1000 == 0:
                    progress = (i + 1) / total * 100
                    logger.info(f"Progress: {i+1}/{total} ({progress:.1f}%)")
                    
            except Exception as e:
                logger.error(f"Error processing item {i}: {e}")
                self.stats['errors'] += 1
        
        # Upload remaining items
        if batch:
            self._upload_batch(collection_name, batch)
        
        self.stats['end_time'] = datetime.now()
        
        # Print summary
        self._print_summary()
        
        return True
    
    def _upload_batch(self, collection_name: str, points: List[PointStruct]):
        """Upload a batch of points to Qdrant"""
        try:
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            self.stats['indexed'] += len(points)
        except Exception as e:
            logger.error(f"Batch upload failed: {e}")
            self.stats['errors'] += len(points)
    
    def _print_summary(self):
        """Print indexing summary"""
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
        rate = self.stats['indexed'] / duration if duration > 0 else 0
        
        logger.info(f"\n{'='*60}")
        logger.info("INDEXING COMPLETE")
        logger.info(f"{'='*60}")
        logger.info(f"Processed: {self.stats['processed']}")
        logger.info(f"Indexed: {self.stats['indexed']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info(f"Duration: {duration:.1f}s")
        logger.info(f"Rate: {rate:.1f} items/sec")
        logger.info(f"{'='*60}\n")
    
    def search(self, collection_name: str, query: str, limit: int = 10) -> List[dict]:
        """Search a collection"""
        if self.embedding_model is None:
            logger.error("Embedding model not loaded")
            return []
        
        try:
            # Generate query embedding
            query_vector = self.embedding_model.encode(query, normalize_embeddings=True).tolist()
            
            # Search using query_points API
            from qdrant_client.models import SearchRequest
            results = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit
            )
            
            return [
                {
                    'id': r.id,
                    'score': r.score,
                    'payload': r.payload
                }
                for r in results.points
            ]
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
    
    def get_collection_info(self, collection_name: str) -> dict:
        """Get collection info"""
        try:
            info = self.client.get_collection(collection_name)
            return {
                'name': collection_name,
                'points_count': info.points_count,
                'status': str(info.status)
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {}


def main():
    parser = argparse.ArgumentParser(description='Index contacts to Qdrant')
    parser.add_argument('--recruiters', action='store_true', help='Index recruiters')
    parser.add_argument('--companies', action='store_true', help='Index companies')
    parser.add_argument('--all', action='store_true', help='Index all contacts')
    parser.add_argument('--recreate', action='store_true', help='Recreate collections')
    parser.add_argument('--search', type=str, help='Search query')
    parser.add_argument('--collection', type=str, default='recruiters', help='Collection to search')
    parser.add_argument('--info', action='store_true', help='Show collection info')
    
    args = parser.parse_args()
    
    # Initialize indexer
    indexer = ContactIndexer()
    
    # Show info only
    if args.info:
        print("\n📊 Qdrant Collections:")
        collections = indexer.client.get_collections()
        for col in collections.collections:
            info = indexer.get_collection_info(col.name)
            print(f"  • {col.name}: {info.get('points_count', 0)} points")
        return
    
    # Search only
    if args.search:
        print(f"\n🔍 Searching for: '{args.search}'")
        if indexer.init_embedding_model():
            results = indexer.search(args.collection, args.search, limit=10)
            print(f"\nFound {len(results)} results:\n")
            for i, r in enumerate(results, 1):
                print(f"{i}. Score: {r['score']:.3f}")
                print(f"   Name: {r['payload'].get('name', 'N/A')}")
                print(f"   Brokerage: {r['payload'].get('brokerage', r['payload'].get('category', 'N/A'))}")
                print(f"   Email: {r['payload'].get('email', 'N/A')}")
                print()
        return
    
    # Indexing requires embedding model
    if not indexer.init_embedding_model():
        logger.error("Failed to initialize embedding model. Exiting.")
        sys.exit(1)
    
    # Index data
    if args.recruiters or args.all:
        indexer.index_recruiters(recreate=args.recreate)
    
    if args.companies or args.all:
        indexer.index_companies_from_csv(recreate=args.recreate)
    
    # Default action if no args
    if not any([args.recruiters, args.companies, args.all, args.search, args.info]):
        print("\nUsage examples:")
        print("  python3 index_contacts_to_qdrant.py --recruiters")
        print("  python3 index_contacts_to_qdrant.py --all --recreate")
        print("  python3 index_contacts_to_qdrant.py --search 'Keller Williams agent'")
        print("  python3 index_contacts_to_qdrant.py --info")


if __name__ == '__main__':
    main()
