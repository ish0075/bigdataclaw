# Sovereign AI Corridor - Master Build Reference

**Last Updated:** March 29, 2025  
**Live Site:** https://sovereignaicorridor.ca / https://www.sovereignaicorridor.ca  
**Vercel Project:** ish0075s-projects/sovereignaicorridor

---

## Source Code Location (CORRECT)

```
/home/jamie/Desktop/Jamies VAULTS/Kimi_Agent_Niagara AI Power Belt/app/
```

**Key Files:**
- `src/App.tsx` (2,199 lines - main React component)
- `src/App.css` (custom styles)
- `public/` (static assets - images, audio, slides)
- `dist/` (production build output)

**IMPORTANT:** This is the ONLY correct source. The `/Desktop/sovereign-ai-corridor-dev/` folder is outdated - do not use.

---

## Build Process

```bash
cd "/home/jamie/Desktop/Jamies VAULTS/Kimi_Agent_Niagara AI Power Belt/app"
npm run build
```

Build outputs to:
- `dist/index.html`
- `dist/assets/index-[hash].js`
- `dist/assets/index-[hash].css`

---

## Deployment

### Production Folder
```
/home/jamie/Desktop/sovereignaicorridor-site/sovereignaicorridor.ca/
```

### Sync Command
```bash
rsync -av --delete "/home/jamie/Desktop/Jamies VAULTS/Kimi_Agent_Niagara AI Power Belt/app/dist/" "/home/jamie/Desktop/sovereignaicorridor-site/sovereignaicorridor.ca/"
```

Both www and non-www domains serve from this same folder.

---

## Tech Stack

- React + TypeScript
- Vite (build tool)
- Tailwind CSS
- GSAP + ScrollTrigger (animations)
- Lucide React (icons)

---

## Page Sections

1. **HeroSection** - Video background, "Already Built" badge, headline
2. **CorridorSection** - "The Corridor Already Exists", map, node cards
3. **WhyNiagaraSection** - Hyperscale spec features
4. **SlideCarousel** - 8-slide presentation deck
5. **InfographicSection** - Stats (545+ acres, 2+ GW, etc.)
6. **AllanburgSection** - Node 1 details (230 kV, 308.279 ac)
7. **NanticokeSection** - Node 2 details (500 kV, 237.208 ac)
8. **MandateSection** - Policy, ISED alignment
9. **ContactSection** - Contact form
10. **Footer**

---

## Key Content

### Hero
- Badge: "Already Built · Already Mapped · Already in Motion"
- Title: "CANADA'S SOVEREIGN AI CORRIDOR"
- Subtitle: "The first sovereign‑AI hyperscale corridor in Canada"

### Corridor Section
- "The Corridor Already Exists" heading
- 500 kV on both sides, 230 kV energised today
- OPG SMR development mention
- 2 Node cards: Allanburg (Node 1), Nanticoke (Node 2)

### Stats
- 545+ Total Acres
- 2+ GW Scalable Capacity
- 230 kV + 500 kV Grid Adjacency
- Day-1 Development Ready

---

## Quick Edit Workflow

1. **Edit source:**
   ```
   /home/jamie/Desktop/Jamies VAULTS/Kimi_Agent_Niagara AI Power Belt/app/src/App.tsx
   ```

2. **Build:**
   ```bash
   cd "/home/jamie/Desktop/Jamies VAULTS/Kimi_Agent_Niagara AI Power Belt/app"
   npm run build
   ```

3. **Deploy:**
   ```bash
   rsync -av --delete "/home/jamie/Desktop/Jamies VAULTS/Kimi_Agent_Niagara AI Power Belt/app/dist/" "/home/jamie/Desktop/sovereignaicorridor-site/sovereignaicorridor.ca/"
   ```

4. **Verify:**
   - https://sovereignaicorridor.ca
   - https://www.sovereignaicorridor.ca

---

## Important Notes

1. **Source Location:** Always use the Jamies VAULTS folder. The Desktop/sovereign-ai-corridor-dev folder is outdated.

2. **Git:** The repo has no remote origin. Deployment is manual via rsync.

3. **Vercel Project ID:** prj_urktR9xNbY4QyHjYa63ifK1N2A6T

4. **Asset Hashing:** Build creates hashed assets. Old assets are cleaned up on rsync.

5. **Static Files:** Site includes slide deck (8 slides), audio briefing, PDF download.

---

## ContextKeep Entry

Search for: `sovereign-ai-corridor-master-reference`
