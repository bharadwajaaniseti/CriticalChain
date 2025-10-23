# Deployment Guide for Critical Chain Game

## Netlify Deployment

This project is configured for easy deployment to Netlify.

### Prerequisites
- A Netlify account (sign up at https://netlify.com)
- Git repository (GitHub, GitLab, or Bitbucket)

### Automatic Deployment (Recommended)

1. **Connect to Git Provider**
   - Log in to your Netlify account
   - Click "Add new site" > "Import an existing project"
   - Choose your Git provider and authorize Netlify
   - Select the Critical Chain repository

2. **Configure Build Settings**
   - Build command: `npm run build` (auto-detected)
   - Publish directory: `dist` (auto-detected)
   - Node version: 18 (configured in `.nvmrc`)
   
   These settings are automatically read from `netlify.toml`

3. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site
   - Every push to your main branch will trigger a new deployment

### Manual Deployment

If you prefer to deploy manually:

1. **Build the project locally**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy using Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```
   
   Or drag and drop the `dist` folder to Netlify's web interface.

### Configuration Files

- **`netlify.toml`**: Main Netlify configuration
  - Build settings
  - Redirects for SPA routing
  - Security headers
  - Cache control for assets

- **`public/_redirects`**: Backup redirect rules
  - Ensures all routes work as a Single Page Application

- **`.nvmrc`**: Node version specification
  - Ensures consistent Node.js version (18) across environments

### Environment Variables

If you need environment variables:
1. Go to Site settings > Build & deploy > Environment
2. Add your variables
3. They'll be available during build time

### Custom Domain

To add a custom domain:
1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to update your DNS settings

### Continuous Deployment

Once connected to Git:
- **Production**: Pushes to `main` branch → automatic deployment
- **Deploy Previews**: Pull requests → preview deployments
- **Branch Deploys**: Configure specific branches for staging

### Build Performance

The project is optimized for fast builds:
- Vite bundler for quick builds
- Asset optimization enabled
- Proper cache headers configured

### Troubleshooting

**Build Fails**
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

**Assets Not Loading**
- Check that paths in code use relative paths
- Verify `dist` directory structure after build
- Check browser console for 404 errors

**404 on Routes**
- Ensure `netlify.toml` redirects are configured
- Check that `_redirects` file is in `public` directory

### Testing Before Deploy

Always test locally before deploying:
```bash
npm run build
npm run preview
```

This runs a local server with the production build.

### Deploy Status Badge

Add this to your README.md to show deploy status:
```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE/deploys)
```

Replace `YOUR-SITE-ID` and `YOUR-SITE` with your actual Netlify site information.
