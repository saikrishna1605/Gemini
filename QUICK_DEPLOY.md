# ⚡ Quick Deploy Guide - UNSAID/UNHEARD

## 🚀 Deploy in 5 Minutes

### Step 1: Firebase Setup (2 minutes)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore Database
5. Copy your config credentials

### Step 2: Environment Variables (1 minute)
Create `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### Step 3: Deploy to Vercel (2 minutes)

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Option B: Vercel Dashboard
1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import repository
4. Add environment variables
5. Click "Deploy"

### Step 4: Post-Deployment
1. Add Vercel domain to Firebase Authorized Domains
2. Test your deployment
3. Done! 🎉

## 📋 Commands Reference

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Deploy to Vercel
vercel --prod
```

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check `.env.local` exists and has all variables |
| Firebase error | Add Vercel domain to Firebase Authorized Domains |
| Page not loading | Check browser console for errors |
| Slow performance | Enable Vercel Analytics to identify issues |

## 📚 Full Documentation

- [PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md) - Complete overview
- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - Detailed guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist

## ✅ Verification

After deployment, verify:
- [ ] Site loads at your Vercel URL
- [ ] Can create an account
- [ ] Can login
- [ ] Preferences save correctly
- [ ] No console errors

---

**Need help?** Check the full guides above or visit [Vercel Support](https://vercel.com/support)
