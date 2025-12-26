# Slay the Spire Analytics - Deployment Guide

## Easiest Method: Render (Recommended)

Render is the simplest option - it's free, requires minimal configuration, and can host both frontend and backend.

### Prerequisites
- GitHub account
- Supabase account (you already have this)
- Render account (sign up at https://render.com - free)

---

## Step-by-Step Instructions

### 1. Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Slay the Spire Analytics"

# Create a new repository on GitHub (go to github.com/new)
# Then link it and push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy Backend on Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `slay-spire-backend` (or whatever you want)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: `Free`

5. Add Environment Variables (click "Advanced" → "Add Environment Variable"):
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_KEY` = your Supabase anon key
   - `UPLOAD_PASSWORD` = your chosen upload password
   - `PYTHON_VERSION` = `3.10.0`

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (will be something like `https://slay-spire-backend.onrender.com`)

### 3. Deploy Frontend on Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Static Site"
3. Connect the same GitHub repository
4. Configure:
   - **Name**: `slay-spire-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. Add Environment Variable:
   - `VITE_API_URL` = your backend URL from step 2 (e.g., `https://slay-spire-backend.onrender.com`)

6. Click "Create Static Site"
7. Wait for deployment (3-5 minutes)
8. Your site will be live at `https://slay-spire-frontend.onrender.com`

---

## Alternative: Vercel (Frontend) + Render (Backend)

If you prefer Vercel for the frontend (slightly better performance):

### Backend: Same as above (Render)

### Frontend: Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variable:
   - `VITE_API_URL` = your Render backend URL
7. Click "Deploy"

---

## Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Backend will sleep after 15 minutes of inactivity
- Takes ~30 seconds to wake up on first request
- 750 hours/month (enough for one service 24/7)

**Solutions:**
- Your "Wake Database" button will also wake the backend
- Or upgrade to paid tier ($7/month) for always-on service

### CORS Configuration

Your Flask app already has CORS enabled for all origins, but you may want to restrict it in production:

```python
# In backend/app.py, change:
CORS(app)

# To:
CORS(app, origins=[
    'https://slay-spire-frontend.onrender.com',
    'https://your-custom-domain.com'
])
```

---

## Custom Domain (Optional)

Both Render and Vercel support custom domains for free:

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Render/Vercel dashboard, go to your project settings
3. Add custom domain
4. Update your domain's DNS records as instructed

---

## What You Need to Do Before Deploying

1. **Install gunicorn** (production WSGI server for Flask):
   ```bash
   cd backend
   venv/Scripts/pip install gunicorn
   venv/Scripts/pip freeze > requirements.txt
   ```

2. **Update frontend to use environment variable** (I'll do this next)

3. **Push to GitHub**

---

## Cost Summary

- **Free Option**: $0/month (Render free tier + Vercel/Render static hosting)
- **Paid Option**: $7/month (Render paid tier for always-on backend)
- **Supabase**: Free (500MB database, 50k rows, should be plenty)

---

## Next Steps

Let me know when you're ready, and I'll:
1. Install gunicorn
2. Update the frontend to use environment variables
3. Help you push to GitHub
4. Walk you through the Render deployment
