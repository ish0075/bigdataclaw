#!/usr/bin/env python3
"""
Notification Service for Agent Workspace System
Handles Telegram and SMS notifications for Commanders
"""

import os
import json
import sqlite3
import asyncio
import aiohttp
from datetime import datetime
from typing import Optional, List, Dict
from pathlib import Path

# Database path
DB_PATH = Path('/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/bigdataclaw.db')

class NotificationService:
    """Service for sending notifications via Telegram and SMS"""
    
    def __init__(self):
        self.telegram_bot_token = os.getenv('TELEGRAM_BOT_TOKEN', '')
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.twilio_phone = os.getenv('TWILIO_PHONE_NUMBER', '')
    
    def get_db(self):
        """Get database connection"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    
    async def send_telegram_message(self, chat_id: str, message: str, parse_mode: str = 'Markdown') -> Dict:
        """Send a message via Telegram Bot API"""
        if not self.telegram_bot_token or not chat_id:
            return {'success': False, 'error': 'Telegram not configured'}
        
        url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
        
        payload = {
            'chat_id': chat_id,
            'text': message,
            'parse_mode': parse_mode,
            'disable_web_page_preview': True
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    result = await response.json()
                    if result.get('ok'):
                        return {
                            'success': True,
                            'message_id': result['result']['message_id'],
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        return {
                            'success': False,
                            'error': result.get('description', 'Unknown error')
                        }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def send_sms(self, phone_number: str, message: str) -> Dict:
        """Send SMS via Twilio"""
        if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_phone]):
            return {'success': False, 'error': 'Twilio not configured'}
        
        if not phone_number:
            return {'success': False, 'error': 'Phone number required'}
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json"
        
        auth = aiohttp.BasicAuth(self.twilio_account_sid, self.twilio_auth_token)
        
        payload = {
            'To': phone_number,
            'From': self.twilio_phone,
            'Body': message
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=payload, auth=auth) as response:
                    if response.status == 201:
                        result = await response.json()
                        return {
                            'success': True,
                            'sid': result.get('sid'),
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        error_text = await response.text()
                        return {'success': False, 'error': error_text}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_commander_notification_prefs(self, commander_id: str) -> Dict:
        """Get notification preferences for a commander"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT telegram_chat_id, phone_number, notification_prefs, alert_threshold
            FROM commanders WHERE commander_id = ?
        """, (commander_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {}
        
        prefs = json.loads(row['notification_prefs']) if row['notification_prefs'] else {}
        
        return {
            'telegram_chat_id': row['telegram_chat_id'],
            'phone_number': row['phone_number'],
            'telegram_enabled': prefs.get('telegram', False),
            'sms_enabled': prefs.get('sms', False),
            'email_enabled': prefs.get('email', False),
            'alert_threshold': row['alert_threshold']
        }
    
    async def notify_commander(self, commander_id: str, title: str, message: str, 
                               priority: str = 'normal') -> Dict:
        """Send notification to commander based on their preferences"""
        prefs = self.get_commander_notification_prefs(commander_id)
        
        if not prefs:
            return {'success': False, 'error': 'Commander not found'}
        
        results = {
            'telegram': None,
            'sms': None,
            'email': None
        }
        
        # Telegram notification
        if prefs['telegram_enabled'] and prefs['telegram_chat_id']:
            emoji = {'critical': '🚨', 'high': '⚠️', 'normal': 'ℹ️'}.get(priority, 'ℹ️')
            telegram_msg = f"{emoji} *{title}*\n\n{message}"
            results['telegram'] = await self.send_telegram_message(
                prefs['telegram_chat_id'], 
                telegram_msg
            )
        
        # SMS notification (only for high priority)
        if priority in ['critical', 'high'] and prefs['sms_enabled'] and prefs['phone_number']:
            sms_msg = f"{title}: {message[:140]}"  # SMS character limit
            results['sms'] = await self.send_sms(prefs['phone_number'], sms_msg)
        
        # Log the notification
        await self.log_notification(commander_id, title, message, priority, results)
        
        return results
    
    async def log_notification(self, commander_id: str, title: str, message: str,
                               priority: str, results: Dict):
        """Log notification to database"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO division_reports 
            (report_id, division, commander_id, report_type, title, content, 
             metrics_json, delivery_status, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            f"rpt_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'Notification',
            commander_id,
            'alert' if priority in ['critical', 'high'] else 'update',
            title,
            message,
            json.dumps(results),
            'delivered' if any(r and r.get('success') for r in results.values() if r) else 'failed'
        ))
        
        conn.commit()
        conn.close()
    
    async def send_division_report(self, commander_id: str) -> Dict:
        """Generate and send division report to commander"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        # Get commander info
        cursor.execute("""
            SELECT c.name, c.division, c.telegram_chat_id, c.phone_number,
                   COUNT(DISTINCT aw.agent_id) as agent_count,
                   COUNT(DISTINCT CASE WHEN aw.status = 'active' THEN aw.agent_id END) as active_agents,
                   COUNT(DISTINCT at.id) as total_tasks,
                   COUNT(DISTINCT CASE WHEN at.status = 'completed' THEN at.id END) as completed_tasks,
                   COUNT(DISTINCT CASE WHEN at.status = 'in_progress' THEN at.id END) as active_tasks
            FROM commanders c
            LEFT JOIN agent_workspaces aw ON c.division = aw.division
            LEFT JOIN agent_tasks at ON aw.agent_id = at.agent_id
            WHERE c.commander_id = ?
            GROUP BY c.commander_id
        """, (commander_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {'success': False, 'error': 'Commander not found'}
        
        # Format report
        completion_rate = round((row['completed_tasks'] / row['total_tasks'] * 100), 1) if row['total_tasks'] > 0 else 0
        
        report_title = f"📊 {row['division']} Division Daily Report"
        report_message = f"""*Division Status Summary*

