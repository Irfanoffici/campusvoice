# Backend Deployment Guide

This backend server is required for the admin panel's user management features (create user, invite, etc.).

## Quick Deploy Options

### Option 1: Railway (Recommended)

1. **Sign up** at [railway.app](https://railway.app)
2. **Click "New Project"** → **"Deploy from GitHub repo"**
3. **Select** this repository
4. **Set Root Directory** to `backend`
5. **Add Environment Variables**:
   ```
   SUPABASE_URL=https://doajmxrjnkwflwjysuyj.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   MASTER_ADMIN_EMAIL=your-email@example.com
   ```
6. **Deploy** - Railway will auto-detect Node.js and run `npm start`
7. **Copy the deployed URL** (e.g., `https://your-app.up.railway.app`)

### Option 2: Render

1. **Sign up** at [render.com](https://render.com)
2. **New** → **Web Service**
3. **Connect** your GitHub repository
4. **Configure**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
5. **Add Environment Variables** (same as above)
6. **Create Web Service**
7. **Copy the deployed URL** (e.g., `https://your-app.onrender.com`)

### Option 3: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Navigate to backend
cd backend

# Launch app
fly launch

# Set secrets
fly secrets set SUPABASE_URL=your-url
fly secrets set SUPABASE_KEY=your-key
fly secrets set MASTER_ADMIN_EMAIL=your-email

# Deploy
fly deploy
```

## After Deployment

1. **Copy your backend URL**
2. **Update Netlify environment variables**:
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add/Update: `VITE_BACKEND_URL` = `https://your-backend-url.com`
3. **Redeploy** your Netlify site to pick up the new environment variable

## Testing

Test your backend is working:

```bash
curl https://your-backend-url.com/api/health
```

Should return:
```json
{"status":"OK","system":"Supabase Powered"}
```

## Troubleshooting

### CORS Errors
The backend already has CORS enabled for all origins. If you still get CORS errors, check that your backend URL is correct in Netlify env vars.

### 401 Unauthorized
Make sure you're logged in to the admin panel. The API requires a valid JWT token from Supabase auth.

### Connection Refused
- Check that your backend is running
- Verify the `VITE_BACKEND_URL` in Netlify matches your deployed backend URL
- Make sure there's no trailing slash in the URL
