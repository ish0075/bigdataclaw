# Metrocity Character Pack Integration Guide

## Asset Pack Info
- **Source**: https://jik-a-4.itch.io/metrocity-free-topdown-character-pack
- **Type**: Free top-down character sprites
- **Style**: Pixel art, multiple directions

## Expected File Structure

Metrocity packs typically include:

```
metrocity-characters/
├── character_01/
│   ├── down_idle.png
│   ├── down_walk_01.png
│   ├── down_walk_02.png
│   ├── left_idle.png
│   ├── left_walk_01.png
│   ├── left_walk_02.png
│   ├── right_idle.png
│   ├── right_walk_01.png
│   ├── right_walk_02.png
│   ├── up_idle.png
│   ├── up_walk_01.png
│   └── up_walk_02.png
├── character_02/
│   └── ...
└── ...
```

## Integration Steps

### 1. Download the Asset Pack

1. Visit https://jik-a-4.itch.io/metrocity-free-topdown-character-pack
2. Click "Download Now"
3. Extract the ZIP file

### 2. Organize Assets for BigDataClaw

Create the asset directory structure:

```bash
mkdir -p nerve/public/assets/metrocity
```

Copy the character sprites:

```bash
cp -r metrocity-download/character_* nerve/public/assets/metrocity/
```

### 3. Rename Files (if needed)

The BigDataClaw pixel office expects this naming convention:

```
{character_name}_{direction}_{animation}.png

Examples:
- scout_down_idle.png
- scout_down_walk.png
- scout_left_idle.png
- hotmoney_down_idle.png
- etc.
```

Create symlinks or copies:

```bash
cd nerve/public/assets/metrocity

# Map Metrocity characters to BigDataClaw agents
ln -s character_01/scout_down_idle.png scout_down_idle.png
ln -s character_01/scout_down_walk.png scout_down_walk.png
# ... etc for all 10 agents
```

### 4. Update the Code

In `pixel-office-external-assets.html`, update the `loadExternalAssets` function:

```javascript
async loadExternalAssets() {
    const characters = [
        'scout', 'hotmoney', 'portfolio', 
        'loopnet', 'submit', 'buyerdb',
        'obsidian', 'builders', 'collab', 'boss'
    ];
    
    for (const char of characters) {
        try {
            await assetLoader.loadMetrocityCharacter(char, './assets/metrocity');
        } catch (e) {
            console.warn(`Could not load ${char}, using fallback`);
        }
    }
}
```

### 5. Sprite Size Configuration

Metrocity sprites may be different sizes. Adjust in code:

```javascript
// If Metrocity uses 32x32 sprites instead of 16x16:
const SPRITE_SIZE = 32; // Change from 16

// Update drawing code:
ctx.drawImage(sprite, this.x - SPRITE_SIZE/2, this.y - SPRITE_SIZE/2);
```

### 6. Animation Frame Mapping

Metrocity typically has:
- 2-3 walk frames
- 1 idle frame
- Possibly run/sprint frames

Map to BigDataClaw system:

| Metrocity | BigDataClaw |
|-----------|-------------|
| idle | idle (frame 0) |
| walk_01 | walk (frame 0) |
| walk_02 | walk (frame 1) |
| walk_03 | walk (frame 2, if exists) |

### 7. Test Integration

Open: `http://localhost:8083/pixel-office-external-assets.html`

Check console for:
- Successfully loaded assets
- Failed loads (will use fallback)

### 8. Fallback Behavior

If external assets fail to load:
- System automatically uses generated sprites
- Office remains functional
- No broken images

## Alternative: Using Other Asset Packs

### Office Interior Tileset (Pablo's recommendation)
- **Source**: https://donarg.itch.io/officetileset
- **Style**: 16x16 office furniture
- **Perfect for**: Desks, chairs, plants, decor

### Modern Interiors
- **Source**: Various itch.io packs
- **Style**: RPG Maker style
- **Good for**: Furniture, walls, floors

### Custom Pixel Art
- Create your own 16x16 sprites
- Match the BigDataClaw color palette
- Follow the manifest format

## Asset Manifest Format

Create `manifest.json` for each asset:

```json
{
  "id": "METROCITY_SCOUT",
  "name": "Scout Agent",
  "source": "Metrocity Free Pack",
  "animations": {
    "idle": {
      "down": "scout_down_idle.png",
      "left": "scout_left_idle.png",
      "right": "scout_right_idle.png",
      "up": "scout_up_idle.png"
    },
    "walk": {
      "down": ["scout_down_walk_01.png", "scout_down_walk_02.png"],
      "left": ["scout_left_walk_01.png", "scout_left_walk_02.png"],
      "right": ["scout_right_walk_01.png", "scout_right_walk_02.png"],
      "up": ["scout_up_walk_01.png", "scout_up_walk_02.png"]
    }
  },
  "frameWidth": 32,
  "frameHeight": 32,
  "fps": 8
}
```

## Troubleshooting

### CORS Errors
If loading from file://, use a local server:
```bash
cd nerve/public
python3 -m http.server 8083
```

### Wrong Sprite Size
Adjust `frameWidth` and `frameHeight` in code to match your assets.

### Missing Animations
Create placeholder frames or duplicate existing ones.

### Color Mismatch
The BigDataClaw UI uses specific colors (#00d4ff, #ff4444, etc.)
You may want to tint the sprites or match the UI to your assets.

## Performance Tips

1. **Preload Assets**: Load all sprites before starting
2. **Sprite Atlases**: Combine multiple sprites into one PNG
3. **Lazy Loading**: Only load visible characters
4. **Cache**: Store loaded images to avoid reloading

## Legal Notes

- Check the license of any asset pack you use
- Metrocity is typically free for commercial use with attribution
- Always credit the artist:
  ```
  Characters by Jik-a-4 (Metrocity)
  https://jik-a-4.itch.io/
  ```

## Next Steps

1. Download Metrocity pack
2. Extract and organize assets
3. Update file paths in code
4. Test with `pixel-office-external-assets.html`
5. Fine-tune sprite sizes and animations
6. Add attribution to your project

## Files

- `pixel-office-external-assets.html` - External asset loader
- `METROCITY_INTEGRATION_GUIDE.md` - This guide

Open `http://localhost:8083/pixel-office-external-assets.html` to test!