👥 Agents: {row['active_agents']}/{row['agent_count']} active
📋 Tasks: {row['total_tasks']} total
✅ Completed: {row['completed_tasks']} ({completion_rate}%)
🔄 In Progress: {row['active_tasks']}

_Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}_"""
        
        # Send report
        results = await self.notify_commander(commander_id, report_title, report_message, 'normal')
        
        return {
            'success': True,
            'report_sent': any(r and r.get('success') for r in results.values() if r),
            'details': results
        }
    
    async def alert_task_blocked(self, agent_id: str, task_id: str, reason: str):
        """Alert commander when a task is blocked"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        # Get agent and commander info
        cursor.execute("""
            SELECT aw.agent_name, aw.commander_id, c.name as commander_name
            FROM agent_workspaces aw
            JOIN commanders c ON aw.commander_id = c.commander_id
            WHERE aw.agent_id = ?
        """, (agent_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return
        
        # Get task info
        cursor.execute("SELECT title FROM agent_tasks WHERE task_id = ?", (task_id,))
        task_row = cursor.fetchone()
        conn.close()
        
        title = f"🚨 Task Blocked: {task_row['title'] if task_row else 'Unknown'}"
        message = f"Agent: {row['agent_name']}\nReason: {reason}\nTask ID: {task_id}"
        
        await self.notify_commander(row['commander_id'], title, message, 'high')
    
    async def alert_critical_error(self, agent_id: str, error_message: str):
        """Alert commander of critical agent error"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT agent_name, commander_id FROM agent_workspaces WHERE agent_id = ?
        """, (agent_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return
        
        title = f"🚨 CRITICAL: {row['agent_name']} Error"
        message = f"Agent encountered a critical error:\n\n{error_message}"
        
        await self.notify_commander(row['commander_id'], title, message, 'critical')


# FastAPI endpoints for notifications
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class NotificationRequest(BaseModel):
    commander_id: str
    title: str
    message: str
    priority: str = 'normal'

class BroadcastRequest(BaseModel):
    division: Optional[str] = None
    title: str
    message: str

@notification_router.post("/send")
async def send_notification(request: NotificationRequest):
    """Send notification to a specific commander"""
    service = NotificationService()
    result = await service.notify_commander(
        request.commander_id,
        request.title,
        request.message,
        request.priority
    )
    return result

@notification_router.post("/report/{commander_id}")
async def send_division_report(commander_id: str):
    """Generate and send division report"""
    service = NotificationService()
    result = await service.send_division_report(commander_id)
    return result

@notification_router.get("/commander/{commander_id}/prefs")
async def get_notification_preferences(commander_id: str):
    """Get notification preferences for a commander"""
    service = NotificationService()
    prefs = service.get_commander_notification_prefs(commander_id)
    if not prefs:
        raise HTTPException(status_code=404, detail="Commander not found")
    return prefs

@notification_router.put("/commander/{commander_id}/prefs")
async def update_notification_preferences(
    commander_id: str,
    telegram_enabled: bool = None,
    sms_enabled: bool = None,
    email_enabled: bool = None,
    telegram_chat_id: str = None,
    phone_number: str = None
):
    """Update notification preferences"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get current prefs
    cursor.execute("SELECT notification_prefs FROM commanders WHERE commander_id = ?", (commander_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Commander not found")
    
    prefs = json.loads(row[0]) if row[0] else {}
    
    if telegram_enabled is not None:
        prefs['telegram'] = telegram_enabled
    if sms_enabled is not None:
        prefs['sms'] = sms_enabled
    if email_enabled is not None:
        prefs['email'] = email_enabled
    
    updates = ["notification_prefs = ?"]
    params = [json.dumps(prefs)]
    
    if telegram_chat_id is not None:
        updates.append("telegram_chat_id = ?")
        params.append(telegram_chat_id)
    if phone_number is not None:
        updates.append("phone_number = ?")
        params.append(phone_number)
    
    params.append(commander_id)
    
    cursor.execute(f"""
        UPDATE commanders 
        SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
        WHERE commander_id = ?
    """, params)
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Preferences updated"}


# Scheduled report sender
async def send_scheduled_reports():
    """Send scheduled reports to all commanders based on their schedule"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT commander_id, report_schedule, last_report_sent
        FROM commanders WHERE status = 'active'
    """)
    
    commanders = cursor.fetchall()
    conn.close()
    
    service = NotificationService()
    
    for commander in commanders:
        commander_id = commander['commander_id']
        schedule = commander['report_schedule']
        last_sent = commander['last_report_sent']
        
        should_send = False
        
        if schedule == 'hourly':
            should_send = True  # Always check hourly
        elif schedule == 'daily':
            should_send = not last_sent or (datetime.now() - datetime.fromisoformat(last_sent)).days >= 1
        elif schedule == 'weekly':
            should_send = not last_sent or (datetime.now() - datetime.fromisoformat(last_sent)).days >= 7
        
        if should_send:
            await service.send_division_report(commander_id)
            
            # Update last report sent
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE commanders SET last_report_sent = CURRENT_TIMESTAMP
                WHERE commander_id = ?
            """, (commander_id,))
            conn.commit()
            conn.close()


if __name__ == '__main__':
    # Test the notification service
    async def test():
        service = NotificationService()
        
        # Test getting prefs
        prefs = service.get_commander_notification_prefs('cmdr_intel')
        print("Commander Prefs:", prefs)
        
        # Test sending report
        result = await service.send_division_report('cmdr_intel')
        print("Report Result:", result)
    
    asyncio.run(test())
