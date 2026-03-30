# Estudyo — User Testing Guide

**App URL:** https://estudyo.vercel.app
**Version:** Feature branch `feature/owner-views` (merged to main)

---

## Before You Start

### Test Accounts Needed
You will need **three separate accounts** — one per persona. Use different Google or Facebook accounts for each.

| Persona | Role to select at onboarding | What they do |
|---|---|---|
| **Owner** | Studio Owner | Creates and manages studios, sessions, and instructors |
| **Instructor** | Instructor | Manages their assigned sessions |
| **Customer** | Customer | Browses studios and books sessions |

### Important: Run Tests in Order
Some test cases depend on earlier ones being completed. Follow the sequence:
1. **Owner** sets up a studio first (Scenario O1)
2. **Owner** assigns the Instructor account to the studio (Scenario O2)
3. **Customer** can then browse and book (Scenarios C1–C4)
4. **Instructor** can then claim sessions (Scenario I2)

---

## Persona 1 — Studio Owner

### O1 · Studio Setup (New Studio Wizard)

**Pre-condition:** Logged in as Owner. No studios created yet.

| # | Step | Expected Result |
|---|---|---|
| O1.1 | Go to **Studios** in the bottom nav | Page shows "No studios yet" with a Set Up Studio button |
| O1.2 | Tap **New Studio** or **Set Up Studio** | Setup wizard opens at Step 1 of 7 (Studio) |
| O1.3 | Enter a studio name and description | Fields accept text input |
| O1.4 | Type an address in the address field | Autocomplete suggestions appear in a dropdown |
| O1.5 | Select a suggestion from the dropdown | Map pans and zooms to the selected location; pin drops on the map |
| O1.6 | Tap anywhere on the map to adjust the pin | Pin moves to the tapped location; address field is unchanged |
| O1.7 | Select a timezone | Dropdown updates selection |
| O1.8 | Toggle the **Enable Waitlist** switch | Switch changes state (on/off) |
| O1.9 | Tap **Next** | Advances to Step 2 (Rooms). Next is disabled if name or address is empty. |
| O1.10 | Add at least one room with a name and capacity | Room appears in the list below the form |
| O1.11 | Tap **Next** | Advances to Step 3 (Services) |
| O1.12 | Add at least one service type (e.g., "Mat Pilates", 60 min, pick a color) | Service appears in the list with the selected color dot |
| O1.13 | Tap **Next** | Advances to Step 4 (Products) |
| O1.14 | Add at least one product (e.g., Single Session, ₱500) | Product appears in the list |
| O1.15 | Tap **Next** | Advances to Step 5 (Templates) |
| O1.16 | Select a service, pick days of the week, set a start time, tap Add Template | Template appears in the list |
| O1.17 | Tap **Next** | Advances to Step 6 (Instructors) |
| O1.18 | If instructor accounts exist, tap one to select them | Instructor row shows a filled checkmark; can select multiple |
| O1.19 | Tap **Next** | Advances to Step 7 (Generate) |
| O1.20 | Review the summary (studio name, rooms, services, products, templates, instructors, waitlist status) | All values reflect what was entered |
| O1.21 | Select **14 Days** or **28 Days** and tap **Complete Setup** | Loading state shows; on success, "Studio Created!" confirmation screen appears |
| O1.22 | Tap **View My Studios** | Redirected to owner Studios page; new studio card is visible |

---

### O2 · Studio Management (Edit Existing Studio)

**Pre-condition:** At least one studio exists (complete O1 first).

| # | Step | Expected Result |
|---|---|---|
| O2.1 | On the Studios page, tap the **pencil (edit) icon** on a studio card | Studio edit page opens |
| O2.2 | Change the studio name and tap **Save Changes** | Success state ("Saved ✓") appears briefly; name updates |
| O2.3 | Edit the description and save | Description updates |
| O2.4 | Change the address using the location picker and save | Address and map pin update |
| O2.5 | Toggle the waitlist switch and save | Toggle state persists after save |
| O2.6 | In the **Rooms** section, add a new room | New room appears in the list immediately |
| O2.7 | Delete an existing room using the × button | Room is removed from the list |
| O2.8 | In the **Services** section, add a new service type with a color | New service appears in the list |
| O2.9 | Delete an existing service type | Service is removed from the list |
| O2.10 | In the **Instructors** section, use the dropdown to add an instructor | Instructor appears in the tagged list |
| O2.11 | Remove an instructor using the × button | Instructor is removed from the list |
| O2.12 | Tap back (chevron) to return to Studios | Returns to studio list; changes are reflected on the studio card |

