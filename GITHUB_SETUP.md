# GitHub Repository Setup Guide

This guide will help you push Critical Chain to GitHub.

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top-right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `critical-chain` (or your preferred name)
   - **Description**: "Nuclear chain reaction incremental game with session-based skill tree progression"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these in your terminal:

```bash
# Add the remote repository (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/critical-chain.git

# Rename the default branch to main (optional, if you prefer main over master)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

### Alternative: Using SSH (Recommended for security)

If you have SSH keys set up:

```bash
git remote add origin git@github.com:YOUR-USERNAME/critical-chain.git
git branch -M main
git push -u origin main
```

## Step 3: Verify on GitHub

1. Refresh your GitHub repository page
2. You should see all your files, including:
   - README.md with documentation
   - LICENSE file
   - CHANGELOG.md
   - All source code
   - Asset files

## Step 4: Set Up Repository Settings (Optional)

### Add Topics
Click on the gear icon next to "About" and add relevant topics:
- `incremental-game`
- `idle-game`
- `typescript`
- `vite`
- `game-development`
- `skill-tree`
- `canvas`

### Add Website Link
If you deploy the game (see deployment options below), add the URL in the "About" section.

### Enable GitHub Pages (Optional)
1. Go to Settings → Pages
2. Select your branch (main) and folder (root or /dist after build)
3. Save to get a free hosted version

## Quick Command Reference

```bash
# Check current status
git status

# Add new changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

## Current Repository Status

✅ **Initial commit created** with:
- 35 files
- 12,003+ lines of code
- Complete game implementation
- Documentation (README, LICENSE, CHANGELOG)
- Skill tree with 100+ nodes
- Session-based progression system
- Meta currency system

**Commit Hash**: 7ddc309
**Commit Message**: "Initial commit: Critical Chain v1.0.0 - Session-based skill tree game with meta progression"

## Deployment Options

### Option 1: GitHub Pages
```bash
npm run build
# Then enable GitHub Pages in repository settings, point to /dist folder
```

### Option 2: Netlify
1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

### Option 3: Vercel
1. Import your GitHub repository
2. Framework: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

### Option 4: itch.io
```bash
npm run build
# Zip the dist folder and upload to itch.io
```

## Troubleshooting

### If you get "remote already exists" error:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/critical-chain.git
```

### If you need to change the repository URL:
```bash
git remote set-url origin https://github.com/YOUR-USERNAME/new-repo-name.git
```

### If you need to force push (use with caution):
```bash
git push -f origin main
```

## Next Steps

1. ✅ Local repository initialized
2. ✅ Initial commit created
3. ⏳ Create GitHub repository (follow Step 1)
4. ⏳ Push to GitHub (follow Step 2)
5. ⏳ Configure repository settings (follow Step 4)
6. ⏳ (Optional) Deploy the game

---

**Need Help?**
- [GitHub Documentation](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

Good luck! 🚀
