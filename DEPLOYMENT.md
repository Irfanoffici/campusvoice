# Deployment Guide

## Local Development Setup

### Prerequisites
- Node.js installed
- Supabase account with project created

### Environment Variables

Both the frontend and admin applications require Supabase credentials. Create `.env` files in each directory:

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
```

**Admin** (`admin/.env`):
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
```

**Backend** (`backend/.env`):
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
PORT=3000
MASTER_ADMIN_EMAIL=your-email@example.com
```

### Running Locally

```bash
# Install dependencies (from root)
npm install

# Start all services
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:admin     # Admin on http://localhost:5174
npm run dev:backend   # Backend on http://localhost:3000
```

## Production Deployment (Netlify)

### Step 1: Configure Environment Variables

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:
   - `VITE_SUPABASE_URL` = `https://doajmxrjnkwflwjysuyj.supabase.co`
   - `VITE_SUPABASE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWpteHJqbmt3Zmx3anlzdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDkxMTcsImV4cCI6MjA4MzM4NTExN30.JEolN04ntBMYrONwvHwHVf_aylwwL39uyg4qTVCsXv4`

### Step 2: Build Configuration

The `netlify.toml` file is already configured:
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`
- **Redirects**: Configured for SPA routing (frontend and admin)

### Step 3: Deploy

1. **Push to GitHub**: Commit your changes and push to your repository
2. **Trigger Deploy**: Netlify will automatically build and deploy
3. **Manual Deploy**: Or trigger a manual deploy from the Netlify dashboard

### Step 4: Verify

1. Visit your Netlify site URL
2. Check browser console for errors
3. Test feedback submission on frontend
4. Test admin login at `/admin`

## Troubleshooting

### "Missing Supabase Environment Variables" Error

**Cause**: Environment variables not set or dev server not restarted

**Solution**:
1. Verify `.env` files exist in `frontend/` and `admin/` directories
2. Restart development servers (Ctrl+C and run `npm run dev` again)
3. For production, verify environment variables in Netlify dashboard

### Database Connection Errors

**Cause**: Invalid Supabase credentials or RLS policies

**Solution**:
1. Verify credentials in Supabase dashboard
2. Check RLS policies are correctly configured
3. Ensure Supabase project is not paused

### Admin Panel Not Loading

**Cause**: Missing environment variables or build issues

**Solution**:
1. Check browser console for specific errors
2. Verify admin `.env` file exists
3. Clear browser cache and hard reload