---

### O3 · Waitlist Toggle

**Pre-condition:** Studio exists with waitlist enabled.

| # | Step | Expected Result |
|---|---|---|
| O3.1 | On the Studios list, find the waitlist toggle on a studio card | Toggle is visible; green = enabled |
| O3.2 | Tap the toggle to disable waitlist | Toggle turns grey; change saves immediately |
| O3.3 | Log in as Customer and try to book a full session at this studio | No "Join Waitlist" option appears; session shows as "Full" |
| O3.4 | As Owner, re-enable the waitlist | Toggle turns green |
| O3.5 | As Customer, check the full session again | "Join Waitlist" option is now available |

---

### O4 · Owner Dashboard & Session Management

**Pre-condition:** Studio with sessions generated (complete O1 first).

| # | Step | Expected Result |
|---|---|---|
| O4.1 | Go to the **Home** tab as Owner | Dashboard shows today's sessions with a date strip |
| O4.2 | Tap a different date on the date strip | Sessions update to show that date's schedule |
| O4.3 | Tap a session to expand it | Shows attendee count, waitlist count, and instructor assignment |
| O4.4 | Assign an instructor to a session using the dropdown | Instructor name appears on the session; saves immediately |
| O4.5 | Remove the instructor assignment | Session shows as unassigned |
| O4.6 | Go to **Bookings** tab | Shows Confirmed and Cancelled stats; sessions with bookings appear in the Upcoming/Past tabs |
| O4.7 | Tab between **Upcoming** and **Past** | List filters correctly by session date/time |
| O4.8 | Each session card shows confirmed count and spots filled (e.g., "2/12 spots filled") | Counts are accurate |

---

## Persona 2 — Instructor

> **Pre-condition for all Instructor scenarios:** Owner has tagged this instructor account to at least one studio (O1 step O1.17–O1.18, or via O2 step O2.10).

### I1 · View Assigned Studios

| # | Step | Expected Result |
|---|---|---|
| I1.1 | Log in as Instructor | Directed to Instructor home page |
| I1.2 | Go to the **Studios** tab | Shows only studios this instructor has been tagged to |
| I1.3 | Tap a studio | Opens the studio's session view |
| I1.4 | Navigate to a studio that this instructor is NOT tagged to (by URL) | Should not show in their list; access is restricted |

---

### I2 · Claim & Unclaim Sessions

**Pre-condition:** Instructor is tagged to a studio with generated sessions.

| # | Step | Expected Result |
|---|---|---|
| I2.1 | On the instructor's studio page, browse to a date with sessions | Sessions are listed with time, service type, and capacity |
| I2.2 | Tap **Claim** on an unassigned session | Session updates to show the instructor's name; button changes to **Unclaim** |
| I2.3 | Tap **Unclaim** on a session they own | Session becomes unassigned; button reverts to **Claim** |
| I2.4 | View a session assigned to a different instructor | No Claim/Unclaim button visible; session is read-only |
| I2.5 | As Owner, verify the claimed session on the dashboard | Owner's dashboard reflects the instructor assignment |

---

## Persona 3 — Customer

### C1 · Browse Studios

| # | Step | Expected Result |
|---|---|---|
| C1.1 | Log in as Customer | Directed to customer home/studios page |
| C1.2 | The page defaults to **List view** | Studio cards are visible with name, description, address, service type chips, and a left-border color accent |
| C1.3 | Type in the search bar (e.g., studio name or a service like "Pilates") | List filters in real-time; matching studios shown |
| C1.4 | Clear the search using the × button | Full list restores |
| C1.5 | Tap a **service type chip** (e.g., "Pilates") | List filters to studios offering that service |
| C1.6 | Tap the active chip again | Filter clears; full list shown |
| C1.7 | Search + apply a chip filter simultaneously | Both filters apply together |
| C1.8 | Search for something that matches no studios | "No studios found" empty state appears with a "Clear filters" link |
| C1.9 | Tap **Clear filters** | Search and chip filter both reset |
| C1.10 | Tap the **Map** toggle | View switches to full-height map with studio pins |
| C1.11 | Tap a studio pin on the map | Info window appears with studio name, address, and "View studio →" link |
| C1.12 | Tap "View studio →" | Navigates to the studio detail page |
| C1.13 | Switch back to **List** view | List view restores with previous state (search/filters cleared) |

---

### C2 · Book a Session

**Pre-condition:** At least one studio with upcoming sessions exists.

