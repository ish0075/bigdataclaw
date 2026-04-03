# BigDataClaw Pixel Office - Asset System Guide

## Overview

This guide documents how the BigDataClaw Pixel Office v4 implements a Pablo De Lucca-style asset system for pixel art characters and furniture.

## Pablo's Asset System (from pixel-agents repo)

### Character Sprites
- **Format**: Sprite sheets (PNG)
- **Size**: 112x96px (4 rows x 6+ columns of 16x16px frames)
- **Layout**:
  - Row 0: Facing Down
  - Row 1: Facing Left  
  - Row 2: Facing Right
  - Row 3: Facing Up
- **Frames per direction**: 
  - Frame 0: Idle
  - Frame 1-2: Walking
  - Frame 3-4: Typing
  - Frame 5: Special

### Furniture Assets
- **Format**: Individual PNG files per orientation
- **Size**: 16x16px (standard), up to 32x32px for large items
- **Structure**:
  ```
  furniture/
    ITEM_NAME/
      manifest.json
      ITEM_NAME_FRONT.png
      ITEM_NAME_SIDE.png
      ITEM_NAME_BACK.png
  ```

### Manifest Format
```json
{
  "id": "ITEM_ID",
  "name": "Display Name",
  "category": "desks|chairs|decor|storage",
  "type": "group",
  "groupType": "rotation",
  "rotationScheme": "3-way-mirror",
  "members": [
    {
      "orientation": "front",
      "file": "ITEM_FRONT.png",
      "width": 16,
      "height": 16,
      "footprintW": 1,
      "footprintH": 1
    }
  ]
}
```

## BigDataClaw Implementation

### Character Sprite Sheets

Our system generates sprite sheets programmatically:

```javascript
const spriteSheet = {
  sheet: Canvas,       // The full sprite sheet
  frameW: 16,          // Width of each frame
  frameH: 16,          // Height of each frame
  framesPerRow: 6,     // Animation frames per direction
  directions: {        // Row mapping
    down: 0,
    left: 1,
    right: 2,
    up: 3
  }
};
```

**Frame Layout**:
| Frame | Animation |
|-------|-----------|
| 0 | Idle |
| 1 | Walk 1 |
| 2 | Walk 2 |
| 3 | Type 1 |
| 4 | Type 2 |
| 5 | Special |

### Furniture Generators

Instead of PNG files, we use canvas generators:

```javascript
const FURNITURE_GENERATORS = {
  MODERN_DESK: () => {
    // Returns a canvas with the desk sprite
  },
  OFFICE_CHAIR: () => {
    // Returns a canvas with the chair sprite
  },
  PLANT: () => {
    // Returns a canvas with the plant sprite
  }
};
```

### Asset Registry

```javascript
const ASSETS = {
  characters: {
    scout: { /* sprite sheet */ },
    hotmoney: { /* sprite sheet */ },
    // ... 10 agents
  },
  furniture: {
    MODERN_DESK: Canvas,
    OFFICE_CHAIR: Canvas,
    PLANT: Canvas,
    WHITEBOARD: Canvas,
    BOOKSHELF: Canvas,
    WATER_COOLER: Canvas,
    COFFEE_MACHINE: Canvas
  }
};
```

## Categories (matching Pablo's)

| Category | Items |
|----------|-------|
| desks | MODERN_DESK |
| chairs | OFFICE_CHAIR |
| decor | PLANT, WHITEBOARD |
| storage | BOOKSHELF |
| electronics | COFFEE_MACHINE |
| misc | WATER_COOLER |

## Character Palettes

Each agent has a unique color palette:

| Agent | Body | Hair | Shirt |
|-------|------|------|-------|
| Transaction Scout | #00d4ff | #4a3728 | #006688 |
| Hot Money Tracker | #ff4444 | #222222 | #880000 |
| Portfolio Analyzer | #44ff44 | #4a3728 | #006600 |
| LoopNet Intel | #ffaa00 | #4a3728 | #884400 |
| Property Submit | #ff66cc | #4a3728 | #880066 |
| Buyer Database | #9966ff | #4a3728 | #440088 |
| Obsidian Sync | #66ccff | #e8d4a0 | #004488 |
| Builders Agent | #ffcc00 | #4a3728 | #886600 |
| Collab Agent | #66ff66 | #4a3728 | #008800 |
| Orchestrator (Boss) | #ffd700 | #e8d4a0 | #886600 |

## Animation System

### Frame Timing
- **Walk cycle**: 150ms per frame
- **Typing**: 100ms per frame (alternating frames 3-4)

### Direction Handling
```javascript
const dirRow = spriteSheet.directions[this.direction];
const frameX = this.frame * spriteSheet.frameW;
const frameY = dirRow * spriteSheet.frameH;

ctx.drawImage(
  spriteSheet.sheet,
  frameX, frameY, frameW, frameH,
  agent.x - 8, agent.y - 8, frameW, frameH
);
```

## Matrix Spawn Effect

Pablo-style spawn animation with falling digital characters:

```javascript
class MatrixRain {
  constructor(x, y) {
    this.chars = '01アイウエオカキクケコ';
    this.drops = []; // Falling characters
    this.active = true;
  }
  
  draw(ctx) {
    // Render green falling characters
    // Fade out over 1.2 seconds
  }
}
```

## Office Layout

### Tile System
- **Tile size**: 32x32px
- **Office grid**: 32 columns x 22 rows
- **Two zones**:
  - Brown office (cols 1-20): Working area
  - Blue meeting (cols 21-30): Conference area

### Furniture Placement
```javascript
// Each agent gets a desk at their home position
ctx.drawImage(ASSETS.furniture.MODERN_DESK, 
  agent.homeCol * TILE_SIZE - 8, 
  agent.homeRow * TILE_SIZE - 12);

ctx.drawImage(ASSETS.furniture.OFFICE_CHAIR, 
  agent.homeCol * TILE_SIZE + 8, 
  agent.homeRow * TILE_SIZE + 4);
```

## Depth Sorting

Agents are sorted by Y position for proper layering:

```javascript
this.agents.sort((a, b) => a.y - b.y);
this.agents.forEach(agent => agent.draw(ctx));
```

This ensures agents in front render on top of agents behind.

## Future Enhancements

To fully match Pablo's system:

1. **External PNG Assets**: Load actual PNG files instead of generated canvases
2. **Manifest Files**: JSON configuration for each furniture item
3. **Wall Tilesets**: Multiple wall styles with proper corner pieces
4. **Floor Variants**: More floor patterns and colors
5. **Animation States**: Reading, coffee break, talking animations
6. **Sound Effects**: Typing, footsteps, alerts

## Files

- `pixel-office-v4.html` - Main implementation
- `pablo-pixel-agents/` - Reference implementation (cloned from GitHub)

## Reference

- Pablo's docs: `pablo-pixel-agents/docs/external-assets.md`
- Pablo's assets: `pablo-pixel-agents/webview-ui/public/assets/`
- Recommended tileset: [Office Interior Tileset (16x16)](https://donarg.itch.io/officetileset) by Donarg
