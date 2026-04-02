#!/usr/bin/env python3
"""
Agent Workspace API Module
Endpoints for agent workspaces, tasks, memory, and commander system
"""

import json
import os
import sqlite3
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query

# Database path
DB_PATH = Path('/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/bigdataclaw.db')

# Router
router = APIRouter(prefix="/api/agents", tags=["Agent Workspaces"])

# Database connection
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ============================================================================
# Pydantic Models
# ============================================================================

class SoulMD(BaseModel):
    purpose: str
    personality: str
    skills: List[str]
    boundaries: List[str]
    goals: List[str]
    voice: str

class AgentWorkspace(BaseModel):
    id: int
    agent_id: str
    agent_name: str
    agent_type: str
    division: str
    commander_id: str
    status: str
    soulmd: Optional[SoulMD] = None
    mood: str
    current_activity: Optional[str] = None
    last_active: Optional[datetime] = None
    created_at: datetime

class AgentTask(BaseModel):
    id: int
    agent_id: str
    task_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    deadline: Optional[datetime] = None
    created_by: Optional[str] = None
    parent_task_id: Optional[str] = None
    dependencies: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    completion_notes: Optional[str] = None
    blocked_reason: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class AgentMemory(BaseModel):
    id: int
    agent_id: str
    memory_type: str
    content: str
    summary: Optional[str] = None
    tags: Optional[str] = None
    importance: int
    context_keep_id: Optional[str] = None
    source_task_id: Optional[str] = None
    created_at: datetime
    accessed_at: Optional[datetime] = None

class AgentConversation(BaseModel):
    id: int
    agent_id: str
    commander_id: Optional[str] = None
    message_id: str
    role: str
    content: str
    message_type: str
    requires_response: bool
    responded_at: Optional[datetime] = None
    created_at: datetime

class Commander(BaseModel):
    id: int
    commander_id: str
    name: str
    division: str
    title: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    notification_prefs: Dict[str, bool]
    alert_threshold: str
    report_schedule: str
    status: str
    last_report_sent: Optional[datetime] = None

class DivisionReport(BaseModel):
    id: int
    report_id: str
    division: str
    commander_id: str
    report_type: str
    title: str
    content: str
    summary: Optional[str] = None
    metrics: Dict[str, Any]
    sent_via: Optional[str] = None
    delivery_status: str
    sent_at: Optional[datetime] = None
    created_at: datetime

class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    deadline: Optional[str] = None
    parent_task_id: Optional[str] = None
    created_by: str = "commander"

class UpdateTaskRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    completion_notes: Optional[str] = None
    blocked_reason: Optional[str] = None
    actual_hours: Optional[float] = None

class CreateMemoryRequest(BaseModel):
    memory_type: str
    content: str
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    importance: int = 5
    source_task_id: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str
    message_type: str = "text"
    requires_response: bool = False

# ============================================================================
# Agent Workspace Endpoints
# ============================================================================

