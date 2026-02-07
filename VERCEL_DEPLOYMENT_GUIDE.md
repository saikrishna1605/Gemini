# Vercel Deployment Guide for UNSAID/UNHEARD

This guide will help you deploy the UNSAID/UNHEARD application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional, but recommended)
3. Firebase project set up with credentials
4. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Environment Variables

Create a `.env.local` file in your project root with your Firebase credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Important:** Never commit `.env.local` to your repository. It's already in `.gitignore`.

## Step 2: Test Build Locally

Before deploying, ensure your application builds successfully:

```bash
# Install dependencies
npm install

# Run linter and fix issues
npm run lint

# Build the application
npm run build

# Test the production build locally
npm run start
```

If the build succeeds, you're ready to deploy!

## Step 3: Deploy to Vercel (Method 1: Web Interface)

### 3.1 Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Select the repository containing your UNSAID/UNHEARD code

### 3.2 Configure Project Settings

1. **Framework Preset:** Next.js (should be auto-detected)
2. **Root Directory:** `./` (leave as default)
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Install Command:** `npm install` (default)

### 3.3 Add Environment Variables

In the "Environment Variables" section, add all your Firebase credentials:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Make sure to add them for all environments (Production, Preview, and Development).

### 3.4 Deploy

Click "Deploy" and wait for the build to complete. Vercel will:
- Install dependencies
- Run the build process
- Deploy your application
- Provide you with a production URL

## Step 4: Deploy to Vercel (Method 2: CLI)

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Login to Vercel

```bash
vercel login
```

### 4.3 Deploy

From your project root:

```bash
# For preview deployment
vercel

# For production deployment
vercel --prod
```

### 4.4 Add Environment Variables via CLI

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
```

## Step 5: Configure Firebase for Your Vercel Domain

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Authentication" → "Settings" → "Authorized domains"
4. Add your Vercel domain (e.g., `your-app.vercel.app`)
5. Also add any custom domains you plan to use

## Step 6: Set Up Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Update Firebase authorized domains with your custom domain

## Step 7: Configure Firestore Security Rules

Ensure your Firestore security rules allow authenticated users to read/write their preferences:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/preferences/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 8: Test Your Deployment

1. Visit your Vercel URL
2. Test all features:
   - User authentication
   - Accessibility preferences
   - Audio input
   - Camera input
   - AAC icon selector
   - Onboarding flow
3. Check browser console for any errors
4. Test on multiple devices and browsers

## Continuous Deployment

Vercel automatically deploys:
- **Production:** When you push to your main/master branch
- **Preview:** When you create a pull request or push to other branches

## Monitoring and Logs

- **View Logs:** Vercel Dashboard → Your Project → Deployments → Click on a deployment
- **Analytics:** Vercel Dashboard → Your Project → Analytics
- **Performance:** Use Vercel's built-in performance monitoring

## Troubleshooting

### Build Fails

1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are in `package.json`
3. Verify environment variables are set correctly
4. Test build locally: `npm run build`

### Firebase Connection Issues

1. Verify all Firebase environment variables are set
2. Check Firebase authorized domains include your Vercel domain
3. Ensure Firebase project is active and not in free tier limits

### Runtime Errors

1. Check Vercel function logs
2. Verify browser console for client-side errors
3. Ensure all API routes are working
4. Check Firebase Firestore rules

## Performance Optimization

1. **Enable Vercel Analytics:**
   ```bash
   npm install @vercel/analytics
   ```
   Add to `src/app/layout.tsx`:
   ```typescript
   import { Analytics } from '@vercel/analytics/react';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

2. **Enable Image Optimization:**
   - Use Next.js `<Image>` component instead of `<img>`
   - Vercel automatically optimizes images

3. **Configure Caching:**
   - Vercel handles caching automatically
   - Customize in `next.config.mjs` if needed

## Security Best Practices

1. **Never commit secrets:** Use environment variables
2. **Enable HTTPS:** Vercel provides automatic HTTPS
3. **Set up Firebase security rules:** Restrict access appropriately
4. **Use Content Security Policy:** Add headers in `next.config.mjs`
5. **Regular updates:** Keep dependencies updated

## Cost Considerations

- **Vercel Free Tier:** Suitable for development and small projects
- **Pro Tier:** Recommended for production with custom domains
- **Firebase:** Monitor usage to stay within free tier or upgrade as needed

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start

# Run linter
npm run lint

# Run tests
npm test

# Deploy to Vercel (preview)
vercel

# Deploy to Vercel (production)
vercel --prod

# View deployment logs
vercel logs

# List deployments
vercel ls
```

## Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Firebase authentication works
- [ ] User preferences save and load correctly
- [ ] All input methods function (audio, camera, AAC)
- [ ] Accessibility features work as expected
- [ ] Mobile responsive design works
- [ ] All pages are accessible
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Analytics are tracking (if enabled)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate is active
- [ ] Firebase security rules are properly configured

## Next Steps

1. Set up monitoring and alerts
2. Configure analytics
3. Plan for scaling
4. Set up staging environment
5. Implement CI/CD pipeline
6. Add error tracking (e.g., Sentry)
7. Set up automated testing

---

**Need Help?** Check the troubleshooting section or reach out to the Vercel support team.
