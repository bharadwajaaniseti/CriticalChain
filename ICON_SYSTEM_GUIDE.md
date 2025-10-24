# Skill Tree Icon System Guide

## Overview

The skill tree now features a **dynamic icon loading system** that automatically displays custom PNG icons for each skill node. Icons are overlaid on the circular node design (blue circle with yellow/green border depending on state).

## How It Works

### Automatic Icon Loading

1. **Icon Location**: All skill icons must be placed in `E:\Personal\My Sites\CriticalChain\assets\Icons\`
2. **Naming Convention**: Icon filename must **exactly match** the `"name"` field in `skilltree.json`
3. **File Format**: PNG images (recommended size: 128x128 to 512x512 pixels)

### Example

For a skill node in `skilltree.json`:
```json
{
  "neutron_count_1": {
    "id": "neutron_count_1",
    "name": "Extra Neutron I",
    "description": "+1 neutron per click.",
    ...
  }
}
```

The icon file should be named: `Extra Neutron I.png`

## Adding New Icons

### Step 1: Create Your Icon
- Create a PNG image (square format recommended)
- Recommended size: 256x256 or 512x512 pixels
- Use transparent background for best results
- Icon should be centered and fill most of the canvas

### Step 2: Name the File
- Use the **exact** name from the skill's `"name"` field in `skilltree.json`
- Include spaces, capitalization, and Roman numerals exactly as shown
- File extension: `.png`

### Step 3: Place in Icons Folder
- Copy the PNG file to `E:\Personal\My Sites\CriticalChain\assets\Icons\`
- That's it! The system will automatically load it

### Step 4: Test
- Reload the game
- Navigate to the Skill Tree
- The icon should appear centered in the circular node

## Icon Display Behavior

### Node States with Icons

1. **Locked Nodes**: Icon appears grayed out/dimmed
2. **Available Nodes** (Blue circle with yellow border): Icon displays at full brightness
3. **Purchased Nodes** (Cyan/green): Icon displays with slight glow effect
4. **Maxed Nodes** (Green border): Icon displays with green tint

### Fallback System

If no PNG icon is found for a skill:
- System automatically falls back to emoji/text icons defined in code
- No error is shown to the user
- Console logs will show: `"No icon found for: [Skill Name], using fallback"`

## Current Skill Names (Reference)

Here are all the skill names you need to create icons for:

### Core
- `Core Reactor`

### Path Unlocks
- `Neutron Path`
- `Atom Path`
- `Chain Path`
- `Resource Path`
- `Enrichment Path`
- `Fissionables Path`

### Neutron Skills
- `Extra Neutron I`, `Extra Neutron II`, `Extra Neutron III`
- `Neutron Velocity I`, `Neutron Velocity II`
- `Neutron Duration I`, `Neutron Duration II`
- `Neutron Size I`
- `Neutron Pierce`
- `Neutron Homing`
- `Unlock: Critical Neutrons`
- `Critical Chance`
- `Critical Effect`

### Atom Skills
- `Atom Density I`, `Atom Density II`
- `Atom Size I`
- `Atom Duration I`
- `Chain Reaction I`, `Chain Reaction II`, `Chain Reaction III`
- `Unlock: Atom Shockwave`
- `Shockwave Force`

### Chain Skills
- `Chain Bonus I`, `Chain Bonus II`, `Chain Bonus III`
- `Chain Momentum`
- `Wall Bounce`

### Resource Skills
- `Extra Click I`, `Extra Click II`, `Extra Click III`, `Extra Click IV`
- `Extended Time I`, `Extended Time II`, `Extended Time III`, `Extended Time IV`
- `Unlock: Click Shockwave`
- `Click Shockwave Radius`

### Economy Skills
- `Base Coin Value I`, `Base Coin Value II`
- `Efficiency`
- `Seed Funding`

### Special Atom Skills
- `Unlock: Time Atoms`
- `Time Atom Chance`
- `Time Atom Potency`
- `Time Atom Reward`
- `Unlock: Supernova Atoms`
- `Supernova Chance`
- `Supernova Potency`
- `Supernova Reward`
- `Unlock: Black Hole Atoms`
- `Black Hole Chance`
- `Event Horizon`
- `Black Hole Reward`
- `Singularity Burst`

### Ultimate Skills
- `Neutron Mastery`
- `Atom Mastery`
- `Chain Mastery`
- `Resource Mastery`
- `Economy Mastery`
- `Fission Mastery`

## Technical Details

### Implementation

The icon system is implemented in `src/pages/SkillTreePage.ts`:

1. **Icon Cache**: `Map<string, HTMLImageElement>` stores loaded images
2. **Preloading**: All icons are preloaded when skill tree loads
3. **Rendering**: Icons are drawn using `ctx.drawImage()` centered in nodes
4. **Size**: Icons are scaled to 140% of node radius (70% of diameter)

### Performance

- Icons are cached after first load
- No re-fetching on navigation
- Lazy loading with fallback ensures fast rendering
- Only visible nodes are rendered

### Console Logging

The system logs helpful messages:
- `"[SkillTree] Loaded icon for: [Name]"` - Successfully loaded
- `"[SkillTree] No icon found for: [Name], using fallback"` - Missing icon
- `"[SkillTree] Preloaded X skill icons"` - Total icons loaded

## Best Practices

### Icon Design
- Use clear, recognizable symbols
- Avoid too much detail (icons are small on screen)
- Use high contrast colors
- Center your icon in the canvas
- Leave small margin around edges (icons are circular)

### File Organization
- Keep all skill icons in the same folder
- Use consistent naming (match JSON exactly)
- Use descriptive filenames that match the skill purpose

### Future-Proofing
- When adding new skills to `skilltree.json`, create matching icons
- Test both with and without icons to ensure fallbacks work
- Update this guide when adding new skill categories

## Troubleshooting

### Icon Not Showing
1. Check filename matches skill `"name"` field exactly (including spaces, capitals, Roman numerals)
2. Verify file is in `assets/Icons/` folder
3. Ensure file is `.png` format
4. Check browser console for loading errors
5. Try hard refresh (Ctrl+F5)

### Icon Looks Blurry
- Use higher resolution PNG (512x512 recommended)
- Ensure icon has transparent background
- Check that icon isn't being upscaled from small source

### Wrong Icon Appearing
- Verify filename matches skill name exactly
- Check for duplicate files with similar names
- Clear browser cache and reload

## Future Enhancements

Potential improvements to consider:
- Support for animated icons (GIF/sprite sheets)
- Icon variants for different node states
- Icon tooltips showing full-size preview
- Batch icon import/validation tool
- Alternative icon sets/themes

---

**Last Updated**: October 24, 2025  
**System Version**: 1.0  
**Implemented By**: Dynamic Icon Loading System