@router.get("/workspaces", response_model=List[AgentWorkspace])
async def get_agent_workspaces(
    division: Optional[str] = None,
    commander_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get all agent workspaces with optional filtering"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM agent_workspaces WHERE 1=1"
    params = []
    
    if division:
        query += " AND division = ?"
        params.append(division)
    if commander_id:
        query += " AND commander_id = ?"
        params.append(commander_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    
    query += " ORDER BY division, agent_name"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    workspaces = []
    for row in rows:
        ws = dict(row)
        if ws.get('soulmd_json'):
            ws['soulmd'] = json.loads(ws['soulmd_json'])
        del ws['soulmd_json']
        del ws['config_json']
        workspaces.append(AgentWorkspace(**ws))
    
    return workspaces

@router.get("/workspaces/{agent_id}", response_model=AgentWorkspace)
async def get_agent_workspace(agent_id: str):
    """Get specific agent workspace details"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM agent_workspaces WHERE agent_id = ?", (agent_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Agent workspace not found")
    
    ws = dict(row)
    if ws.get('soulmd_json'):
        ws['soulmd'] = json.loads(ws['soulmd_json'])
    del ws['soulmd_json']
    del ws['config_json']
    
    return AgentWorkspace(**ws)

@router.get("/workspaces/{agent_id}/soulmd")
async def get_agent_soulmd(agent_id: str):
    """Get agent's SoulMD (identity definition)"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT soulmd_json, agent_name, agent_type FROM agent_workspaces WHERE agent_id = ?", (agent_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    soulmd = json.loads(row['soulmd_json']) if row['soulmd_json'] else {}
    return {
        "agent_id": agent_id,
        "agent_name": row['agent_name'],
        "agent_type": row['agent_type'],
        "soulmd": soulmd
    }

@router.put("/workspaces/{agent_id}/soulmd")
async def update_agent_soulmd(agent_id: str, soulmd: SoulMD):
    """Update agent's SoulMD"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE agent_workspaces 
        SET soulmd_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE agent_id = ?
    """, (json.dumps(soulmd.dict()), agent_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Agent not found")
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "SoulMD updated"}

@router.put("/workspaces/{agent_id}/status")
async def update_agent_status(agent_id: str, status: str, current_activity: Optional[str] = None):
    """Update agent status and current activity"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE agent_workspaces 
        SET status = ?, current_activity = ?, last_active = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE agent_id = ?
    """, (status, current_activity, agent_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Agent not found")
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "agent_id": agent_id, "status": status}

# ============================================================================
# Task Management Endpoints
# ============================================================================

@router.get("/workspaces/{agent_id}/tasks", response_model=List[AgentTask])
async def get_agent_tasks(
    agent_id: str,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
):
    """Get tasks for an agent"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM agent_tasks WHERE agent_id = ?"
    params = [agent_id]
    
    if status:
        query += " AND status = ?"
        params.append(status)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    
    query += """ ORDER BY 
        CASE priority 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
        END,
        created_at DESC
        LIMIT ?"""
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [AgentTask(**dict(row)) for row in rows]

@router.post("/workspaces/{agent_id}/tasks")
async def create_agent_task(agent_id: str, request: CreateTaskRequest):
    """Create a new task for an agent"""
    conn = get_db()
    cursor = conn.cursor()
    
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    deadline = None
    if request.deadline:
        try:
            deadline = datetime.fromisoformat(request.deadline.replace('Z', '+00:00'))
        except:
            pass
    
    cursor.execute("""
        INSERT INTO agent_tasks 
        (agent_id, task_id, title, description, priority, deadline, created_by, parent_task_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    """, (agent_id, task_id, request.title, request.description, request.priority, 
          deadline, request.created_by, request.parent_task_id))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "task_id": task_id, "message": "Task created"}

@router.get("/workspaces/{agent_id}/tasks/{task_id}", response_model=AgentTask)
async def get_task_details(agent_id: str, task_id: str):
    """Get specific task details"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM agent_tasks WHERE agent_id = ? AND task_id = ?", (agent_id, task_id))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return AgentTask(**dict(row))

@router.put("/workspaces/{agent_id}/tasks/{task_id}")
async def update_agent_task(agent_id: str, task_id: str, request: UpdateTaskRequest):
    """Update a task"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Build update query dynamically
    updates = []
    params = []
    
    if request.status:
        updates.append("status = ?")
        params.append(request.status)
        if request.status == 'in_progress':
            updates.append("started_at = COALESCE(started_at, CURRENT_TIMESTAMP)")
        elif request.status == 'completed':
            updates.append("completed_at = CURRENT_TIMESTAMP")
    
    if request.priority:
        updates.append("priority = ?")
        params.append(request.priority)
    if request.description:
        updates.append("description = ?")
        params.append(request.description)
    if request.completion_notes:
        updates.append("completion_notes = ?")
        params.append(request.completion_notes)
    if request.blocked_reason:
        updates.append("blocked_reason = ?")
        params.append(request.blocked_reason)
    if request.actual_hours is not None:
        updates.append("actual_hours = ?")
        params.append(request.actual_hours)
    
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.extend([agent_id, task_id])
    
    query = f"UPDATE agent_tasks SET {', '.join(updates)} WHERE agent_id = ? AND task_id = ?"
    cursor.execute(query, params)
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "task_id": task_id, "message": "Task updated"}

@router.delete("/workspaces/{agent_id}/tasks/{task_id}")
async def delete_agent_task(agent_id: str, task_id: str):
    """Delete a task"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM agent_tasks WHERE agent_id = ? AND task_id = ?", (agent_id, task_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Task deleted"}

# ============================================================================
# Memory Endpoints
# ============================================================================

@router.get("/workspaces/{agent_id}/memory", response_model=List[AgentMemory])
async def get_agent_memory(
    agent_id: str,
    memory_type: Optional[str] = None,
    tags: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
):
    """Get agent memory entries"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM agent_memory WHERE agent_id = ?"
    params = [agent_id]
    
    if memory_type:
        query += " AND memory_type = ?"
        params.append(memory_type)
    if tags:
        query += " AND tags LIKE ?"
        params.append(f"%{tags}%")
    
    query += " ORDER BY importance DESC, created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [AgentMemory(**dict(row)) for row in rows]

@router.post("/workspaces/{agent_id}/memory")
async def create_memory(agent_id: str, request: CreateMemoryRequest):
    """Create a new memory entry"""
    conn = get_db()
    cursor = conn.cursor()
    
    tags_str = ",".join(request.tags) if request.tags else None
    
    cursor.execute("""
        INSERT INTO agent_memory 
        (agent_id, memory_type, content, summary, tags, importance, source_task_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (agent_id, request.memory_type, request.content, request.summary, 
          tags_str, request.importance, request.source_task_id))
    
    memory_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"status": "success", "memory_id": memory_id, "message": "Memory stored"}

@router.put("/workspaces/{agent_id}/memory/{memory_id}/access")
async def update_memory_access(agent_id: str, memory_id: int):
    """Update memory access timestamp"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE agent_memory SET accessed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND agent_id = ?
    """, (memory_id, agent_id))
    
    conn.commit()
    conn.close()
    
    return {"status": "success"}

# ============================================================================
# Conversation Endpoints
# ============================================================================

@router.get("/workspaces/{agent_id}/conversations", response_model=List[AgentConversation])
async def get_conversations(
    agent_id: str,
    limit: int = Query(50, ge=1, le=100)
):
    """Get conversation history for an agent"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM agent_conversations 
        WHERE agent_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (agent_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [AgentConversation(**dict(row)) for row in rows]

@router.post("/workspaces/{agent_id}/conversations")
async def send_message(agent_id: str, request: SendMessageRequest):
    """Send a message to/from an agent"""
    conn = get_db()
    cursor = conn.cursor()
    
    message_id = f"msg_{uuid.uuid4().hex[:8]}"
    
    cursor.execute("""
        INSERT INTO agent_conversations 
        (agent_id, message_id, role, content, message_type, requires_response)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (agent_id, message_id, "user", request.content, request.message_type, request.requires_response))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message_id": message_id, "message": "Message sent"}

