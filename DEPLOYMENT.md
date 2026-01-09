# 🚀 TimeBank Deployment Guide

This guide will help you deploy TimeBank to make it accessible via a public URL.

## 📋 Table of Contents

- [Quick Deploy (Recommended)](#quick-deploy-recommended)
- [Option 1: Vercel + Railway](#option-1-vercel--railway)
- [Option 2: Vercel + Render](#option-2-vercel--render)
- [Option 3: Full Stack on Railway](#option-3-full-stack-on-railway)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

---

## 🎯 Quick Deploy (Recommended)

**Best for:** Sharing with recruiters, portfolio, demos

### Step-by-Step:

#### 1️⃣ Deploy Backend (Railway - Free Tier)

1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select **`prajwaldesaigithub/TimeBank`**
5. Railway will auto-detect the configuration
6. Click **"Add variables"** and add:
   ```
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=your-super-secret-jwt-key-change-this
   PORT=4000
   NODE_ENV=production
   ```
7. Go to **Settings** → Change root directory to `backend`
8. Set **Build Command**: `npm install && npx prisma generate && npm run build`
9. Set **Start Command**: `npm start`
10. Click **"Deploy"**
11. Copy your backend URL (e.g., `https://timebank-backend.railway.app`)

#### 2️⃣ Deploy Frontend (Vercel - Free Tier)

1. Go to [Vercel.com](https://vercel.com/)
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Import **`prajwaldesaigithub/TimeBank`**
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
   ```
7. Click **"Deploy"**
8. Your app will be live at: `https://timebank-[random].vercel.app`

#### 3️⃣ Share Your Link! 🎉

Your public URL: `https://timebank-[random].vercel.app`

---

## 🔧 Option 1: Vercel + Railway

### Backend on Railway

**Advantages:**
- ✅ Free tier with 500 hours/month
- ✅ Automatic GitHub deployments
- ✅ Built-in database support
- ✅ Easy environment variable management

**Steps:**

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select TimeBank repository
4. Set root directory: `backend`
5. Add environment variables:
   ```bash
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=generate-a-secure-random-string
   PORT=4000
   NODE_ENV=production
   ```
6. Deploy and copy the generated URL

### Frontend on Vercel

**Advantages:**
- ✅ Specialized for Next.js
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free custom domains

**Steps:**

1. Create account at [vercel.com](https://vercel.com)
2. Import Git Repository → Select TimeBank
3. Configure project:
   - Root Directory: `frontend`
   - Framework: Next.js
4. Add environment variable:
   ```bash
   NEXT_PUBLIC_API_URL=your-railway-backend-url
   ```
5. Deploy

**Your Live URLs:**
- Frontend: `https://timebank.vercel.app`
- Backend: `https://timebank-backend.railway.app`

---

## 🔧 Option 2: Vercel + Render

### Backend on Render

**Advantages:**
- ✅ Free tier (750 hours/month)
- ✅ PostgreSQL database included
- ✅ Auto-deploy from Git

**Steps:**

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - **Name**: timebank-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables:
   ```bash
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=your-secret-key
   PORT=4000
   ```
6. Create Web Service

### Frontend on Vercel

Same as Option 1 above.

---

## 🔧 Option 3: Full Stack on Railway

Deploy both frontend and backend on Railway:

1. Create two services:
   - Service 1: Backend (root: `backend`)
   - Service 2: Frontend (root: `frontend`)
2. Configure backend as described above
3. Configure frontend:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add env: `NEXT_PUBLIC_API_URL=your-backend-railway-url`

---

## 🔐 Environment Variables

### Backend Variables

```bash
# Required
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=4000
NODE_ENV=production

# Optional
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Frontend Variables

```bash
# Required
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### Generate Secure JWT Secret

```bash
# Use this command to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Database Considerations

### SQLite (Current Setup)

**Pros:**
- ✅ No external database needed
- ✅ Easy to deploy
- ✅ Perfect for demos

**Cons:**
- ⚠️ Data resets on Railway free tier restarts
- ⚠️ Not suitable for production

### Upgrade to PostgreSQL (Recommended for Production)

1. **Create PostgreSQL database:**
   - Railway: Add PostgreSQL plugin
   - Render: Create PostgreSQL database
   - Supabase: Free PostgreSQL database

2. **Update DATABASE_URL:**
   ```bash
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

3. **Update Prisma schema** (`backend/prisma/schema.prisma`):
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

4. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Frontend loads successfully
- [ ] Backend API is accessible
- [ ] User signup works
- [ ] Login functionality works
- [ ] Profile creation works
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly

### Test Your Deployment

1. **Test Backend:**
   ```bash
   curl https://your-backend-url.railway.app/health
   ```

2. **Test Frontend:**
   - Open `https://your-frontend-url.vercel.app`
   - Try signing up
   - Create a profile
   - Browse directory

---

## 🌐 Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `timebank.yourdomain.com`)
3. Update DNS records as instructed
4. Vercel will automatically provision SSL

### Add Custom Domain to Railway

1. Go to Service Settings → Domains
2. Add custom domain
3. Update DNS CNAME record
4. SSL is automatic

---

## 🔄 Automatic Deployments

Both Vercel and Railway support automatic deployments:

- ✅ Push to `main` branch → Deploys to production
- ✅ Push to `develop` branch → Deploys to preview
- ✅ Pull requests → Generate preview URLs

**Configure in platform settings:**
- Vercel: Settings → Git → Production Branch
- Railway: Settings → Deploys → Branch

---

## 📱 Share Your Project

Once deployed, share:

### For Recruiters/Portfolio:
```
🚀 Live Demo: https://timebank.vercel.app
💻 Source Code: https://github.com/prajwaldesaigithub/TimeBank
📖 Documentation: Full README with API docs
```

### For README Badge:
```markdown
[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://timebank.vercel.app)
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** API returns 500 errors
- Check environment variables are set
- Verify DATABASE_URL is correct
- Check logs in Railway/Render dashboard

**Problem:** CORS errors
- Add your frontend URL to CORS_ORIGIN
- Update `backend/src/server.ts` CORS config

### Frontend Issues

**Problem:** API calls fail
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is deployed and running
- Test backend URL directly in browser

**Problem:** Build fails
- Check all dependencies are in `package.json`
- Verify Node version compatibility
- Review build logs for specific errors

### Database Issues

**Problem:** Database resets on Railway
- Upgrade to PostgreSQL
- Or use external SQLite storage

**Problem:** Migration errors
- Run `npx prisma migrate deploy` manually
- Check DATABASE_URL format
- Ensure Prisma client is generated

---

## 💰 Cost Breakdown

### Free Tier Limits

| Platform | Free Tier | Limits |
|----------|-----------|--------|
| **Vercel** | ✅ Unlimited | 100GB bandwidth/month |
| **Railway** | ✅ $5 credit | ~500 hours/month |
| **Render** | ✅ Free | 750 hours/month |

**Estimated Monthly Cost: $0** (within free tiers)

---

## 🎯 Quick Commands Reference

```bash
# Check deployment status
vercel ls
railway status

# View logs
vercel logs
railway logs

# Redeploy
vercel --prod
railway up

# Run migrations on deployed database
railway run npx prisma migrate deploy
```

---

## 📞 Need Help?

- 📧 Issues: [GitHub Issues](https://github.com/prajwaldesaigithub/TimeBank/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/prajwaldesaigithub/TimeBank/discussions)
- 📚 Docs: Check platform documentation
  - [Vercel Docs](https://vercel.com/docs)
  - [Railway Docs](https://docs.railway.app)
  - [Render Docs](https://render.com/docs)

---

## 🎉 Success!

Once deployed, your TimeBank app will be accessible to anyone with the link. Perfect for:
- 📊 Portfolio showcases
- 💼 Job applications
- 🎓 Academic submissions
- 👥 User testing
- 🌟 Impressing recruiters

**Happy Deploying! 🚀**
