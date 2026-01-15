# Database Schema (Suggested)

This document outlines the suggested database tables for a production implementation.

## Core Entities

### users
- id (uuid, pk)
- email (varchar, unique)
- name (varchar)
- avatar_url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

### user_roles
- user_id (uuid, fk -> users)
- role (enum: CUSTOMER, INSTRUCTOR, OWNER, ADMIN)
- PRIMARY KEY (user_id, role)

### customer_profiles
- user_id (uuid, pk, fk -> users)
- phone (varchar, nullable)
- emergency_contact (text, nullable)
- notification_email (boolean, default true)
- notification_push (boolean, default true)
- notification_sms (boolean, default false)

### instructor_profiles
- user_id (uuid, pk, fk -> users)
- bio (text, nullable)
- specialties (text[])

## Studio Domain

### studios
- id (uuid, pk)
- name (varchar)
- description (text)
- address (text)
- image_url (text, nullable)
- owner_id (uuid, fk -> users)
- created_at (timestamp)

### rooms
- id (uuid, pk)
- studio_id (uuid, fk -> studios)
- name (varchar)
- capacity (int)

### service_types
- id (uuid, pk)
- studio_id (uuid, fk -> studios)
- name (varchar)
- description (text)
- color (varchar) -- sage, clay, blush, sky
- duration_minutes (int)

### instructor_studios
- instructor_id (uuid, fk -> users)
- studio_id (uuid, fk -> studios)
- PRIMARY KEY (instructor_id, studio_id)

## Sessions

### session_templates
- id (uuid, pk)
- studio_id (uuid, fk -> studios)
- service_type_id (uuid, fk -> service_types)
- room_id (uuid, fk -> rooms)
- instructor_id (uuid, fk -> users)
- day_of_week (int) -- 0-6
- start_time (time)
- default_capacity (int)

### sessions
- id (uuid, pk)
- studio_id (uuid, fk -> studios)
- service_type_id (uuid, fk -> service_types)
- room_id (uuid, fk -> rooms)
- instructor_id (uuid, fk -> users)
- template_id (uuid, fk -> session_templates, nullable)
- date (date)
- start_time (time)
- end_time (time)
- capacity (int)
- booked_count (int, default 0)
- waitlist_count (int, default 0)
- status (enum: SCHEDULED, CANCELLED, COMPLETED)

## Products & Payments

### products
- id (uuid, pk)
- studio_id (uuid, fk -> studios)
- type (enum: SINGLE_SESSION, CREDIT_PACK, PACKAGE, MEMBERSHIP)
- name (varchar)
- description (text)
- price (decimal)
- credits (int, nullable)
- session_count (int, nullable)
- valid_days (int, nullable)
- is_active (boolean, default true)

### product_service_types
- product_id (uuid, fk -> products)
- service_type_id (uuid, fk -> service_types)
- PRIMARY KEY (product_id, service_type_id)

### payments
- id (uuid, pk)
- user_id (uuid, fk -> users)
- amount (decimal)
- status (enum: PENDING, COMPLETED, FAILED, REFUNDED)
- method (enum: CARD, CASH, TRANSFER)
- provider_ref (varchar, nullable)
- created_at (timestamp)

### purchases
- id (uuid, pk)
- user_id (uuid, fk -> users)
- product_id (uuid, fk -> products)
- payment_id (uuid, fk -> payments)
- amount (decimal)
- purchased_at (timestamp)

## Entitlements

### entitlements
- id (uuid, pk)
- user_id (uuid, fk -> users)
- type (enum: CREDITS, PACKAGE, MEMBERSHIP)
- product_id (uuid, fk -> products)
- remaining (int)
- expires_at (timestamp, nullable)

### entitlement_service_types
- entitlement_id (uuid, fk -> entitlements)
- service_type_id (uuid, fk -> service_types)
- PRIMARY KEY (entitlement_id, service_type_id)

## Bookings

### bookings
- id (uuid, pk)
- user_id (uuid, fk -> users)
- session_id (uuid, fk -> sessions)
- status (enum: CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
- booked_at (timestamp)
- cancelled_at (timestamp, nullable)
- charge_id (uuid, fk -> booking_charges)

### booking_charges
- id (uuid, pk)
- booking_id (uuid, fk -> bookings)
- entitlement_id (uuid, fk -> entitlements)
- units_used (int)

## Waitlist

### waitlist_entries
- id (uuid, pk)
- user_id (uuid, fk -> users)
- session_id (uuid, fk -> sessions)
- status (enum: WAITING, OFFERED, ACCEPTED, EXPIRED, CANCELLED)
- position (int)
- joined_at (timestamp)
- offered_at (timestamp, nullable)
- offer_expires_at (timestamp, nullable)
- accepted_at (timestamp, nullable)

## Notifications

### notification_events
- id (uuid, pk)
- user_id (uuid, fk -> users)
- type (varchar)
- title (varchar)
- message (text)
- read (boolean, default false)
- data (jsonb, nullable)
- created_at (timestamp)

## Indexes (Recommended)

- sessions: (studio_id, date), (instructor_id, date)
- bookings: (user_id, status), (session_id, status)
- waitlist_entries: (session_id, status, position)
- entitlements: (user_id, remaining)
- notification_events: (user_id, read, created_at DESC)