# ============================================================================
# Commander Endpoints
# ============================================================================

@router.get("/commanders", response_model=List[Commander])
async def get_commanders(division: Optional[str] = None):
    """Get all commanders"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM commanders WHERE 1=1"
    params = []
    
    if division:
        query += " AND division = ?"
        params.append(division)
    
    query += " ORDER BY division"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    commanders = []
    for row in rows:
        cmdr = dict(row)
        if cmdr.get('notification_prefs'):
            cmdr['notification_prefs'] = json.loads(cmdr['notification_prefs'])
        else:
            cmdr['notification_prefs'] = {}
        commanders.append(Commander(**cmdr))
    
    return commanders

@router.get("/commanders/{commander_id}", response_model=Commander)
async def get_commander(commander_id: str):
    """Get commander details"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM commanders WHERE commander_id = ?", (commander_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Commander not found")
    
    cmdr = dict(row)
    if cmdr.get('notification_prefs'):
        cmdr['notification_prefs'] = json.loads(cmdr['notification_prefs'])
    
    return Commander(**cmdr)

@router.get("/commanders/{commander_id}/dashboard")
async def get_commander_dashboard(commander_id: str):
    """Get comprehensive dashboard for a commander"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get commander info
    cursor.execute("SELECT * FROM commanders WHERE commander_id = ?", (commander_id,))
    commander = cursor.fetchone()
    
    if not commander:
        conn.close()
        raise HTTPException(status_code=404, detail="Commander not found")
    
    # Get all agents in division
    cursor.execute("""
        SELECT agent_id, agent_name, agent_type, status, mood, current_activity, last_active
        FROM agent_workspaces WHERE division = ?
    """, (commander['division'],))
    agents = [dict(row) for row in cursor.fetchall()]
    
    # Get task stats
    cursor.execute("""
        SELECT 
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN priority = 'critical' AND status != 'completed' THEN 1 ELSE 0 END) as critical_open
        FROM agent_tasks
        WHERE agent_id IN (SELECT agent_id FROM agent_workspaces WHERE division = ?)
    """, (commander['division'],))
    task_stats = dict(cursor.fetchone())
    
    # Get recent alerts (blocked tasks)
    cursor.execute("""
        SELECT task_id, title, agent_id, blocked_reason, priority
        FROM agent_tasks
        WHERE agent_id IN (SELECT agent_id FROM agent_workspaces WHERE division = ?)
        AND blocked_reason IS NOT NULL
        AND status != 'completed'
        ORDER BY created_at DESC
        LIMIT 5
    """, (commander['division'],))
    alerts = [dict(row) for row in cursor.fetchall()]
    
    # Get recent reports
    cursor.execute("""
        SELECT report_id, report_type, title, summary, sent_at, delivery_status
        FROM division_reports
        WHERE commander_id = ?
        ORDER BY created_at DESC
        LIMIT 5
    """, (commander_id,))
    reports = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "commander": {
            "commander_id": commander['commander_id'],
            "name": commander['name'],
            "division": commander['division'],
            "title": commander['title']
        },
        "agents": agents,
        "task_stats": task_stats,
        "alerts": alerts,
        "recent_reports": reports
    }

@router.post("/commanders/{commander_id}/broadcast")
async def broadcast_to_agents(commander_id: str, message: SendMessageRequest):
    """Broadcast message to all agents in division"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get commander's division
    cursor.execute("SELECT division FROM commanders WHERE commander_id = ?", (commander_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Commander not found")
    
    division = row['division']
    
    # Get all agents in division
    cursor.execute("SELECT agent_id FROM agent_workspaces WHERE division = ?", (division,))
    agents = cursor.fetchall()
    
    # Send message to each agent
    sent_count = 0
    for agent in agents:
        message_id = f"msg_{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO agent_conversations 
            (agent_id, commander_id, message_id, role, content, message_type, requires_response)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (agent['agent_id'], commander_id, message_id, "commander", 
              message.content, message.message_type, message.requires_response))
        sent_count += 1
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": f"Broadcast sent to {sent_count} agents",
        "division": division,
        "agents_reached": sent_count
    }

