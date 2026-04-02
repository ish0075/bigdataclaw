#!/usr/bin/env python3
"""
BigDataClaw Skill Registry & Loader System
Manages all agent skills with dynamic loading, enable/disable, and execution
"""

import importlib
import inspect
import json
import os
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
import traceback


@dataclass
class SkillMetadata:
    """Metadata for a registered skill"""
    name: str
    description: str
    agent: str  # Which agent this skill belongs to
    version: str
    author: str
    priority: str  # 'P0', 'P1', 'P2'
    status: str  # 'active', 'beta', 'deprecated'
    dependencies: List[str]
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    enabled: bool = True
    execution_count: int = 0
    last_executed: Optional[str] = None
    avg_execution_time_ms: Optional[float] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


class SkillExecutor:
    """Base class for all skill implementations"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.metadata = self._define_metadata()
    
    def _define_metadata(self) -> SkillMetadata:
        """Override this to define skill metadata"""
        raise NotImplementedError
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """Override this with skill logic"""
        raise NotImplementedError
    
    def validate_input(self, inputs: Dict) -> tuple[bool, str]:
        """Validate inputs against schema"""
        required = self.metadata.input_schema.get('required', [])
        for field in required:
            if field not in inputs:
                return False, f"Missing required field: {field}"
        return True, "Valid"


class SkillRegistry:
    """
    Central registry for all BigDataClaw agent skills
    
    Features:
    - Dynamic skill registration
    - Skill enable/disable
    - Dependency resolution
    - Execution tracking
    - Performance metrics
    """
    
    def __init__(self, registry_path: str = "agents/skills/registry.json"):
        self.registry_path = registry_path
        self.skills: Dict[str, SkillExecutor] = {}
        self.metadata: Dict[str, SkillMetadata] = {}
        self._execution_history: List[Dict] = []
        
        # Load existing registry
        self._load_registry()
        
        # Auto-discover and register built-in skills
        self._auto_register_skills()
    
    def _load_registry(self):
        """Load skill registry from disk"""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r') as f:
                    data = json.load(f)
                    for name, meta in data.get('skills', {}).items():
                        self.metadata[name] = SkillMetadata(**meta)
                print(f"✓ Loaded {len(self.metadata)} skills from registry")
            except Exception as e:
                print(f"⚠ Error loading registry: {e}")
    
    def _save_registry(self):
        """Save skill registry to disk"""
        data = {
            'last_updated': datetime.now().isoformat(),
            'skills': {name: meta.to_dict() for name, meta in self.metadata.items()}
        }
        try:
            with open(self.registry_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"⚠ Error saving registry: {e}")
    
    def _auto_register_skills(self):
        """Auto-discover and register all built-in skills"""
        # Import all skill modules
        skill_modules = [
            'agents.skills.implementations.fund_life_tracker',
            'agents.skills.implementations.distress_scanner',
            'agents.skills.implementations.cmbs_maturity_monitor',
            'agents.skills.implementations.web_scrape_comps',
        ]
        
        for module_path in skill_modules:
            try:
                module = importlib.import_module(module_path)
                # Find SkillExecutor subclasses
                for name, obj in inspect.getmembers(module):
                    if (inspect.isclass(obj) and 
                        issubclass(obj, SkillExecutor) and 
                        obj != SkillExecutor):
                        self.register_skill_class(obj)
            except ImportError:
                pass  # Module doesn't exist yet
    
    def register_skill_class(self, skill_class: type):
        """Register a skill class"""
        try:
            # Instantiate to get metadata
            instance = skill_class()
            meta = instance.metadata
            
            self.skills[meta.name] = skill_class
            self.metadata[meta.name] = meta
            
            print(f"✓ Registered skill: {meta.name} ({meta.agent})")
        except Exception as e:
            print(f"⚠ Error registering skill {skill_class}: {e}")
    
    def register_skill(self, name: str, skill_class: type, metadata: SkillMetadata):
        """Manually register a skill"""
        self.skills[name] = skill_class
        self.metadata[name] = metadata
        self._save_registry()
        print(f"✓ Registered skill: {name}")
    
    def get_skill(self, name: str) -> Optional[type]:
        """Get a skill class by name"""
        return self.skills.get(name)
    
    def get_metadata(self, name: str) -> Optional[SkillMetadata]:
        """Get skill metadata"""
        return self.metadata.get(name)
    
    def list_skills(self, agent: str = None, enabled_only: bool = True) -> List[SkillMetadata]:
        """List all skills, optionally filtered by agent"""
        skills = []
        for name, meta in self.metadata.items():
            if enabled_only and not meta.enabled:
                continue
            if agent and meta.agent != agent:
                continue
            skills.append(meta)
        return sorted(skills, key=lambda x: x.priority)
    
    def enable_skill(self, name: str):
        """Enable a skill"""
        if name in self.metadata:
            self.metadata[name].enabled = True
            self._save_registry()
            print(f"✓ Enabled skill: {name}")
    
    def disable_skill(self, name: str):
        """Disable a skill"""
        if name in self.metadata:
            self.metadata[name].enabled = False
            self._save_registry()
            print(f"✓ Disabled skill: {name}")
    
    def execute_skill(self, name: str, **kwargs) -> Dict[str, Any]:
        """
        Execute a skill with full tracking
        
        Returns:
            Dict with 'success', 'result', 'execution_time_ms', 'error'
        """
        start_time = datetime.now()
        
        # Check if skill exists and is enabled
        if name not in self.skills:
            return {
                'success': False,
                'error': f"Skill '{name}' not found",
                'execution_time_ms': 0
            }
        
        meta = self.metadata.get(name)
        if meta and not meta.enabled:
            return {
                'success': False,
                'error': f"Skill '{name}' is disabled",
                'execution_time_ms': 0
            }
        
        # Check dependencies
        if meta:
            for dep in meta.dependencies:
                if dep not in self.skills:
                    return {
                        'success': False,
                        'error': f"Missing dependency: {dep}",
                        'execution_time_ms': 0
                    }
        
        # Execute skill
        try:
            skill_class = self.skills[name]
            instance = skill_class()
            
            # Validate input
            valid, error_msg = instance.validate_input(kwargs)
            if not valid:
                return {
                    'success': False,
                    'error': error_msg,
                    'execution_time_ms': 0
                }
            
            # Execute
            result = instance.execute(**kwargs)
            
            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Update metrics
            if meta:
                meta.execution_count += 1
                meta.last_executed = datetime.now().isoformat()
                if meta.avg_execution_time_ms:
                    meta.avg_execution_time_ms = (
                        (meta.avg_execution_time_ms * (meta.execution_count - 1) + execution_time)
                        / meta.execution_count
                    )
                else:
                    meta.avg_execution_time_ms = execution_time
                self._save_registry()
            
            # Log execution
            self._execution_history.append({
                'skill': name,
                'timestamp': datetime.now().isoformat(),
                'execution_time_ms': execution_time,
                'success': True,
                'inputs': kwargs
            })
            
            return {
                'success': True,
                'result': result,
                'execution_time_ms': execution_time
            }
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            error_trace = traceback.format_exc()
            
            self._execution_history.append({
                'skill': name,
                'timestamp': datetime.now().isoformat(),
                'execution_time_ms': execution_time,
                'success': False,
                'error': str(e),
                'traceback': error_trace
            })
            
            return {
                'success': False,
                'error': str(e),
                'traceback': error_trace,
                'execution_time_ms': execution_time
            }
    
    def execute_skills_for_agent(self, agent_name: str, context: Dict) -> Dict[str, Any]:
        """
        Execute all enabled skills for a specific agent
        
        Args:
            agent_name: Name of the agent (e.g., 'hot_money_identifier')
            context: Data to pass to skills
            
        Returns:
            Dict with results from all skills
        """
        skills = self.list_skills(agent=agent_name, enabled_only=True)
        results = {}
        
        print(f"\n🔧 Executing {len(skills)} skills for {agent_name}...")
        
        for meta in skills:
            print(f"  Running {meta.name}...")
            result = self.execute_skill(meta.name, **context)
            results[meta.name] = result
            
            if result['success']:
                print(f"    ✓ Success ({result['execution_time_ms']:.0f}ms)")
            else:
                print(f"    ✗ Failed: {result.get('error', 'Unknown error')}")
        
        return results
    
    def get_execution_stats(self) -> Dict[str, Any]:
        """Get execution statistics"""
        if not self._execution_history:
            return {'message': 'No executions yet'}
        
        total = len(self._execution_history)
        successful = sum(1 for e in self._execution_history if e['success'])
        failed = total - successful
        
        avg_time = sum(e['execution_time_ms'] for e in self._execution_history) / total
        
        skill_stats = {}
        for entry in self._execution_history:
            skill = entry['skill']
            if skill not in skill_stats:
                skill_stats[skill] = {'total': 0, 'success': 0, 'failed': 0}
            skill_stats[skill]['total'] += 1
            if entry['success']:
                skill_stats[skill]['success'] += 1
            else:
                skill_stats[skill]['failed'] += 1
        
        return {
            'total_executions': total,
            'successful': successful,
            'failed': failed,
            'success_rate': successful / total * 100,
            'avg_execution_time_ms': avg_time,
            'skill_breakdown': skill_stats
        }
    
    def print_registry(self):
        """Print formatted registry view"""
        print("\n" + "="*80)
        print("BIGDATACLAW SKILL REGISTRY")
        print("="*80)
        
        # Group by agent
        by_agent = {}
        for name, meta in self.metadata.items():
            agent = meta.agent
            if agent not in by_agent:
                by_agent[agent] = []
            by_agent[agent].append(meta)
        
        for agent, skills in sorted(by_agent.items()):
            print(f"\n🏢 {agent.upper().replace('_', ' ')}")
            print("-" * 80)
            for skill in sorted(skills, key=lambda x: x.priority):
                status_icon = "✓" if skill.enabled else "✗"
                priority_color = "🔴" if skill.priority == "P0" else "🟡" if skill.priority == "P1" else "🟢"
                print(f"  {status_icon} {priority_color} {skill.name:<30} {skill.description[:40]}...")
                print(f"     Version: {skill.version} | Executions: {skill.execution_count} | Status: {skill.status}")
        
        print("\n" + "="*80)
        print(f"Total Skills: {len(self.metadata)}")
        print(f"Active: {sum(1 for m in self.metadata.values() if m.enabled)}")
        print(f"Disabled: {sum(1 for m in self.metadata.values() if not m.enabled)}")
        print("="*80)


# Singleton instance
_registry = None

def get_skill_registry() -> SkillRegistry:
    """Get or create singleton skill registry"""
    global _registry
    if _registry is None:
        _registry = SkillRegistry()
    return _registry


if __name__ == "__main__":
    # Test the registry
    registry = get_skill_registry()
    registry.print_registry()
    
    print("\n📊 Execution Stats:")
    stats = registry.get_execution_stats()
    print(json.dumps(stats, indent=2))
