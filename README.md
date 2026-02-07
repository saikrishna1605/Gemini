# UNSAID/UNHEARD - Accessibility-First Communication Platform

An accessible, multimodal communication platform built with Next.js, designed for users with diverse communication needs.

## 🌟 Features

- **Multiple Input Methods**
  - Text input
  - Voice/audio input with speech-to-text
  - Camera input with OCR (text reading)
  - AAC (Augmentative and Alternative Communication) icon-based communication
  - Sign language video input

- **Accessibility-First Design**
  - Screen reader support
  - Keyboard navigation
  - Customizable visual settings (font size, contrast, color scheme)
  - Motor accessibility features
  - Cognitive accessibility options
  - WCAG 2.1 AA compliant

- **User Preferences**
  - Cloud-synced preferences via Firebase
  - Customizable input/output modes
  - Visual customization
  - Persistent settings across devices

- **Modern Tech Stack**
  - Next.js 14 with App Router
  - TypeScript
  - Tailwind CSS
  - Firebase (Authentication & Firestore)
  - React Hooks
  - Web APIs (MediaRecorder, Camera, Speech Synthesis)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase project set up
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd unsaid-unheard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your Firebase credentials:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Deployment
./deploy.sh          # Unix/Linux/Mac deployment script
.\deploy.ps1         # Windows PowerShell deployment script
```

## 🚀 Deployment to Vercel

### Quick Deploy (5 minutes)

1. **Prepare Firebase**
   - Create Firebase project
   - Enable Authentication
   - Create Firestore database

2. **Deploy**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Configure**
   - Add environment variables in Vercel dashboard
   - Add Vercel domain to Firebase Authorized Domains

### Detailed Guides

- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - 5-minute deployment guide
- **[PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md)** - Complete overview
- **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** - Comprehensive guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

## 📁 Project Structure

```
unsaid-unheard/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── AccessibilityProvider.tsx
│   │   ├── OnboardingFlow.tsx
│   │   ├── AudioInput.tsx
│   │   ├── CameraInput.tsx
│   │   ├── AACIconSelector.tsx
│   │   └── __tests__/          # Component tests
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAudioInput.ts
│   │   ├── useCameraInput.ts
│   │   └── useOnboarding.ts
│   └── lib/                    # Utility libraries
│       ├── accessibility.ts
│       ├── firebase.ts
│       ├── audio-processor.ts
│       ├── camera-processor.ts
│       └── aac-voice-builder.ts
├── public/                     # Static assets
├── scripts/                    # Deployment scripts
├── .env.local.example          # Environment variables template
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🎨 Customization

### Accessibility Preferences

Users can customize:
- Input modes (text, voice, camera, icons, sign)
- Output modes (audio, captions, easy-read, sign)
- Visual settings (font size, contrast, color scheme)
- Motor settings (touch target size, gesture timeout)
- Cognitive settings (simplified UI, reduced motion)

### Theming

The app supports:
- Light mode
- Dark mode
- High contrast mode
- Custom color schemes

## 🔒 Security

- Firebase Authentication for user management
- Firestore security rules for data protection
- Environment variables for sensitive data
- HTTPS enforced in production
- Content Security Policy headers

## 📊 Performance

- Optimized bundle size
- Static page generation
- Image optimization
- Code splitting
- Lazy loading

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 Documentation

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration
- [ACCESSIBILITY_SETUP.md](./ACCESSIBILITY_SETUP.md) - Accessibility features
- [ACCESSIBILITY_PROVIDER_GUIDE.md](./ACCESSIBILITY_PROVIDER_GUIDE.md) - Provider usage
- Task summaries in root directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the documentation files
- Review the deployment guides
- Visit [Vercel Documentation](https://vercel.com/docs)
- Visit [Firebase Documentation](https://firebase.google.com/docs)

## 🎯 Roadmap

- [ ] Additional language support
- [ ] More AAC icon libraries
- [ ] Advanced voice customization
- [ ] Offline mode support
- [ ] Mobile app versions
- [ ] Integration with assistive technologies

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for backend services
- Vercel for hosting platform
- Open source community

---

**Built with ❤️ for accessibility**

For deployment instructions, see [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