# ============================================================================
# Division Stats
# ============================================================================

@router.get("/divisions/stats")
async def get_division_stats():
    """Get statistics for all divisions"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            division,
            COUNT(*) as agent_count,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_agents
        FROM agent_workspaces
        GROUP BY division
    """)
    division_agents = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("""
        SELECT 
            aw.division,
            COUNT(*) as total_tasks,
            SUM(CASE WHEN at.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN at.status = 'in_progress' THEN 1 ELSE 0 END) as active_tasks,
            SUM(CASE WHEN at.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks
        FROM agent_tasks at
        JOIN agent_workspaces aw ON at.agent_id = aw.agent_id
        GROUP BY aw.division
    """)
    division_tasks = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Merge stats
    stats = {}
    for d in division_agents:
        stats[d['division']] = {
            'agents': d['agent_count'],
            'active_agents': d['active_agents'],
            'tasks': {'total': 0, 'completed': 0, 'active': 0, 'pending': 0}
        }
    
    for d in division_tasks:
        if d['division'] in stats:
            stats[d['division']]['tasks'] = {
                'total': d['total_tasks'],
                'completed': d['completed_tasks'],
                'active': d['active_tasks'],
                'pending': d['pending_tasks']
            }
    
    return {"divisions": stats}

# ============================================================================
# Activity Logging
# ============================================================================

def log_agent_activity(agent_id: str, activity_type: str, description: str, metadata: dict = None):
    """Log agent activity"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO agent_activity_logs (agent_id, activity_type, description, metadata_json)
        VALUES (?, ?, ?, ?)
    """, (agent_id, activity_type, description, json.dumps(metadata or {})))
    
    conn.commit()
    conn.close()

@router.get("/workspaces/{agent_id}/activity")
async def get_agent_activity(
    agent_id: str,
    activity_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
):
    """Get agent activity log"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM agent_activity_logs WHERE agent_id = ?"
    params = [agent_id]
    
    if activity_type:
        query += " AND activity_type = ?"
        params.append(activity_type)
    
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    activities = []
    for row in rows:
        act = dict(row)
        if act.get('metadata_json'):
            act['metadata'] = json.loads(act['metadata_json'])
            del act['metadata_json']
        activities.append(act)
    
    return activities
