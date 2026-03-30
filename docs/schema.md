# Estudyo — Database Schema

> **Auto-generated** from `prisma/schema.prisma` on 2026-03-30.
> To regenerate manually: `node scripts/generate-schema-docs.mjs`

---

## Auth

### Account

  - **id** `String` — default: `cuid(` 🔑
  - **userId** `String`
  - **type** `String`
  - **provider** `String`
  - **providerAccountId** `String`
  - **refresh_token** `String?`
  - **access_token** `String?`
  - **expires_at** `Int?`
  - **token_type** `String?`
  - **scope** `String?`
  - **id_token** `String?`
  - **session_state** `String?`

  **Relations**
  - **user** *User*

### Session

  - **id** `String` — default: `cuid(` 🔑
  - **sessionToken** `String`
  - **userId** `String`
  - **expires** `DateTime`

  **Relations**
  - **user** *User*

### User

  - **id** `String` — default: `cuid(` 🔑
  - **name** `String?`
  - **email** `String?`
  - **emailVerified** `DateTime?`
  - **image** `String?`
  - **role** `String` — default: `"CUSTOMER"`
  - **onboarded** `Boolean` — default: `false`
  - **createdAt** `DateTime` — default: `now(`
  - **updatedAt** `DateTime`

  **Relations**
  - **accounts** *Account[]*
  - **sessions** *Session[]*
  - **bookings** *Booking[]*
  - **entitlements** *Entitlement[]*
  - **waitlist** *WaitlistEntry[]*

### VerificationToken

  - **identifier** `String`
  - **token** `String`
  - **expires** `DateTime`

---

## Studio Catalog

### Studio

  - **id** `String` — default: `cuid(` 🔑
  - **name** `String`
  - **description** `String` — default: `""`
  - **address** `String` — default: `""`
  - **imageUrl** `String?`
  - **coordLat** `Float?`
  - **coordLng** `Float?`
  - **timezone** `String` — default: `"UTC"`
  - **waitlistEnabled** `Boolean` — default: `true`
  - **ownerId** `String`
  - **createdAt** `DateTime` — default: `now(`
  - **updatedAt** `DateTime`

  **Relations**
  - **rooms** *Room[]*
  - **serviceTypes** *ServiceType[]*
  - **products** *Product[]*
  - **classSessions** *ClassSession[]*
  - **instructors** *StudioInstructor[]*

### StudioInstructor

  - **studioId** `String`
  - **instructorId** `String`
  - **addedAt** `DateTime` — default: `now(`

  **Relations**
  - **studio** *Studio*

### Room

  - **id** `String` — default: `cuid(` 🔑
  - **studioId** `String`
  - **name** `String`
  - **capacity** `Int`

  **Relations**
  - **studio** *Studio*
  - **classSessions** *ClassSession[]*

### ServiceType

  - **id** `String` — default: `cuid(` 🔑
  - **studioId** `String`
  - **name** `String`
  - **description** `String` — default: `""`
  - **color** `String` — default: `"sage"`
  - **durationMinutes** `Int`

  **Relations**
  - **studio** *Studio*
  - **classSessions** *ClassSession[]*
  - **templates** *SessionTemplate[]*

### Product

  - **id** `String` — default: `cuid(` 🔑
  - **studioId** `String`
  - **type** `String`
  - **name** `String`
  - **description** `String` — default: `""`
  - **price** `Int`
  - **credits** `Int?`
  - **sessionCount** `Int?`
  - **validDays** `Int?`
  - **serviceTypeIds** `String` — default: `"[]"`
  - **isActive** `Boolean` — default: `true`
  - **createdAt** `DateTime` — default: `now(`

  **Relations**
  - **studio** *Studio*

### SessionTemplate

  - **id** `String` — default: `cuid(` 🔑
  - **studioId** `String`
  - **serviceTypeId** `String`
  - **roomId** `String`
  - **instructorId** `String` — default: `""`
  - **daysOfWeek** `String` — default: `"[]"`
  - **startTime** `String`
  - **capacityOverride** `Int?`
  - **isActive** `Boolean` — default: `true`
  - **createdAt** `DateTime` — default: `now(`

  **Relations**
  - **serviceType** *ServiceType*

---

## Sessions & Bookings

### ClassSession

  - **id** `String` — default: `cuid(` 🔑
  - **studioId** `String`
  - **serviceTypeId** `String`
  - **roomId** `String`
  - **instructorId** `String` — default: `""`
  - **templateId** `String?`
  - **date** `DateTime`
  - **startTime** `String`
  - **endTime** `String`
  - **capacity** `Int`
  - **bookedCount** `Int` — default: `0`
  - **waitlistCount** `Int` — default: `0`
  - **status** `String` — default: `"SCHEDULED"`
  - **createdAt** `DateTime` — default: `now(`

  **Relations**
  - **studio** *Studio*
  - **serviceType** *ServiceType*
  - **room** *Room*

### Booking

  - **id** `String` — default: `cuid(` 🔑
  - **userId** `String`
  - **sessionId** `String`
  - **status** `String` — default: `"CONFIRMED"`
  - **bookedAt** `DateTime` — default: `now(`
  - **cancelledAt** `DateTime?`
  - **chargeId** `String` — default: `""`

  **Relations**
  - **user** *User*

### Entitlement

  - **id** `String` — default: `cuid(` 🔑
  - **userId** `String`
  - **type** `String`
  - **productId** `String`
  - **remaining** `Int`
  - **serviceTypeIds** `String` — default: `"[]"`
  - **expiresAt** `DateTime?`
  - **createdAt** `DateTime` — default: `now(`

  **Relations**
  - **user** *User*

### WaitlistEntry

  - **id** `String` — default: `cuid(` 🔑
  - **userId** `String`
  - **sessionId** `String`
  - **status** `String` — default: `"WAITING"`
  - **position** `Int`
  - **joinedAt** `DateTime` — default: `now(`
  - **offeredAt** `DateTime?`
  - **offerExpiresAt** `DateTime?`
  - **acceptedAt** `DateTime?`

  **Relations**
  - **user** *User*


---

## Relationships at a Glance

```
User ──────────────┬── owns ──────────▶ Studio
                   ├── tagged to ─────▶ StudioInstructor ──▶ Studio
                   ├── books ─────────▶ Booking ──────────▶ ClassSession
                   ├── holds ─────────▶ Entitlement
                   └── queues ────────▶ WaitlistEntry ────▶ ClassSession

Studio ────────────┬──▶ Room[]
                   ├──▶ ServiceType[]
                   ├──▶ Product[]
                   ├──▶ SessionTemplate[]
                   └──▶ ClassSession[]

SessionTemplate ──────▶ ClassSession[]   (sessions generated from template)
```

---

## Notes for Future Development

- **`Booking.chargeId`** — placeholder field, ready for payment gateway integration.
- **`Entitlement` / `Product`** — fully modelled; credits gate is currently bypassed in the UI. Re-enabling it requires only a UI config change, not a schema change.
- **`serviceTypeIds`** on `Product` and `Entitlement` — stored as JSON strings. Consider normalising into join tables if per-service-type filtering becomes a requirement.
- **`ClassSession.instructorId`** — plain `String` (not a FK) so sessions survive instructor account deletion.
- **`WaitlistEntry.status`** values: `WAITING` → `OFFERED` → `ACCEPTED` / `EXPIRED`.
