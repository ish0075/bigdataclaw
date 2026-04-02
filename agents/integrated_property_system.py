#!/usr/bin/env python3
"""
Integrated Property Matching System
Complete system for commercial property submissions and buyer matching

USAGE:
    from agents.integrated_property_system import PropertyMatchingSystem
    
    system = PropertyMatchingSystem()
    
    # Submit a property
    result = system.submit_and_process({
        'address': '123 Main St',
        'city': 'Toronto',
        'asset_class': 'retail',
        'asking_price': 50000000,
        ...
    })
    
    # Get deal package
    package = system.get_deal_package(result['tracking_id'])
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json

# Import all agents
from agents.property_submission_agent import PropertySubmissionAgent, PropertySubmission, get_submission_agent
from agents.collaboration_agent import AgentCollaborationSystem, get_collaboration_system
from agents.orchestrator import AgentOrchestrator
from agents.skills.implementations.buyer_research import BuyerResearchSkill, get_buyer_research_skill
from agents.deal_package_generator import DealPackageGenerator, get_deal_package_generator


def get_orchestrator():
    """Get orchestrator instance"""
    return AgentOrchestrator()


class PropertyMatchingSystem:
    """
    Complete integrated property matching system
    
    Coordinates:
    - Property submission handling
    - Multi-agent analysis
    - Buyer research and justification
    - Deal team assembly
    - Lender matching
    - Deal package generation
    """
    
    def __init__(self):
        print("\n" + "="*80)
        print("🚀 BIGDATACLAW PROPERTY MATCHING SYSTEM")
        print("   Commercial Real Estate Intelligence Platform")
        print("="*80)
        
        # Initialize all components
        self.submission_agent = get_submission_agent()
        self.collaboration_system = get_collaboration_system()
        self.orchestrator = get_orchestrator()
        self.buyer_research = get_buyer_research_skill()
        self.package_generator = get_deal_package_generator()
        
        # Link orchestrator to submission agent
        self.submission_agent.orchestrator = self.orchestrator
        
        print("\n✅ All systems initialized")
        print(f"   📊 Orchestrator: 7 agents ready")
        print(f"   🤝 Collaboration: Deal team assembly ready")
        print(f"   🔍 Buyer Research: Deep intelligence ready")
        print(f"   📦 Package Generator: Output formatting ready")
    
    def submit_and_process(self, property_data: Dict) -> Dict:
        """
        Main entry point: Submit a property and process completely
        
        Args:
            property_data: Dict with property details
            
        Returns:
            Dict with tracking ID and processing results
        """
        print("\n" + "="*80)
        print("🔄 SUBMIT AND PROCESS WORKFLOW")
        print("="*80)
        
        # Step 1: Submit property
        submission, tracking_id = self.submission_agent.submit_property(property_data)
        
        # Step 2: Process submission through all phases
        results = self.submission_agent.process_submission(tracking_id)
        
        # Step 3: Assemble deal team
        collaboration_session = self.collaboration_system.assemble_deal_team(
            {**property_data, 'tracking_id': tracking_id}
        )
        
        # Step 4: Deep buyer research for top 5
        print(f"\n{'='*80}")
        print("🔍 DEEP BUYER RESEARCH")
        print(f"{'='*80}")
        
        for buyer in submission.matched_buyers[:5]:
            research = self.buyer_research.research_buyer_rationale(
                buyer['name'],
                {
                    'address': property_data.get('address'),
                    'city': property_data.get('city'),
                    'asset_class': property_data.get('asset_class'),
                    'price': property_data.get('asking_price')
                }
            )
            buyer['research'] = research
        
        # Step 5: Generate deal package
        package_data = self.submission_agent.get_deal_package(tracking_id)
        
        # Add deal team to package data
        deal_team = []
        if collaboration_session:
            deal_team = [agent.to_dict() for agent in collaboration_session.collaborating_agents]
            if collaboration_session.lead_agent:
                deal_team.insert(0, collaboration_session.lead_agent.to_dict())
        package_data['agents'] = deal_team
        
        deal_package = self.package_generator.generate_package(package_data)
        
        # Generate outputs
        markdown_output = self.package_generator.generate_markdown_output(deal_package)
        json_output = self.package_generator.generate_json_output(deal_package)
        
        return {
            'tracking_id': tracking_id,
            'status': 'complete',
            'property': {
                'address': submission.address,
                'city': submission.city,
                'asset_class': submission.asset_class,
                'price': submission.asking_price
            },
            'summary': {
                'buyers_matched': len(submission.matched_buyers),
                'agents_assembled': len(submission.matched_agents),
                'lenders_suggested': len(submission.matched_lenders),
                'comparables_found': len(submission.comparable_sales)
            },
            'outputs': {
                'markdown': markdown_output,
                'json': json_output
            },
            'next_steps': [
                'Contact top 3 buyers within 48 hours',
                'Schedule deal team coordination call',
                'Share package with preferred lenders',
                'Prepare marketing materials'
            ]
        }
    
    def get_deal_package(self, tracking_id: str, format: str = 'markdown') -> str:
        """
        Get deal package for a submission
        
        Args:
            tracking_id: Property tracking ID
            format: 'markdown', 'json', or 'dict'
            
        Returns:
            Formatted deal package
        """
        package_data = self.submission_agent.get_deal_package(tracking_id)
        
        if not package_data:
            return f"Error: Tracking ID {tracking_id} not found"
        
        deal_package = self.package_generator.generate_package(package_data)
        
        if format == 'markdown':
            return self.package_generator.generate_markdown_output(deal_package)
        elif format == 'json':
            return json.dumps(
                self.package_generator.generate_json_output(deal_package),
                indent=2
            )
        else:
            return self.package_generator.generate_json_output(deal_package)
    
    def quick_match(self, address: str, city: str, asset_class: str,
                   asking_price: float, **kwargs) -> Dict:
        """
        Quick property matching without full submission workflow
        
        Args:
            address: Property address
            city: Property city
            asset_class: Property type
            asking_price: Asking price
            **kwargs: Additional property details
            
        Returns:
            Quick match results
        """
        print(f"\n{'='*80}")
        print("⚡ QUICK MATCH MODE")
        print(f"{'='*80}")
        
        property_data = {
            'address': address,
            'city': city,
            'asset_class': asset_class,
            'asking_price': asking_price,
            **kwargs
        }
        
        # Use orchestrator directly
        results = self.orchestrator.research_property(property_data)
        
        # Extract top buyers
        buyers = []
        if 'matches' in results:
            for buyer in results['matches'].get('hot_money_buyers', [])[:5]:
                buyers.append({
                    'name': buyer.get('name'),
                    'score': buyer.get('match_score', 0),
                    'justification': f"Score breakdown: {buyer.get('match_breakdown', {})}"
                })
        
        return {
            'property': property_data,
            'top_buyers': buyers,
            'analysis_complete': True
        }
    
    def list_active_submissions(self) -> List[Dict]:
        """List all active property submissions"""
        submissions = []
        for tracking_id, submission in self.submission_agent.submissions.items():
            submissions.append({
                'tracking_id': tracking_id,
                'address': submission.address,
                'city': submission.city,
                'asset_class': submission.asset_class,
                'status': submission.status.value,
                'buyers': len(submission.matched_buyers),
                'agents': len(submission.matched_agents)
            })
        return submissions


# Singleton
_system = None

def get_property_matching_system() -> PropertyMatchingSystem:
    """Get or create singleton system"""
    global _system
    if _system is None:
        _system = PropertyMatchingSystem()
    return _system


def demo():
    """Run comprehensive demo"""
    print("\n" + "="*80)
    print("🏢 BIGDATACLAW PROPERTY MATCHING SYSTEM")
    print("   COMPREHENSIVE DEMO")
    print("="*80)
    
    # Initialize system
    system = get_property_matching_system()
    
    # Demo property: Bayshore Mall
    print("\n" + "="*80)
    print("📥 DEMO: Bayshore Mall Submission")
    print("="*80)
    
    property_data = {
        'address': '100 Bayshore Drive',
        'city': 'Ottawa',
        'province': 'ON',
        'asset_class': 'retail',
        'property_type': 'regional_mall',
        'asking_price': 300000000,
        'size_sf': 880000,
        'lot_size_acres': 45,
        'noi': 15400000,
        'occupancy': 75,
        'walt': 3.5,
        'anchor_tenants': ['HBC', 'Sport Chek', 'Cineplex'],
        'tenant_roster': [
            {'name': 'HBC', 'status': 'bankrupt', 'annual_rent': 2230000},
            {'name': 'Sport Chek', 'status': 'active', 'annual_rent': 850000},
            {'name': 'Cineplex', 'status': 'active', 'annual_rent': 650000}
        ],
        'listing_agent_name': 'John Smith',
        'listing_agent_company': 'Colliers',
        'listing_agent_email': 'john.smith@colliers.com',
        'listing_agent_phone': '613-555-0000'
    }
    
    # Full processing
    result = system.submit_and_process(property_data)
    
    # Display results
    print("\n" + "="*80)
    print("✅ PROCESSING COMPLETE")
    print("="*80)
    print(f"\n📋 Tracking ID: {result['tracking_id']}")
    print(f"🏢 Property: {result['property']['address']}, {result['property']['city']}")
    print(f"💰 Price: ${result['property']['price']:,.0f}")
    
    print(f"\n📊 Summary:")
    for key, value in result['summary'].items():
        print(f"   • {key.replace('_', ' ').title()}: {value}")
    
    print(f"\n✅ Next Steps:")
    for step in result['next_steps']:
        print(f"   {step}")
    
    # Show markdown preview
    print("\n" + "="*80)
    print("📄 MARKDOWN OUTPUT PREVIEW")
    print("="*80)
    md = result['outputs']['markdown']
    print(md[:3000])
    print("\n[... output truncated ...]")
    
    return result


if __name__ == "__main__":
    demo()
