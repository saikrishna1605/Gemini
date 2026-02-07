# 🚀 Deployment Steps for UNSAID/UNHEARD

## ✅ What's Already Done

Your code is **production-ready**! Here's what has been completed:

### Build & Configuration ✅
- [x] Next.js configuration optimized for production
- [x] TypeScript configuration set up
- [x] ESLint configuration completed
- [x] Vercel configuration file created
- [x] Build tested and passing
- [x] All critical errors fixed
- [x] Security headers configured
- [x] Image optimization enabled

### Documentation ✅
- [x] Comprehensive deployment guides created
- [x] Quick start guide written
- [x] Deployment checklist provided
- [x] Troubleshooting guide included
- [x] README updated with deployment info

### Scripts ✅
- [x] Deployment scripts created (Unix & Windows)
- [x] Build verification scripts ready
- [x] Environment setup documented

## 🎯 What You Need to Do

### 1. Set Up Firebase (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "unsaid-unheard" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create Project"

**Enable Authentication:**
1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

**Create Firestore Database:**
1. In Firebase Console, go to "Firestore Database"
2. Click "Create Database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location close to your users
5. Click "Enable"

**Get Configuration:**
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click the web icon (</>)
4. Register app with nickname "unsaid-unheard-web"
5. Copy the configuration values

### 2. Configure Environment Variables (2 minutes)

Create `.env.local` file in your project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

Replace the values with your Firebase configuration.

### 3. Test Locally (2 minutes)

```bash
# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Start production server
npm run start
```

Visit http://localhost:3000 and verify everything works.

### 4. Deploy to Vercel (3 minutes)

#### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

When prompted:
- Set up and deploy: **Yes**
- Which scope: Choose your account
- Link to existing project: **No**
- Project name: **unsaid-unheard** (or your choice)
- Directory: **./** (press Enter)
- Override settings: **No** (press Enter)

#### Option B: Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Click "Import Project"
4. Select your repository
5. Configure:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
6. Add Environment Variables (all 6 Firebase variables)
7. Click "Deploy"

### 5. Configure Firebase for Vercel (1 minute)

After deployment, Vercel will give you a URL like: `https://unsaid-unheard.vercel.app`

1. Go to Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add your Vercel domain: `unsaid-unheard.vercel.app`
5. Also add: `unsaid-unheard-*.vercel.app` (for preview deployments)
6. Click "Add"

### 6. Secure Firestore (2 minutes)

1. Go to Firebase Console → Firestore Database → Rules
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own preferences
    match /users/{userId}/preferences/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click "Publish"

### 7. Test Your Deployment (3 minutes)

Visit your Vercel URL and test:
- [ ] Page loads without errors
- [ ] Can create an account
- [ ] Can login
- [ ] Can save preferences
- [ ] Audio input works
- [ ] Camera input works
- [ ] AAC selector works
- [ ] Onboarding flow works

## 🎉 You're Done!

Your application is now live and production-ready!

## 📊 Deployment Summary

| Item | Status | Time |
|------|--------|------|
| Firebase Setup | ⏳ To Do | 5 min |
| Environment Variables | ⏳ To Do | 2 min |
| Local Testing | ⏳ To Do | 2 min |
| Vercel Deployment | ⏳ To Do | 3 min |
| Firebase Configuration | ⏳ To Do | 1 min |
| Firestore Security | ⏳ To Do | 2 min |
| Testing | ⏳ To Do | 3 min |
| **Total Time** | | **~18 minutes** |

## 🔗 Quick Links

- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Firebase Docs](https://firebase.google.com/docs)

## 📚 Additional Resources

- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Ultra-quick reference
- [PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md) - Complete overview
- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - Detailed guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Full checklist

## 🆘 Need Help?

### Common Issues

**Build fails locally:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Firebase connection error:**
- Check environment variables are set correctly
- Verify Firebase project is active
- Check authorized domains include your Vercel URL

**Vercel deployment fails:**
- Ensure all environment variables are added in Vercel dashboard
- Check build logs in Vercel dashboard
- Verify package.json has all dependencies

### Get Support

- Check the troubleshooting section in VERCEL_DEPLOYMENT_GUIDE.md
- Visit [Vercel Support](https://vercel.com/support)
- Visit [Firebase Support](https://firebase.google.com/support)

## ✅ Success Checklist

After completing all steps, verify:
- [ ] Application loads at Vercel URL
- [ ] No console errors
- [ ] Can create account
- [ ] Can login
- [ ] Preferences save and sync
- [ ] All features work
- [ ] Mobile responsive
- [ ] Accessibility features work

---

**Ready to deploy?** Start with Step 1 above! 🚀

**Estimated Total Time:** 18 minutes
**Difficulty:** Easy
**Cost:** Free (Firebase & Vercel free tiers)
