# Icon Centering Guide - How to Create Perfect Icons

## 🎯 The Problem

Icons can appear off-center in skill tree nodes when:
- The PNG file has uneven padding/margins
- Icon artwork is not centered in the canvas
- Different icons have different internal alignment

## ✅ Solution: Create Properly Centered Icons

### 📐 Icon Creation Checklist

Use this checklist for **every icon** you create:

- [ ] **Canvas is square**: 512×512 or 256×256 pixels
- [ ] **Artwork is centered**: Horizontally and vertically aligned to center
- [ ] **Equal padding**: Same transparent space on all 4 sides
- [ ] **Content in safe area**: Keep main icon within 80% of canvas (leave 10% margin on each side)
- [ ] **Transparent background**: No white or colored backgrounds
- [ ] **Export as PNG**: With transparency enabled

---

## 🛠️ Tool-Specific Guides

### Photoshop

```
1. Create New: 512×512 pixels, Transparent background
2. Add your icon artwork
3. Select artwork layer
4. Layer → Align → Horizontal Center
5. Layer → Align → Vertical Center
6. Add guides: View → New Guide → 50% vertical and horizontal
7. Verify icon is centered on guides
8. File → Export → Export As → PNG (Transparency: ON)
9. Save as "{Skill Name}.png"
```

### GIMP (Free)

```
1. File → New: 512×512 pixels, Fill: Transparency
2. Create/paste your icon
3. Image → Guides → New Guide by Percent → 50% vertical
4. Image → Guides → New Guide by Percent → 50% horizontal
5. Layer → Align Visible Layers → Center on image
6. Verify icon centered on guides
7. File → Export As → PNG
8. Save as "{Skill Name}.png"
```

### Figma (Free)

```
1. Create Frame: 512×512 pixels
2. Create/import your icon
3. Select icon element
4. In properties panel:
   - Set X: 256 - (width/2)
   - Set Y: 256 - (height/2)
5. Or use Auto Layout with centering
6. Export → PNG → 2x scale
7. Save as "{Skill Name}.png"
```

### Inkscape (Free, Vector)

```
1. File → Document Properties → 512×512 pixels
2. Import/create your icon
3. Object → Align and Distribute
4. Select: "Relative to page"
5. Click: "Center on vertical axis"
6. Click: "Center on horizontal axis"
7. File → Export PNG → Export
8. Save as "{Skill Name}.png"
```

---

## 📏 Visual Centering Guide

### Perfect Icon Layout

```
┌─────────────────────────────────────┐
│ 512×512 Canvas                      │
│                                     │
│     ┌───────────────────┐          │
│     │   Safe Area       │          │  ← 10% margin
│     │   (80% of canvas) │          │
│     │                   │          │
│     │    ╔═══════╗     │          │
│     │    ║       ║     │          │  ← Icon artwork
│     │    ║ ICON  ║     │          │     centered here
│     │    ║       ║     │          │
│     │    ╚═══════╝     │          │
│     │                   │          │
│     │                   │          │
│     └───────────────────┘          │
│            ↑                        │
│      Center point (256, 256)       │
└─────────────────────────────────────┘

✅ GOOD: Equal spacing on all sides
```

### Off-Center Icon (AVOID)

```
┌─────────────────────────────────────┐
│ 512×512 Canvas                      │
│                                     │
│  ╔═══════╗                         │  ← Too far left/top
│  ║       ║                         │
│  ║ ICON  ║                         │
│  ║       ║                         │
│  ╚═══════╝                         │
│                                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘

❌ BAD: Will appear off-center in game
```

---

## 🎨 Template Method (Recommended!)

### Create a Template Once

1. **Create Base Template** (512×512, transparent)
2. **Add Center Guides** (vertical + horizontal at 256px)
3. **Add Safe Area Rectangle** (410×410, centered, as guide only)
4. **Save as Template**: "Icon_Template.psd" or similar

### Use Template for Every Icon

1. Open template
2. Add your icon artwork
3. Align to center guides
4. Keep within safe area
5. Export PNG
6. Delete artwork layer for next icon

**Benefits**: 
- Consistent sizing across all icons
- Faster workflow
- Perfect centering every time

---

## 🔍 Testing Your Icon

### Before Adding to Game

1. **Visual Check**: Open PNG in viewer
   - Icon should be centered in thumbnail
   - Equal white space on all sides

2. **Grid Check**: Open in editor with grid
   - Turn on center guides
   - Icon should align with guides

3. **Validator Check**: Use icon-validator.html
   - Preview in circular node
   - Compare with other icons

### In-Game Test

1. Add PNG to `assets/Icons/`
2. Refresh game (Ctrl+F5)
3. Navigate to skill tree
4. Check if icon is centered in circular node
5. Compare with other icons (like Core Reactor)

---

## 🛡️ Code Protection (Already Implemented!)

The code now includes **automatic centering** features:

