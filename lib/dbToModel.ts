// Helpers to convert DB rows to domain model types

import type { Studio, Session, ServiceType, Room, Product } from '@/types/domain'

type DbStudio = {
  id: string
  name: string
  description: string
  address: string
  imageUrl: string | null
  coordLat: number | null
  coordLng: number | null
  timezone: string
  waitlistEnabled: boolean
  ownerId: string
  createdAt: Date
  rooms?: DbRoom[]
  serviceTypes?: DbServiceType[]
}

type DbRoom = { id: string; studioId: string; name: string; capacity: number }

type DbServiceType = {
  id: string
  studioId: string
  name: string
  description: string
  color: string
  durationMinutes: number
}

type DbClassSession = {
  id: string
  studioId: string
  serviceTypeId: string
  roomId: string
  instructorId: string
  date: Date
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  waitlistCount: number
  status: string
}

type DbProduct = {
  id: string
  studioId: string
  type: string
  name: string
  description: string
  price: number
  credits: number | null
  sessionCount: number | null
  validDays: number | null
  serviceTypeIds: string
}

export function studioFromDb(s: DbStudio): Studio {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    address: s.address,
    imageUrl: s.imageUrl ?? undefined,
    coordinates: s.coordLat != null && s.coordLng != null
      ? { lat: s.coordLat, lng: s.coordLng }
      : undefined,
    waitlistEnabled: s.waitlistEnabled,
    ownerId: s.ownerId,
    serviceTypes: (s.serviceTypes ?? []).map(serviceTypeFromDb),
    rooms: (s.rooms ?? []).map(roomFromDb),
    createdAt: s.createdAt,
  }
}

export function roomFromDb(r: DbRoom): Room {
  return { id: r.id, studioId: r.studioId, name: r.name, capacity: r.capacity }
}

export function serviceTypeFromDb(st: DbServiceType): ServiceType {
  return {
    id: st.id,
    studioId: st.studioId,
    name: st.name,
    description: st.description,
    color: st.color as ServiceType['color'],
    durationMinutes: st.durationMinutes,
  }
}

export function sessionFromDb(s: DbClassSession): Session {
  return {
    id: s.id,
    studioId: s.studioId,
    serviceTypeId: s.serviceTypeId,
    roomId: s.roomId,
    instructorId: s.instructorId,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    bookedCount: s.bookedCount,
    waitlistCount: s.waitlistCount,
    status: s.status as Session['status'],
  }
}

export function productFromDb(p: DbProduct): Product {
  return {
    id: p.id,
    studioId: p.studioId,
    type: p.type as Product['type'],
    name: p.name,
    description: p.description,
    price: p.price,
    credits: p.credits ?? undefined,
    sessionCount: p.sessionCount ?? undefined,
    validDays: p.validDays ?? undefined,
    serviceTypeIds: JSON.parse(p.serviceTypeIds ?? '[]'),
  }
}
