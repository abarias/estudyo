# Estudyo - Studio Booking App MVP

A mobile-first, modular booking app for Pilates/Yoga studios and other class-based services. **Demo Mode** – no backend required.

## Overview

Estudyo lets users browse studios, book classes, join waitlists, and manage bookings. Studio owners can view schedules, occupancy, and simulate slot openings. All data is stored in-memory (mock store) – perfect for demos and testing.

## Features

### Customer/Student
- Browse studios and class schedules
- Book sessions (1-click with credits)
- Purchase credit packs
- Join waitlists when classes are full
- Cancel bookings (24h policy)

### Owner
- View day/week schedule with occupancy
- See session attendees
- Simulate slot openings (waitlist offers)
- Studio setup wizard

### Demo Scenarios
Pre-built scenarios to test specific flows:
1. **Credits Available** – New user with 5 credits
2. **No Entitlements** – Forces purchase flow
3. **Full Class + Waitlist** – Class at capacity with waiters
4. **Waitlist Offer** – 15-minute accept window active
5. **Locked Cancel** – Booking within 24h (cancel disabled)

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state management)
- **date-fns** (date handling)

## Run Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

No environment variables required – uses mock data only.

## Demo Instructions

### Quick Start (60 seconds)
Visit `/demo` after deployment for a guided walkthrough of all features.

### Testing Scenarios
1. Go to `/dev` to access the Dev Console
2. Select a scenario to load specific test data
3. Use the Quick Links to navigate to relevant pages

### Key Flows to Test
- **Browse Studios**: `/studios` → select a studio → view schedule
- **Book a Class**: Click "Book" on any available session
- **Join Waitlist**: Try booking a full class (Scenario 3)
- **Accept Waitlist Offer**: Load Scenario 4 → `/bookings`
- **Cancel Booking**: Book a class → `/bookings` → Cancel (24h+ in future)
- **Owner View**: `/owner` → see schedule and attendees

## Demo Mode Banner

The app displays a "Demo Mode" banner on the Owner page with a scenario selector. This allows reviewers to quickly switch between test scenarios.

## Demo Access Code (Optional)

Add `?access=estudyo2024` to any URL to enable demo access, or set `localStorage.setItem('estudyo_access', 'estudyo2024')` in browser console. Without it, the app works normally (no gate enabled by default).

## Project Structure

```
app/
├── page.tsx              # Landing page
├── (main)/               # Main app routes (with AppShell)
│   ├── studios/          # Studio discovery & schedules
│   ├── sessions/         # Session details
│   ├── bookings/         # My bookings
│   ├── owner/            # Owner dashboard
│   └── instructor/       # Instructor schedule
├── dev/                  # Dev console (scenarios)
└── demo/                 # Demo guide page
components/
├── ui/                   # Primitive components
├── booking/              # Booking-related components
├── studio/               # Studio/session components
└── owner/                # Owner components
lib/
├── store/                # Zustand slices
└── api.ts                # Mock API client
```

## Deployment to Vercel

### Option A: Web UI

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select "Import Git Repository"
   - Choose your `estudyo` repository
   - Framework: **Next.js** (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: (leave default)
   - Click **Deploy**

3. **Share URL**
   - Once deployed, copy the `.vercel.app` URL
   - Share with reviewers

### Option B: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? estudyo
# - Directory? ./
# - Override settings? No

# For production deployment:
vercel --prod
```

## Policy Rules (Hardcoded)

- Cancellation cutoff: 24 hours
- Booking cutoff: 60 minutes
- Waitlist offer window: 15 minutes

## Design System

- **Colors**: Pastel, earthy palette (warm off-white, sage green, soft beige)
- **Components**: Rounded corners (2xl), subtle shadows
- **Mobile-first**: Optimized for phone width

## Next Steps (Post-MVP)

- Real authentication (OAuth)
- Payment provider integration
- Database persistence
- Push notifications
- PWA capabilities

## License

MIT