```typescript
// Circular clipping ensures icon fits perfectly
ctx.beginPath();
ctx.arc(skill.x, skill.y, currentRadius * 0.7, 0, Math.PI * 2);
ctx.clip();

// Icon is drawn centered and clipped to circle
ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
```

**What this does**:
- Clips icon to circular boundary
- Prevents overflow outside node
- Helps mask minor centering issues
- Ensures consistent appearance

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This

1. **Irregular canvas sizes** (e.g., 512×480)
   - Always use square canvas!

2. **Content touching edges**
   - Leave at least 10% margin

3. **Different icon sizes**
   - Keep icons similar visual weight

4. **Opaque backgrounds**
   - Always use transparency

5. **No guides/alignment tools**
   - Always use center guides!

### ✅ Do This Instead

1. **Square canvas**: 512×512 or 256×256
2. **10% margin**: Safe area for artwork
3. **Consistent sizing**: Similar visual weight
4. **Transparent**: PNG with alpha channel
5. **Use guides**: Center lines visible

---

## 📊 Quick Reference: Icon Specs

| Property | Value |
|----------|-------|
| **Canvas Size** | 512×512 or 256×256 px (square!) |
| **Format** | PNG with transparency |
| **Artwork Area** | 80% of canvas (centered) |
| **Margin** | 10% on all sides |
| **Center Point** | Exact middle of canvas |
| **Background** | Transparent (alpha channel) |
| **Color Mode** | RGB + Alpha |
| **Bit Depth** | 8-bit or 16-bit |

---

## 🎯 Fixing Existing Off-Center Icons

### Method 1: Re-center in Editor

1. Open the off-center PNG
2. Image → Canvas Size → ensure 512×512
3. Layer → Align → Center Horizontal
4. Layer → Align → Center Vertical
5. Export → Save

### Method 2: Recreate from Scratch

1. Open icon template
2. Import off-center icon as layer
3. Resize and center properly
4. Export new PNG
5. Replace old file

### Method 3: Auto-fix Script (Advanced)

Use ImageMagick command line:
```bash
magick "Resource Path.png" -gravity center -background transparent -extent 512x512 "Resource Path.png"
```

---

## 📝 Icon Creation Workflow

### Step-by-Step Process

```
1. Design Phase
   ├─ Sketch icon concept
   ├─ Choose colors (blues, cyans, gold)
   └─ Determine complexity level

2. Creation Phase
   ├─ Open icon template (512×512)
   ├─ Add artwork
   ├─ Align to center guides
   ├─ Keep within safe area
   └─ Verify centering

3. Export Phase
   ├─ File → Export as PNG
   ├─ Enable transparency
   ├─ Name: "{Skill Name}.png"
   └─ Save to: assets/Icons/

4. Testing Phase
   ├─ Visual check in file browser
   ├─ Open icon-validator.html
   ├─ Preview in circular node
   └─ Compare with other icons

5. Integration Phase
   ├─ Refresh game (Ctrl+F5)
   ├─ Navigate to skill tree
   ├─ Verify centering in actual node
   └─ Check across different node states
```

---

## 💡 Pro Tips

### For Consistent Quality

1. **Create all icons in one session** - Keeps style consistent
2. **Use same template** - Ensures same dimensions
3. **Save working files** - Keep PSD/XCF for future edits
4. **Version control** - Save iterations if making changes
5. **Test frequently** - Check in validator after each icon

### For Best Visual Results

1. **High contrast** - Icons should be visible at small size
2. **Simple shapes** - Avoid excessive detail
3. **Consistent line weight** - Similar stroke widths
4. **Color harmony** - Blues, cyans, gold palette
5. **Visual weight** - Similar perceived size

### For Workflow Efficiency

1. **Batch create** - Make multiple icons at once
2. **Keyboard shortcuts** - Learn alignment hotkeys
3. **Smart objects** - Use in Photoshop for easy edits
4. **Layers organized** - Name and group properly
5. **Export presets** - Save PNG export settings

---

## ✅ Centering Checklist (Print This!)

Before exporting any icon:

- [ ] Canvas is 512×512 pixels (or 256×256)
- [ ] Background is transparent
- [ ] Center guides are visible
- [ ] Icon artwork is aligned to guides
- [ ] Equal space on left/right sides
- [ ] Equal space on top/bottom sides
- [ ] Artwork fits in 80% safe area
- [ ] No content touching edges
- [ ] Saved as PNG with transparency
- [ ] Filename matches skill name exactly
- [ ] Tested in icon-validator.html

---

## 🎬 Summary

### The Golden Rules

1. **Always use square canvas** (512×512)
2. **Always center your artwork** (use guides!)
3. **Always leave equal padding** (10% margin)
4. **Always test before finalizing**

### Quick Fix for Resource Path

Your current "Resource Path.png" issue:
1. Open in editor
2. Add center guides
3. Align icon to guides
4. Re-export
5. Replace file
6. Refresh game ✨

The code now includes circular clipping, so minor centering issues are masked, but **properly centered source icons** will always look best!

---

**Remember**: Spend 2 minutes centering properly now, save hours of frustration later! 🎯
