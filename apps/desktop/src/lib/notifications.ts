import { getSetting, setSetting } from './api';

export type NotificationCategory = 'compilation' | 'system' | 'project' | 'updates' | 'errors';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  message: string;
  createdAt: string;
  read: boolean;
}

const STORE_KEY = 'notifications_v1';
export const NOTIFICATION_SETTINGS_KEY = 'notification_settings_v1';
const MAX_STORED = 50;

export type NotificationSettings = Record<NotificationCategory, boolean>;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  compilation: true,
  system: true,
  project: true,
  updates: true,
  errors: true,
};

export async function loadNotifications(): Promise<AppNotification[]> {
  try {
    const raw = await getSetting(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveNotifications(list: AppNotification[]): Promise<void> {
  await setSetting(STORE_KEY, JSON.stringify(list.slice(0, MAX_STORED)));
}

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await getSetting(NOTIFICATION_SETTINGS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await setSetting(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

/** Unique-enough id without Date.now()'s monotonicity assumptions — this app
 * never needs cross-session ordering guarantees beyond "roughly newest first". */
export function newNotificationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
