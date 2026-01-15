# File Tree Structure

```
hdb/
├── .gitignore
├── README.md
├── FILE_TREE.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── docs/
│   └── schema.md
└── src/
    ├── app/
    │   ├── layout.tsx              # Root layout
    │   ├── globals.css             # Global styles + design tokens
    │   ├── page.tsx                # Landing/Auth page (/)
    │   ├── studios/
    │   │   ├── page.tsx            # Studio discovery (/studios)
    │   │   └── [studioId]/
    │   │       └── page.tsx        # Studio schedule (/studios/[studioId])
    │   ├── sessions/
    │   │   └── [sessionId]/
    │   │       └── page.tsx        # Session details (/sessions/[sessionId])
    │   ├── bookings/
    │   │   └── page.tsx            # My bookings (/bookings)
    │   ├── owner/
    │   │   └── page.tsx            # Owner dashboard (/owner)
    │   └── instructor/
    │       └── page.tsx            # Instructor schedule (/instructor)
    ├── components/
    │   ├── AppShell.tsx            # Layout with bottom navigation
    │   ├── BookingBottomSheet.tsx  # Booking flow modal
    │   ├── DateStrip.tsx           # Date selector component
    │   ├── SessionCard.tsx         # Session display card
    │   └── ui/
    │       ├── BottomSheet.tsx     # Reusable bottom sheet component
    │       ├── Button.tsx          # Button component (primary/secondary/ghost)
    │       ├── Card.tsx            # Card container component
    │       ├── Chip.tsx            # Chip/Pill component
    │       └── Input.tsx           # Input field component
    ├── lib/
    │   └── api.ts                  # Mock API client (all endpoints)
    └── types/
        └── domain.ts               # Domain type definitions
```

## Route Summary

- `/` - Landing page with mock OAuth buttons
- `/studios` - Studio discovery (map placeholder + list)
- `/studios/[studioId]` - Studio schedule (today + 5 days, filters)
- `/sessions/[sessionId]` - Session details (book/waitlist)
- `/bookings` - My bookings (upcoming/past, cancel)
- `/owner` - Owner dashboard (schedule, occupancy, attendees)
- `/instructor` - Instructor schedule (read-only)

## Component Summary

### Layout & Navigation
- `AppShell` - Main layout with bottom navigation (Studios/Bookings/Owner)

### UI Primitives
- `Card` - Container with rounded corners and shadow
- `Button` - Primary/secondary/ghost variants
- `Chip` - Filter/status pills
- `Input` - Form input with label/error support
- `BottomSheet` - Mobile-friendly modal sheet

### Feature Components
- `DateStrip` - Horizontal date selector (Today + 5 days)
- `SessionCard` - Session display with availability
- `BookingBottomSheet` - Complete booking flow (check credits → purchase → book)

## Key Files

- `src/lib/api.ts` - Complete mock API implementation with stateful booking logic
- `src/types/domain.ts` - All domain entities (User, Studio, Session, Booking, etc.)
- `src/app/globals.css` - Design tokens (CSS variables) for pastel/earthy palette
