# 🔊 Audio Setup & Troubleshooting

## Audio Files Configuration

### File Structure
All audio files are located in:
- **Source**: `assets/audio/`
- **Public**: `public/assets/audio/` (copied for build)
- **Build**: `dist/assets/audio/` (after build)

### Audio Files Included
- `ui_click.mp3` - UI interaction sounds
- `reaction_trigger.mp3` - Reaction trigger effects
- `upgrade_unlock.mp3` - Upgrade purchase sounds
- `atom_break.mp3` - Atom breaking effects
- `ambient.mp3` - Background ambient music
- `reaction_build.mp3` - Active reaction music
- `home_background_music.mp3` - Home page background music
- `home_ui_select.mp3` - Home page UI selection
- `skilltree_purchase.mp3` - Skill tree purchase sound
- `skilltree_hover.mp3` - Skill tree hover sound

## Important Notes

### File Names
⚠️ **No spaces in filenames!** 
- Audio files with spaces in names will fail to load in web browsers
- All files have been renamed to use underscores instead of spaces
- Example: `Home Background Music.mp3` → `home_background_music.mp3`

### Browser Requirements
- Modern browsers require user interaction before playing audio
- Audio context will be suspended until first click/keypress
- This is a browser security feature, not a bug

### File Format
- Format: MP3
- All files should be valid MP3 format
- Corrupted or misnamed files will fail to decode

## Common Issues & Solutions

### Issue 1: Audio Not Loading
**Symptoms:**
```
[AUDIO] Failed to preload sfx_atom_break: EncodingError: Unable to decode audio data
```

**Solutions:**
1. Check file exists: `dist/assets/audio/atom_break.mp3`
2. Verify file is valid MP3 (not WAV or other format)
3. Re-encode file if corrupted
4. Clear browser cache and rebuild

### Issue 2: Audio Context Suspended
**Symptoms:**
```
[AUDIO] Context initialized, state: suspended
```

**Solution:**
- This is normal! Click anywhere on the page
- Audio will resume after user interaction
- Look for: `[AUDIO] Context resumed after user interaction`

### Issue 3: Music Not Loaded
**Symptoms:**
```
[AUDIO] Music not loaded: home_music_bg
```

**Solutions:**
1. Ensure audio file exists in `public/assets/audio/`
2. Check file name matches exactly (case-sensitive)
3. Rebuild project: `npm run build`
4. Verify file copied to `dist/assets/audio/`

### Issue 4: Favicon 404
**Symptoms:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
:4173/favicon.ico
```

**Solution:**
- Favicon is now included: `public/favicon.svg`
- Referenced in `index.html`: `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`
- Will be copied to `dist/` during build

## Testing Audio

### Local Testing
1. Build the project:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

3. Open browser console (F12)

4. Check for audio messages:
   - ✅ `[AUDIO] ✓ Preloaded sfx_click`
   - ✅ `[AUDIO] ✓ Preloaded home_music_bg`
   - ❌ `[AUDIO] Failed to decode...` (indicates problem)

5. Click on page to resume audio context

6. Test sounds:
   - Click buttons (should hear UI clicks)
   - Play game (should hear reactions)
   - Navigate to skill tree (should hear hover/purchase)

### Production Testing (After Deploy)
1. Open deployed site
2. Open browser console (F12)
3. Check for same audio messages
4. Test all interactions

## Audio Volume Control

### Default Volumes
Set in `src/config/GameConfig.ts`:
```typescript
export const AudioVolumes = {
  sfxClick: 0.3,
  sfxReaction: 0.5,
  sfxUpgrade: 0.6,
  sfxAtomBreak: 0.4,
  musicIdle: 0.2,
  musicReaction: 0.3,
  homeMusicBg: 0.2,
  homeUiSelect: 0.3,
  skilltreePurchase: 0.5,
  skilltreeHover: 0.2,
};
```

### Adjusting Volumes
Volumes are stored in localStorage:
- Individual: `CriticalChain_Volume_[type]`
- Legacy master: `CriticalChain_SFXVolume`, `CriticalChain_MusicVolume`

To adjust programmatically:
```typescript
audioManager.setVolume(AudioType.SFX_CLICK, 0.5); // 0.0 to 1.0
```

## Build Configuration

### Vite Configuration
Audio files are automatically copied from `public/` to `dist/`:

```typescript
// vite.config.ts
export default defineConfig({
  publicDir: 'public', // Files here are copied to dist/
  // ...
})
```

### File Organization
```
project/
├── assets/audio/           # Source audio files (for development)
├── public/
│   ├── assets/audio/      # Audio files for production build
│   ├── favicon.svg        # Site icon
│   └── _redirects         # Netlify redirects
└── dist/                  # Build output (generated)
    ├── assets/
    │   ├── audio/         # Audio files (copied from public/)
    │   └── [hashed].js/css
    ├── favicon.svg
    ├── index.html
    └── _redirects
