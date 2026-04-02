# EXP Agent Recruiter - Enhanced

## Overview
Enhanced agent recruiter page with builder directory-style cards, comprehensive quick links, **voice search**, and **Obsidian Web Clipper integration** for capturing contact info.

## Features

### Card Design (Builder Directory Style)
- **Avatar**: Colored initials badge (consistent color per agent)
- **Header**: Name, brokerage, location, job title
- **Stats Row**: Status, contact count, last contacted date
- **Main Action Buttons** (always visible):
  - Facebook (blue)
  - Realtor.ca (red)
  - Instagram (pink/purple gradient)
  - Phone (green)

### Expanded Quick Links
Click "Quick Links" to expand and show:

#### Social Media Section
- Facebook
- Instagram
- LinkedIn
- Twitter/X
- TikTok
- YouTube

#### Messaging Section
- WhatsApp (if phone available)
- Facebook Messenger
- Email (if available)
- Phone

#### Professional Section
- Realtor.ca
- LOOPNET
- Broker CEO LinkedIn
- Reviews Search

#### Search Section
- Google Search
- Contact Page Search

### EXP Agent Handling
- All EXP Realty agents are automatically sorted to the **end** of the list
- EXP agents show with reduced opacity (60%) and slight grayscale
- EXP badge displayed on their cards
- This makes it easy to focus on recruiting non-EXP agents first

### Obsidian Web Clipper Integration
- Clip phone numbers from Realtor.ca directly to agent cards
- Manual contact addition via "Add Contact" button
- Visual indicator (purple dot) for clipped data
- LocalStorage persistence

## File Structure
```
nerve/src/views/EXAgentRecruiterEnhanced.jsx       - Enhanced component with voice
nerve/src/components/Common/VoiceInput.jsx         - Reusable voice input component
nerve/src/components/Common/ObsidianClipper.jsx    - Obsidian Web Clipper integration
nerve/src/App.jsx                                  - Updated routing
nerve/src/components/Common/Sidebar.jsx            - Updated with badge
```

## Voice Search 🎤

Click the **microphone button** in the search bar to use voice input.

### Voice Commands
Try saying:
- **"Find agents in Toronto"** - Searches for agents
- **"Show Royal LePage"** - Filters by brokerage  
- **"Filter contacted"** - Shows contacted agents
- **"Reset filters"** - Clears all filters

### Voice Input Component
```
nerve/src/components/Common/VoiceInput.jsx
```

**Features:**
- Real-time speech-to-text
- Visual feedback while listening
- Auto-stop on silence
- Error handling for unsupported browsers

## Obsidian Web Clipper Integration 📎

Capture contact info from Realtor.ca and save it directly to agent cards.

### How It Works
1. **Visit Realtor.ca** - Find an agent's profile
2. **Use Obsidian Web Clipper** - Clip the page to your vault
3. **Phone appears on card** - Click to call directly!

### Manual Contact Addition
Click the **"Clip"** or **"Add Contact"** button on any agent card to manually add:
- Phone number
- Website
- Notes

### Visual Indicators
- 🟣 **Purple dot** on Call button = Contact info from Obsidian clip
- **"Clip"** button = No contact info yet (click to add)

### Storage
Contact data is stored in browser localStorage and persists across sessions.

## Usage
Navigate to **Recruitment > EXP Agent Recruiter** in the sidebar.

## Quick Actions
- **Facebook**: Search for agent on Facebook
- **Realtor.ca**: View agent profile on Realtor.ca
- **Instagram**: Search for agent on Instagram
- **Phone**: Direct dial (if phone number available)
- **Quick Links**: Expand to see all available links

## Filtering & Grouping
- Search by name, brokerage, city
- Filter by brokerage, city, status
- Group by: Brokerage, City, or Status
- EXP agents always appear last in results

## Data Source
- Primary: API (`localhost:8000/api/recruiters`)
- Fallback: JSON files (`/data/recruiters_sample.json` or `/data/recruiters_full.json`)

## Styling
- Dark theme matching NERVE design system
- Builder directory card layout
- Color-coded quick link buttons
- Smooth animations and transitions
