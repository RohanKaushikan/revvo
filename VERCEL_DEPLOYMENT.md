# Vercel Deployment Guide

This guide will help you deploy your Revvo application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your repository pushed to GitHub, GitLab, or Bitbucket
3. Environment variables ready (see below)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com) and sign in
   - Click "Add New..." → "Project"

2. **Import Your Repository**
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Find and select your `HackPrincetonF25` repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Vercel will auto-detect, but you can leave it as "Other"
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: Leave empty (handled by vercel.json)
   - **Output Directory**: Leave empty (handled by vercel.json)

4. **Set Environment Variables**
   Click "Environment Variables" and add:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `AUTO_DEV_KEY` - Your Auto.dev API key
   - `SECRET_KEY` - A random secret key for Flask sessions
   - `VITE_API_URL` - Will be set automatically, but you can override if needed
   - `PRODUCTION_URL` - Your production domain (optional, for CORS)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts to link your project
   - Set environment variables when prompted or via dashboard

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `AUTO_DEV_KEY` | Your Auto.dev API key | Yes |
| `SECRET_KEY` | Random secret for Flask sessions | Yes |
| `PRODUCTION_URL` | Your production domain (e.g., `https://your-app.vercel.app`) | Optional |
| `VITE_API_URL` | API URL (usually auto-set by Vercel) | Optional |

## Project Structure

The deployment is configured as follows:

- **Frontend**: React app in `client/` directory, built with Vite
- **Backend**: Flask API in `server/` directory, served as serverless functions
- **API Routes**: All `/api/*` requests are routed to the Flask backend
- **Static Files**: All other requests serve the React frontend

## API Endpoints

After deployment, your API will be available at:
- `https://your-project.vercel.app/api/` - Root endpoint
- `https://your-project.vercel.app/api/listings/` - Car listings
- `https://your-project.vercel.app/api/listings/chat` - AI chat
- `https://your-project.vercel.app/api/recommendations/` - Recommendations

## Troubleshooting

### Build Fails

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables** are set correctly
3. **Check Python version** - Vercel uses Python 3.9 by default
4. **Verify requirements.txt** includes all dependencies

### API Not Working

1. **Check CORS settings** - Make sure your Vercel URL is in allowed origins
2. **Verify environment variables** - Especially `OPENAI_API_KEY` and `AUTO_DEV_KEY`
3. **Check function logs** in Vercel dashboard under "Functions" tab

### Frontend Can't Connect to API

1. **Set `VITE_API_URL`** environment variable to your Vercel deployment URL
   - Format: `https://your-project.vercel.app/api`
2. **Or update** `client/src/CarListings.tsx` to use the correct API URL

## Custom Domain

To use a custom domain:

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update `PRODUCTION_URL` environment variable
4. Update CORS settings in `server/app/__init__.py` if needed

## Notes

- The Flask app runs as serverless functions on Vercel
- Each API request may have a cold start delay (first request after inactivity)
- Vercel has usage limits on the free tier - check their pricing page
- Python dependencies are installed from `api/requirements.txt`

