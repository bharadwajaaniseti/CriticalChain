# 🚀 Quick Deployment Guide

## Your Project is Ready for Netlify! ✅

All necessary configuration files have been created:
- ✅ `netlify.toml` - Build settings and redirects
- ✅ `public/_redirects` - SPA routing
- ✅ `.nvmrc` - Node.js version
- ✅ `.gitignore` - Excludes build files

## Test Your Build Locally

Before deploying, make sure the build works:

```bash
npm run build
npm run preview
```

Visit http://localhost:4173 to test the production build.

## Deploy to Netlify (Method 1: Git Integration - Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to https://app.netlify.com/
   - Click "Add new site" > "Import an existing project"
   - Choose GitHub and select your repository
   - Netlify will auto-detect settings from `netlify.toml`
   - Click "Deploy site"

3. **Automatic Deployments**:
   - Every push to main = automatic deploy
   - Pull requests = deploy previews
   - No manual steps needed!

## Deploy to Netlify (Method 2: Drag & Drop)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Drag and Drop**:
   - Go to https://app.netlify.com/drop
   - Drag the `dist` folder to the upload area
   - Your site will be live in seconds!

## Deploy to Netlify (Method 3: Netlify CLI)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and Deploy**:
   ```bash
   netlify login
   netlify init
   netlify deploy --prod
   ```

## After Deployment

### Get Your URL
Netlify will give you a URL like: `https://your-site-name.netlify.app`

### Add Custom Domain (Optional)
1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow DNS setup instructions

### Enable HTTPS
HTTPS is automatically enabled by Netlify for all sites!

## Verify Deployment

Check these after deployment:
- [ ] Home page loads correctly
- [ ] Game page works and animations display
- [ ] Skill tree page functions properly
- [ ] Navigation between pages works
- [ ] Browser console has no errors
- [ ] Assets load (images, audio, data files)
- [ ] Audio works (click page first to resume context)
- [ ] Favicon displays in browser tab

**Note about Audio:** Modern browsers require user interaction before playing audio. This is normal! Just click anywhere on the page to enable audio.

## Troubleshooting

**Build fails on Netlify?**
- Check build logs in Netlify dashboard
- Verify `package.json` dependencies are correct
- Make sure Node version matches (18)

**404 errors on routes?**
- Verify `netlify.toml` includes redirects
- Check `public/_redirects` exists
- Clear deploy cache and retry

**Assets not loading?**
- Check file paths use relative paths
- Verify assets are in `public` or imported in code
- Check browser console for 404s

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment documentation.

---

**Ready to deploy!** 🎉

Your Critical Chain game will be accessible worldwide in minutes!
