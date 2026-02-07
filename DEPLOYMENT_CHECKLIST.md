# 🚀 Deployment Checklist for UNSAID/UNHEARD

## Pre-Deployment Steps

### 1. Environment Setup ✅
- [ ] Create `.env.local` file with Firebase credentials
- [ ] Verify all environment variables are set:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 2. Code Quality ✅
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run lint` to check for linting errors
- [ ] Run `npm test` to ensure all tests pass
- [ ] Run `npm run build` to verify production build works

### 3. Firebase Configuration ✅
- [ ] Firebase project is created
- [ ] Authentication is enabled (Email/Password, Google, etc.)
- [ ] Firestore database is created
- [ ] Security rules are configured
- [ ] Storage bucket is set up (if using file uploads)

## Vercel Deployment Steps

### Method 1: Vercel Dashboard (Recommended for First Deployment)

1. **Connect Repository**
   - [ ] Push code to GitHub/GitLab/Bitbucket
   - [ ] Go to [vercel.com/new](https://vercel.com/new)
   - [ ] Import your repository
   - [ ] Select the repository

2. **Configure Project**
   - [ ] Framework: Next.js (auto-detected)
   - [ ] Root Directory: `./`
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `.next`

3. **Add Environment Variables**
   - [ ] Add all Firebase environment variables
   - [ ] Set for Production, Preview, and Development environments

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for build to complete
   - [ ] Note your deployment URL

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy (production)
vercel --prod
```

## Post-Deployment Steps

### 1. Firebase Configuration ✅
- [ ] Add Vercel domain to Firebase Authorized Domains
  - Go to Firebase Console → Authentication → Settings → Authorized domains
  - Add: `your-app.vercel.app`
  - Add: `your-app-*.vercel.app` (for preview deployments)

### 2. Testing ✅
- [ ] Visit deployment URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Test accessibility preferences saving
- [ ] Test audio input functionality
- [ ] Test camera input functionality
- [ ] Test AAC icon selector
- [ ] Test onboarding flow
- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)

### 3. Performance Optimization ✅
- [ ] Check Lighthouse scores
- [ ] Verify images are optimized
- [ ] Check bundle size
- [ ] Test loading speed
- [ ] Verify caching is working

### 4. Security ✅
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Firebase security rules are properly configured
- [ ] No sensitive data in client-side code
- [ ] Environment variables are not exposed
- [ ] CSP headers are configured (if needed)

### 5. Monitoring ✅
- [ ] Set up Vercel Analytics (optional)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors

## Custom Domain Setup (Optional)

1. **Add Domain in Vercel**
   - [ ] Go to Project Settings → Domains
   - [ ] Add your custom domain
   - [ ] Follow DNS configuration instructions

2. **Update Firebase**
   - [ ] Add custom domain to Firebase Authorized Domains

3. **SSL Certificate**
   - [ ] Verify SSL certificate is issued (automatic with Vercel)

## Troubleshooting

### Build Fails
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for lint errors
npm run lint
```

### Firebase Connection Issues
- Verify environment variables are set correctly in Vercel
- Check Firebase project is active
- Verify authorized domains include Vercel domain

### Runtime Errors
- Check Vercel function logs
- Check browser console
- Verify Firebase security rules

## Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start

# Run tests
npm test

# Run linter
npm run lint

# Deploy to Vercel
vercel --prod
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `my-project` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc` |

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Project README](./README.md)
- [Detailed Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)

## Success Criteria

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ Users can register and login
- ✅ Preferences are saved and synced
- ✅ All input methods work (audio, camera, AAC)
- ✅ Accessibility features function correctly
- ✅ Mobile responsive design works
- ✅ Performance is acceptable (Lighthouse score > 80)
- ✅ No console errors in production

---

**Ready to deploy?** Follow the steps above and refer to `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.
