import type {
  AccessCredentialBinding,
  AccessDeviceSnapshot,
  AccessEventFeedItem,
  AccessOverview,
  AccessPresenceGroup,
  PresenceSessionRecord,
} from "@gymrats/types";

function toDateOrNull(value: unknown) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeAccessDevice(
  device: AccessDeviceSnapshot,
): AccessDeviceSnapshot {
  return {
    ...device,
    lastHeartbeatAt: toDateOrNull(device.lastHeartbeatAt),
    lastEventAt: toDateOrNull(device.lastEventAt),
    createdAt: toDateOrNull(device.createdAt) ?? new Date(),
    updatedAt: toDateOrNull(device.updatedAt) ?? new Date(),
  };
}

export function normalizeAccessFeedItem(
  event: AccessEventFeedItem,
): AccessEventFeedItem {
  return {
    ...event,
    occurredAt: toDateOrNull(event.occurredAt) ?? new Date(),
  };
}

export function normalizePresenceSession(
  session: PresenceSessionRecord,
): PresenceSessionRecord {
  return {
    ...session,
    entryAt: toDateOrNull(session.entryAt) ?? new Date(),
    exitAt: toDateOrNull(session.exitAt),
  };
}

export function normalizeAccessPresence(
  presence: AccessPresenceGroup,
): AccessPresenceGroup {
  return {
    students: presence.students.map(normalizePresenceSession),
    personals: presence.personals.map(normalizePresenceSession),
  };
}

export function normalizeAccessBinding(
  binding: AccessCredentialBinding,
): AccessCredentialBinding {
  return {
    ...binding,
    createdAt: toDateOrNull(binding.createdAt) ?? new Date(),
    updatedAt: toDateOrNull(binding.updatedAt) ?? new Date(),
  };
}

export function normalizeAccessOverview(
  overview: AccessOverview,
): AccessOverview {
  return {
    ...overview,
    recentFeed: overview.recentFeed.map(normalizeAccessFeedItem),
  };
}
