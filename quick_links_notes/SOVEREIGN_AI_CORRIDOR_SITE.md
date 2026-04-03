# Sovereign AI Corridor Site - FINAL WORKING CONFIG

**Last Updated:** March 29, 2025  
**Status:** ✅ Both domains LIVE with identical content

---

## Live Sites

| Domain | URL | Status |
|--------|-----|--------|
| Non-www | https://sovereignaicorridor.ca/ | ✅ Live |
| www | https://www.sovereignaicorridor.ca/ | ✅ Live |

---

## Source Code Location

```
/home/jamie/Desktop/sovereign-ai-corridor-site/
```

**Key Files:**
- `src/App.tsx` (2,199 lines - main React component)
- `src/App.css` (custom styles)
- `public/` (static assets - images, audio, slides)
- `dist/` (production build output)
- `vercel.json` (deployment config)

---

## Vercel Projects

Two projects serve the same content:

| Project | Domain | Project Name |
|---------|--------|--------------|
| 1 | sovereignaicorridor.ca | `sovereignaicorridor` |
| 2 | www.sovereignaicorridor.ca | `sovereign-ai-corridor` |

---

## Current Content (Latest Deployment)

### "The Corridor Already Exists" Section
> *500 kV runs on both sides. 230 kV is already energised today. The parcels sit directly on Crown‑owned, sovereign‑controlled land, formally classified for industrial‑scale energy and infrastructure use. This is not a what‑if. This is built.*

> *Ontario Power Generation's (OPG) proposed SMR development at Nanticoke would also enable Sovereign AI Corridor Inc. to grow alongside new nuclear, zero‑emissions baseload power.*

### Node 2 Card (Nanticoke)
> *Provincial Crown land. Direct 500kV access. Adjacent to OPG Nanticoke Generating Station. OPG's proposed SMR development would also enable our expansion alongside new nuclear, zero-emissions baseload power.*

---

## How to Make Future Updates

### Step 1: Edit Source
```bash
/home/jamie/Desktop/sovereign-ai-corridor-site/src/App.tsx
```

### Step 2: Commit to GitHub
```bash
cd "/home/jamie/Desktop/sovereign-ai-corridor-site"
git add -A
git commit -m "Your changes"
git push
```

### Step 3: Deploy to Non-www Project
```bash
cd "/home/jamie/Desktop/sovereign-ai-corridor-site"
npx vercel link --yes --project sovereignaicorridor
npx vercel --prod --yes
```

### Step 4: Deploy to WWW Project
```bash
cd "/home/jamie/Desktop/sovereign-ai-corridor-site"
npx vercel link --yes --project sovereign-ai-corridor
npx vercel --prod --yes
```

### Step 5: Link Back to Main Project
```bash
npx vercel link --yes --project sovereignaicorridor
```

---

## Quick Deploy Script

```bash
cd "/home/jamie/Desktop/sovereign-ai-corridor-site"

# Build locally
npm run build

# Deploy to non-www
npx vercel --prod --yes --name sovereignaicorridor

# Deploy to www
npx vercel --prod --yes --name sovereign-ai-corridor
```

---

## Tech Stack

- React + TypeScript
- Vite (build tool)
- Tailwind CSS
- GSAP + ScrollTrigger (animations)
- Lucide React (icons)

---

## Page Sections

1. **HeroSection** - Video background, "Already Built" badge
2. **CorridorSection** - "The Corridor Already Exists", node cards
3. **WhyNiagaraSection** - Hyperscale spec features
4. **SlideCarousel** - 8-slide presentation deck
5. **InfographicSection** - Stats (545+ acres, 2+ GW)
6. **AllanburgSection** - Node 1 (230 kV, 308.279 ac)
7. **NanticokeSection** - Node 2 (500 kV, 237.208 ac)
8. **MandateSection** - Policy, ISED alignment
9. **ContactSection** - Contact form
10. **Footer**

---

## GitHub Repository

https://github.com/ish0075/sovereign-ai-corridor

---

## ContextKeep

Search: `sovereign-ai-corridor-final` or `sovereign-ai-corridor-site`

---

## Troubleshooting

**If www and non-www show different content:**
1. Check deployment timestamps: `npx vercel list [project-name]`
2. Redeploy to both projects using steps above
3. Hard refresh browser (Ctrl+Shift+R)
4. Clear browser cache

**Domains not updating:**
- Vercel projects: `sovereignaicorridor` and `sovereign-ai-corridor`
- Both must be deployed separately
- Check GitHub repo is connected to both projects
