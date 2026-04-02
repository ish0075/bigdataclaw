# Realtor Bot - Smart Agent Search Assistant

## Overview
A persistent AI assistant that sits on agent recruitment pages, helping users find agents by searching the database first, then Google and Realtor.ca if needed. Automatically saves new agents with quick links.

---

## Features

### 🔍 **Multi-Source Search**
1. **Database First** - Searches 96,000+ agents in local database
2. **Google Fallback** - Searches web if not found locally  
3. **Realtor.ca** - Checks official profiles
4. **Auto-Save** - Saves new agents with quick links

### 💬 **Chat Interface**
- Floating button in bottom-right corner
- Expandable chat window
- Natural language queries
- Suggested actions

### 🛠️ **Skills Display**
- Database Search (96K+ agents)
- Google Search
- Realtor.ca Integration
- Auto-Save with Quick Links

### 📋 **Smart Results**
- Database agents shown with "In Database" badge
- New agents marked with "Saved to Database"
- Quick links for Google, LinkedIn, Facebook, Realtor.ca
- Contact info (phone, email) when available

---

## Usage

### Where It Appears
- ✅ EXP Agent Recruiter page (`/exp-agent-recruiter`)
- ✅ Commercial Agent Recruiter page (`/commercial-agent-recruiter`)
- ✅ Brokerages page (`/brokerages`)

### How to Use
1. Click **"Realtor Assistant"** floating button
2. Type agent name or ask a question
3. Bot searches database → Google → Realtor.ca
4. View results with quick links
5. New agents automatically saved to database

### Example Queries
```
"Find John Smith"
"Search Toronto agents"
"Who works at RE/MAX Niagara?"
"Find agents in St. Catharines"
"What can you do?"
"Show me stats"
```

---

## API Endpoints

### POST `/api/realtor-bot/search`
Search for agents across all sources
```json
{
  "query": "John Smith",
  "context": "exp-agent-recruiter"
}
```

**Response:**
```json
{
  "query": "John Smith",
  "from_database": [...],
  "from_google": [...],
  "from_realtor_ca": [...],
  "saved_new": [...],
  "total_found": 5
}
```

### POST `/api/realtor-bot/chat`
Chat with the bot
```json
{
  "message": "Find John Smith",
  "context": "exp-agent-recruiter"
}
```

### GET `/api/realtor-bot/stats`
Get bot usage statistics

---

## Files Created

```
bigdataclaw/
├── realtor_bot_api.py                 # Backend API
└── nerve/src/components/RealtorBot/
    └── RealtorBotWidget.jsx           # Frontend widget
```

---

## Technical Details

### Search Flow
```
User Query
    ↓
Search Database (96K agents)
    ↓ (if < 3 results)
Search Google
    ↓
Extract Contact Info
    ↓
Save to Database
    ↓
Generate Quick Links
    ↓
Display Results
```

### Quick Links Generated
- Google Search
- LinkedIn Profile
- Facebook Search
- Realtor.ca Profile
- Brokerage Google Search

### Database Schema
Agents saved to `recruiters` table with:
- name, email, phone
- brokerage, city
- quick_links (JSON)
- status: 'new'
- created_at

---

## Configuration

### Environment Variables
```bash
SERPER_API_KEY=your_serper_api_key  # For Google Search
```

Get free API key at: https://serper.dev

---

## Future Enhancements

1. **LinkedIn Scraping** - Extract profile data
2. **Photo Recognition** - Match agent photos
3. **Social Media Links** - Auto-find Instagram, Twitter
4. **Batch Import** - Upload CSV of agents to find
5. **Saved Searches** - Notify when new agents match criteria
6. **AI Enrichment** - Use AI to fill missing info

---

## Summary

✅ **Floating chat widget** on agent pages
✅ **Multi-source search** (DB → Google → Realtor.ca)
✅ **Auto-save** new agents with quick links
✅ **Skills panel** showing capabilities
✅ **Smart chat** with suggestions
✅ **96K+ database** integration

**URL Access**: Appears on `/exp-agent-recruiter`, `/commercial-agent-recruiter`, `/brokerages`
