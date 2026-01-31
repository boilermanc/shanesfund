<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Jc6U0YgOnkSZdDB_pgyxYFK-DUZrx2yb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# Shane's Retirement Fund

A mobile-first lottery syndicate web application that lets users pool resources, join lottery groups, and manage collective wealth with friends.

**Live Site:** https://shanesfund.vercel.app  
**Repository:** https://github.com/boilermanc/shanesfund

---

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **State Management:** Zustand
- **Styling:** Tailwind CSS (CDN)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Backend:** Supabase (planned)
- **Deployment:** Vercel

---

## Features

- **Authentication Screen** — Login/signup with custom branding
- **Pool Management** — Create and join lottery syndicates
- **Pool Carousel & Lists** — Browse available pools
- **Ticket Scanner** — Camera-based lottery ticket input
- **Friends System** — Invite friends, accept requests
- **Contribution Ledger** — Track member payments
- **Wealth Insights** — Analytics and performance stats
- **Shane Mascot** — Animated character with 5 expressions (normal, excited, confident, thoughtful, worried)
- **Pro Upgrade Modal** — Premium subscription flow
- **Mobile Responsive** — Optimized for iPhone and mobile devices

---

## Project Structure

```
shanesfund/
├── components/          # 27+ React components
│   ├── AuthScreen.tsx
│   ├── BottomNav.tsx
│   ├── ShaneMascot.tsx
│   ├── PoolCarousel.tsx
│   ├── PoolList.tsx
│   ├── TicketScanner.tsx
│   ├── WealthInsights.tsx
│   ├── ContributionLedger.tsx
│   ├── CreatePoolWizard.tsx
│   ├── ProUpgradeModal.tsx
│   ├── AcceptFriendModal.tsx
│   ├── InviteShareScreen.tsx
│   └── ... (more components)
├── store/
│   └── useStore.ts      # Zustand store
├── lib/                 # Utilities
├── types.ts             # TypeScript interfaces
├── App.tsx              # Main app component
├── index.tsx            # Entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript config
└── package.json
```

---

## Setup Instructions

### Step 1: Clone the repository

```powershell
cd C:\Users\clint\Documents\Github
git clone https://github.com/boilermanc/shanesfund.git
```

### Step 2: Navigate to project folder

```powershell
cd C:\Users\clint\Documents\Github\shanesfund
```

### Step 3: Install dependencies

```powershell
npm install
```

### Step 4: Run development server

```powershell
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Deployment Instructions

### Deploy to Vercel (Production)

```powershell
cd C:\Users\clint\Documents\Github\shanesfund
npx vercel --prod
```

### Push changes to GitHub

```powershell
cd C:\Users\clint\Documents\Github\shanesfund
git add .
git commit -m "Your commit message"
git push origin main
```

---

## Design System

### Colors
- **Primary Teal:** `#006D77`
- **Accent Teal:** `#83C5BE`
- **Light Background:** `#EDF6F9`
- **Cream Background:** `#F2E9D4`
- **Coral Accent:** `#E29578`
- **Coral Light:** `#FFDDD2`

### Mobile Responsive Patterns
- Text sizing: `text-xs sm:text-sm`
- Padding: `p-4 sm:p-6`
- Rounded corners: `rounded-[1.5rem] sm:rounded-[2rem]`
- Gaps: `gap-3 sm:gap-4`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npx vercel` | Deploy to Vercel (preview) |
| `npx vercel --prod` | Deploy to Vercel (production) |

---

## Notes

- The app uses Tailwind CSS via CDN (suitable for development, consider PostCSS setup for production)
- Custom logo should be placed at `/public/logo.png`
- Mobile responsiveness has been applied to all 27 components
