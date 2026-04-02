# AI Builder - VS Code Style AI Assistant

## Overview
A fully integrated VS Code-style AI Builder directly in the NERVE platform. Write, edit, and build code with AI assistance - like having GitHub Copilot or Cursor built into your application.

---

## ✨ Features

### 🎨 VS Code-Style Interface
- **File Explorer** - Browse project files and directories
- **Code Editor** - Monaco Editor with syntax highlighting
- **Tab System** - Open multiple files in tabs
- **Terminal** - Execute commands directly
- **Search** - Find content across all files

### 🤖 AI Chat Assistant
- **Natural Language** - Ask AI to create, edit, or explain code
- **Context Aware** - AI knows the current file you're editing
- **Code Blocks** - AI returns formatted code with syntax highlighting
- **One-Click Apply** - Apply AI suggestions instantly
- **Conversation History** - Maintains context across messages

### 🛠️ What AI Can Do
| Capability | Description |
|------------|-------------|
| **Create Components** | Generate new React components |
| **Fix Errors** | Debug and fix code issues |
| **Add Styling** | Write Tailwind CSS classes |
| **Explain Code** | Understand how code works |
| **Refactor** | Improve and optimize code |
| **Auto-Save** | Apply changes to files automatically |

---

## 🖥️ Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│  AI Builder                                    [Save] [Run] │
├──────────┬──────────────────────────┬───────────────────────┤
│          │                          │  🤖 AI Assistant      │
│  📁      │                          │  ─────────────────    │
│  Files   │    Code Editor           │  AI: How can I help?  │
│          │                          │                       │
│  nerve/  │    (Monaco Editor)       │  User: Create a new   │
│  ├ src/  │                          │        component      │
│  ├ api/  │                          │  AI: Here's the code: │
│  └ ...   │                          │  ```jsx               │
│          │                          │  const NewComponent.. │
│          │                          │  ```                  │
│          │                          │  [Apply] [Copy]       │
│          │                          │                       │
│          │                          │  [Ask AI...] [Send]   │
├──────────┴──────────────────────────┴───────────────────────┤
│  Terminal                                                   │
│  $ npm run dev                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📸 Screenshots

### Main Interface
`ai-builder-interface.png`
- File explorer showing project structure
- Empty editor ready for files
- AI chat panel on the right
- Input field for asking AI

---

## 🚀 How to Use

### 1. Open AI Builder
Navigate to: `http://localhost:5173/ai-builder`

Or click **"AI Builder"** in the sidebar (under TOOLS section)

### 2. Browse Files
- Click folders to expand/collapse
- Click files to open in editor
- Multiple files open in tabs

### 3. Ask AI to Build
Type in the chat panel:
```
"Create a new component for displaying property cards"
"Fix the error in this file"
"Add Tailwind styling to make this look modern"
"Explain how this code works"
```

### 4. Apply Changes
- AI suggests code with [Apply] button
- Click to auto-save to file
- Or copy and paste manually

### 5. Save & Test
- [Save] button saves current file
- [Run] executes commands in terminal
- Changes reflect immediately in the app

---

## 💬 Example Conversations

### Creating a Component
```
User: Create a PropertyCard component
AI: I'll create a PropertyCard component with Tailwind styling:

[Code Block: PropertyCard.jsx]

[Apply Button]
```

### Fixing Errors
```
User: Fix the error in the API call
AI: The issue is with the fetch URL. Here's the fix:

[Code Block with fix highlighted]

[Apply Fix Button]
```

### Adding Styles
```
User: Make this look more modern
AI: I'll add Tailwind classes for a modern card design:

[Code Block with styling]
```

---

## 🛠️ Technical Stack

### Frontend
- **Monaco Editor** - VS Code's editor component
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library

### Backend
- **FastAPI** - API server
- **File Operations** - Read/write project files
- **Search** - Content search across files
- **Terminal** - Command execution (restricted)

### AI Integration (Ready for)
- **OpenAI GPT-4** - Code generation
- **Claude** - Alternative AI provider
- **Local LLMs** - Ollama/LM Studio support

---

## 📡 API Endpoints

### File Operations
```
GET  /api/ai-builder/files?path=    - List files
GET  /api/ai-builder/file?path=     - Read file
POST /api/ai-builder/file           - Write file
DELETE /api/ai-builder/file?path=   - Delete file
```

### AI Chat
```
POST /api/ai-builder/chat           - Chat with AI
Body: { message, context, file_path }
```

### Search & Execute
```
GET  /api/ai-builder/search?q=      - Search files
POST /api/ai-builder/execute        - Run commands
```

---

## 🔐 Security

- **Sandboxed** - Can only access project files
- **No System Access** - Cannot access files outside project
- **Restricted Commands** - Only whitelisted shell commands
- **Safe Operations** - All file changes are logged

---

## 🎯 Use Cases

### 1. Rapid Prototyping
- Describe a feature, AI builds it
- Instant code generation
- Immediate testing

### 2. Bug Fixing
- Paste error message
- AI analyzes and suggests fix
- Apply with one click

### 3. Learning & Exploration
- Ask AI to explain code
- Understand how features work
- Learn best practices

### 4. Refactoring
- Modernize old code
- Optimize performance
- Improve readability

### 5. Team Collaboration
- AI suggests improvements
- Review AI-generated code
- Maintain consistency

---

## 🚀 Future Enhancements

### Phase 2
- [ ] **Live Preview** - See changes in real-time
- [ ] **Git Integration** - Commit from the editor
- [ ] **Version History** - Undo/redo file changes
- [ ] **Multi-file Edits** - AI edits multiple files
- [ ] **Code Review** - AI reviews code for issues

### Phase 3
- [ ] **Voice Commands** - Talk to the AI
- [ ] **Visual Editor** - Drag-and-drop UI builder
- [ ] **Component Library** - Insert pre-built components
- [ ] **Test Generation** - Auto-generate unit tests
- [ ] **Documentation** - Auto-generate docs

---

## 📁 Files Created

```
bigdataclaw/
├── ai_builder_api.py                  # Backend API
└── nerve/src/
    ├── views/
    │   └── AIBuilder.jsx              # Main interface
    └── components/AIBuilder/
        └── (future components)
```

---

## 🔌 Integration Points

### With Existing System
- ✅ Reads/writes project files directly
- ✅ Uses same styling system (Tailwind)
- ✅ Same component library access
- ✅ API endpoints integrated with FastAPI

### Can Build
- New React components
- API endpoints
- Database migrations
- Styling and themes
- Documentation

---

## 🎓 Tips for Best Results

1. **Be Specific** - "Create a blue button" vs "Create a button"
2. **Provide Context** - Open the file you want to edit
3. **Iterate** - Ask AI to refine its suggestions
4. **Review** - Always review AI-generated code
5. **Test** - Run and test changes immediately

---

## Summary

✅ **VS Code-style interface** with file explorer, editor, and AI chat
✅ **Monaco Editor** for professional code editing
✅ **AI Chat Assistant** for code generation and help
✅ **File Operations** - Read, write, create, delete files
✅ **Search** - Find content across the project
✅ **Terminal** - Execute commands
✅ **Security** - Sandboxed, safe operations only

**URL**: `http://localhost:5173/ai-builder`

You now have a complete AI-powered code editor built into your platform! 🚀