| # | Step | Expected Result |
|---|---|---|
| C2.1 | Tap a studio card from the list | Studio detail page opens showing name, address, description |
| C2.2 | Browse to a date with available sessions using the date strip | Sessions appear as cards with service type, time, spots available |
| C2.3 | Filter by service type using the chips | Only sessions of that type are shown |
| C2.4 | Tap an available session | Booking bottom sheet slides up |
| C2.5 | Review session details in the sheet (studio name, date, time, instructor if assigned) | Information is accurate |
| C2.6 | Tap **Confirm Booking** | Booking is created; sheet closes; session card updates (booked count increases; "Booked" indicator appears) |
| C2.7 | Attempt to tap the same session again | Sheet shows a **Cancel Booking** option instead of Confirm |

---

### C3 · Cancel a Booking

**Pre-condition:** Customer has at least one confirmed booking (complete C2 first).

| # | Step | Expected Result |
|---|---|---|
| C3.1 | Tap a session the customer has already booked | Bottom sheet opens showing "Cancel Booking" |
| C3.2 | Tap **Cancel Booking** | Booking is cancelled; session card updates (booked count decreases; "Booked" indicator removed) |
| C3.3 | Go to the **Bookings** tab | Cancelled booking appears in booking history |
| C3.4 | Try to cancel a session starting in less than 60 minutes | Cancellation is blocked with an error message (booking cutoff policy) |

---

### C4 · Waitlist

**Pre-condition:** A session is at full capacity (all spots booked). Waitlist is enabled on the studio.

| # | Step | Expected Result |
|---|---|---|
| C4.1 | Tap a full session | Bottom sheet shows "Join Waitlist" option |
| C4.2 | Tap **Join Waitlist** | Confirmation; session card shows waitlist indicator |
| C4.3 | Tap the session again | Sheet shows "Leave Waitlist" option |
| C4.4 | Tap **Leave Waitlist** | Removed from waitlist; sheet reverts to "Join Waitlist" |
| C4.5 | As Owner, simulate an opening from the dashboard (offer spot) | — |
| C4.6 | As Customer, check the Bookings tab — a waitlist offer should appear | Offer banner/card visible with an **Accept** button and expiry time |
| C4.7 | Tap **Accept** | Booking is confirmed; customer moves from waitlist to confirmed |

---

### C5 · Booking History

| # | Step | Expected Result |
|---|---|---|
| C5.1 | Go to the **Bookings** tab | Page shows Upcoming, Past, and Calendar tabs |
| C5.2 | Check **Upcoming** tab | Shows confirmed bookings for future sessions |
| C5.3 | Check **Past** tab | Shows bookings for sessions that have already passed |
| C5.4 | Tap the **Calendar** tab | Calendar view with monthly navigation; days with bookings are highlighted |
| C5.5 | Tap a highlighted date | Shows bookings for that day |

---

## General / Cross-Persona

### G1 · Authentication & Onboarding

| # | Step | Expected Result |
|---|---|---|
| G1.1 | Open https://estudyo.vercel.app | Landing/sign-in page loads |
| G1.2 | Sign in with Google | OAuth flow completes; redirected to onboarding if first time |
| G1.3 | Select a role (Customer / Studio Owner / Instructor) | Redirected to the correct persona's home screen |
| G1.4 | Sign out and sign back in | Directed straight to the role's home screen (onboarding skipped) |
| G1.5 | Sign in on a different browser/device | Same role and data are intact |

---

### G2 · Edge Cases & Error Handling

| # | Step | Expected Result |
|---|---|---|
| G2.1 | Try to book a session that starts in less than 60 minutes | Booking is blocked; error message shown |
| G2.2 | Customer tries to access `/owner/studios` directly | Redirected away (access denied or redirect to customer home) |
| G2.3 | Instructor tries to access `/owner/setup` directly | Redirected away |
| G2.4 | Owner tries to access `/instructor/studios` directly | Redirected away |
| G2.5 | Studio with no sessions for a selected date | "No sessions" empty state shown on the date |
| G2.6 | Studio description is empty | No blank space or broken layout — description section is hidden gracefully |
| G2.7 | Studio has no coordinates (no map pin) | Studio does not appear as a pin on the map; everything else renders normally |

---

## Reporting Issues

When reporting a bug, please include:
1. **Persona** (Owner / Instructor / Customer)
2. **Test case #** (e.g., C2.6)
3. **What happened** vs **what was expected**
4. **Screenshot or screen recording** if possible
5. **Browser and device** (e.g., Safari on iPhone 15, Chrome on Android)
