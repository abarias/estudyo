# UI Style Guide

## Design Philosophy

Estudyo follows a mobile-first, calm, minimalist approach with a friendly community vibe. The UI should feel approachable, clean, and functional.

## Color Tokens

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | #FAF9F7 | Page background |
| `--surface` | #FFFFFF | Cards, sheets, elevated surfaces |
| `--border` | #EAE7E2 | Borders, dividers |
| `--text` | #2F2F2F | Primary text |
| `--muted` | #7A7A7A | Secondary text, icons |

### Accents
| Token | Hex | Usage |
|-------|-----|-------|
| `--sage` | #A3B18A | Primary action, success states |
| `--clay` | #D6B98C | Warnings, waitlist |
| `--blush` | #E6B7B2 | Accents, highlights |
| `--sky` | #9BB7D4 | Information, links |

## Typography

- **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter')
- **Headings**: Bold weight, text color
- **Body**: Regular weight, text color
- **Secondary**: Regular weight, muted color

### Sizes
- Page titles: `text-xl` (1.25rem)
- Card titles: `font-semibold`
- Body: default (1rem)
- Small: `text-sm` (0.875rem)
- Tiny: `text-xs` (0.75rem)

## Component Rules

### Border Radius
- Cards, buttons, inputs: `rounded-2xl` (1rem)
- Chips: `rounded-full`
- Small indicators: `rounded-full`

### Shadows
- Use `shadow-sm` for subtle elevation
- Use `shadow-md` sparingly for hover states
- Avoid heavy shadows

### Spacing
- Page padding: 16px (`p-4`)
- Card padding: 16px (`p-4`)
- Gap between cards: 12px (`space-y-3`)
- Inline gaps: 8px (`gap-2`)

### Buttons

**Primary** (main CTA)
- Background: sage
- Text: white
- Full width where appropriate

**Secondary** (alternative action)
- Background: surface
- Border: border color
- Text: text color

**Ghost** (tertiary)
- Background: transparent
- Text: muted, text on hover

## Icon Rules

- Use **lucide-react** icons exclusively
- Default size: 20px for navigation, 16px inline
- Stroke width: 1.5 for inactive, 2 for active
- Color: muted for inactive, sage for active/primary

## Imagery Rules

- Use abstract SVGs with low opacity (10-15%)
- Colors from accent palette
- Organic shapes (circles, ellipses)
- Avoid complex illustrations
- Images should not distract from functionality

## Interactive States

- Hover: Subtle background change or opacity reduction
- Active/Selected: Sage background with white text
- Disabled: 50% opacity
- Loading: Show spinner or "Loading..." text

## Bottom Sheet

- Rounded top corners: `rounded-t-3xl`
- Handle bar at top (visual affordance)
- Backdrop: semi-transparent black with blur
- Max height: 85vh
- Animate slide-up on open

## Mobile Considerations

- Safe area padding for bottom nav
- Touch targets minimum 44x44px
- Scrollable areas with hidden scrollbars
- Bottom navigation fixed at bottom
- No horizontal overflow on page
