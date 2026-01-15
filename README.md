# Estudyo - Studio Booking App MVP

A mobile-first, modular booking app for Pilates/Yoga studios and other class-based services.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **date-fns** for date handling

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router routes
│   ├── page.tsx           # Landing/Auth page
│   ├── studios/           # Studio discovery & schedule
│   ├── sessions/          # Session details
│   ├── bookings/          # My bookings
│   ├── owner/             # Owner dashboard
│   └── instructor/        # Instructor schedule
├── components/            # Reusable UI components
│   ├── ui/               # Primitive components (Card, Button, etc.)
│   ├── AppShell.tsx      # Layout with bottom navigation
│   ├── DateStrip.tsx     # Date selector component
│   ├── SessionCard.tsx   # Session display card
│   └── BookingBottomSheet.tsx  # Booking flow modal
├── lib/
│   └── api.ts            # Mock API client
└── types/
    └── domain.ts         # Domain type definitions
```

## Features

### Student/Customer
- Browse studios and view schedules
- Book sessions (1-click if entitled)
- Purchase credit packs
- Join waitlists
- View and cancel bookings (24h policy)

### Owner
- View day/week schedule
- See occupancy stats
- View session attendees
- Monitor waitlists

### Instructor
- View assigned schedule (read-only)

## Mock Data

The app uses in-memory mock data. Sample sessions are automatically generated for the next 5 days. The mock API client (`src/lib/api.ts`) simulates all backend operations including:
- Booking with capacity management
- Credit/entitlement tracking
- Waitlist management
- Cancellation with 24h policy

## Design System

- **Colors**: Pastel, earthy palette (warm off-white, sage green, soft beige)
- **Typography**: System fonts (Inter/SF/DM Sans style)
- **Components**: Rounded corners (2xl), subtle shadows, minimal borders
- **Mobile-first**: Optimized for phone width, responsive design

## Policy Rules (Hardcoded)

- Cancellation cutoff: 24 hours
- Booking cutoff: 60 minutes (optional)
- Waitlist offer window: 15 minutes

## Next Steps

- Real authentication (OAuth)
- Payment provider integration
- Database persistence
- Push notifications
- PWA capabilities
- Owner setup wizard for studios/rooms/services/products/templates

## License

MIT