```

## Netlify Deployment

### Audio Files in Deployment
✅ Audio files will be deployed automatically
- All files in `public/assets/` → `dist/assets/`
- Netlify serves everything in `dist/`
- Files are accessible at `/assets/audio/[filename]`

### Cache Headers
Configured in `netlify.toml`:
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

Audio files will be cached for fast loading.

### Testing After Deploy
1. Deploy to Netlify
2. Visit your site
3. Open console - check for audio preload messages
4. Click to resume audio context
5. Test all audio interactions

## Adding New Audio

### Steps to Add New Sound
1. **Add MP3 file** to `assets/audio/`
   - Use underscores, not spaces: `my_sound.mp3`
   - Ensure it's valid MP3 format

2. **Copy to public**:
   ```bash
   xcopy /E /I /Y assets public\assets
   ```

3. **Add to AudioManager**:
   ```typescript
   // src/systems/AudioManager.ts
   export enum AudioType {
     // ... existing
     MY_NEW_SOUND = 'my_new_sound',
   }
   
   const AUDIO_MAP: Record<AudioType, string> = {
     // ... existing
     [AudioType.MY_NEW_SOUND]: '/assets/audio/my_sound.mp3',
   };
   ```

4. **Preload in code**:
   ```typescript
   audioManager.preloadAudio(AudioType.MY_NEW_SOUND);
   ```

5. **Play the sound**:
   ```typescript
   audioManager.playSFX(AudioType.MY_NEW_SOUND);
   ```

6. **Rebuild**:
   ```bash
   npm run build
   ```

## Troubleshooting Commands

### Check if audio files exist
```bash
# Windows
dir "public\assets\audio"
dir "dist\assets\audio"

# Linux/Mac
ls -la public/assets/audio
ls -la dist/assets/audio
```

### Verify build includes audio
```bash
npm run build
ls dist/assets/audio  # Should list all MP3 files
```

### Test locally
```bash
npm run preview
# Open http://localhost:4173
# Check browser console
```

### Clear cache and rebuild
```bash
# Remove dist and node_modules/.vite
rmdir /s /q dist
npm run build
npm run preview
```

## Performance Considerations

### File Sizes
- Keep audio files under 2MB each
- Compress MP3s to 128kbps for web
- Total audio should be under 20MB

### Loading Strategy
- Critical sounds preloaded on init
- Music loaded on-demand per page
- Failed preloads don't block gameplay

### Browser Support
- ✅ Chrome/Edge - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support (with user interaction)
- ✅ Mobile browsers - Requires user gesture

## Summary Checklist

Before deployment, verify:
- [ ] All audio files in `public/assets/audio/`
- [ ] No spaces in filenames
- [ ] All files are valid MP3 format
- [ ] Build succeeds: `npm run build`
- [ ] Audio files in `dist/assets/audio/`
- [ ] Favicon exists: `public/favicon.svg`
- [ ] Local preview works: `npm run preview`
- [ ] Browser console shows successful preloads
- [ ] Sounds play after clicking page
- [ ] No 404 errors in console

---

**Audio is now fully configured for Netlify deployment! 🎵**
