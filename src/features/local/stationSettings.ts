import type { StationIdentity, StationRole } from './localApi';

const STORAGE_KEY = 'healthcall:station:v1';
const DISPLAY_STORAGE_KEY = 'healthcall:display:v1';

export type StationSettings = StationIdentity & {
  soundEnabled: boolean;
  voiceEnabled: boolean;
};

export type LocalDisplayPreferences = {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  noticesEnabled: boolean;
};

export const DEFAULT_STATION_SETTINGS: StationSettings = {
  name: '',
  role: 'Médico',
  room: '',
  soundEnabled: true,
  voiceEnabled: true,
};

export const DEFAULT_DISPLAY_PREFERENCES: LocalDisplayPreferences = {
  soundEnabled: true,
  voiceEnabled: true,
  noticesEnabled: true,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function getStationSettings(): StationSettings {
  return readJson(STORAGE_KEY, DEFAULT_STATION_SETTINGS);
}

export function saveStationSettings(settings: StationSettings): StationSettings {
  const normalized: StationSettings = {
    ...settings,
    name: settings.name.trim(),
    room: settings.room.trim(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('healthcall:station-settings', { detail: normalized }));
  return normalized;
}

export function getStationIdentity(): StationIdentity {
  const { name, role, room } = getStationSettings();
  return { name, role, room };
}

export function getStationDestination(): string {
  const { room } = getStationSettings();
  return room ? `Sala ${room}` : '';
}

export function getDisplayPreferences(): LocalDisplayPreferences {
  return readJson(DISPLAY_STORAGE_KEY, DEFAULT_DISPLAY_PREFERENCES);
}

export function saveDisplayPreferences(preferences: LocalDisplayPreferences): LocalDisplayPreferences {
  window.localStorage.setItem(DISPLAY_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent('healthcall:display-preferences', { detail: preferences }));
  return preferences;
}

export const STATION_ROLES: StationRole[] = ['Médico', 'Enfermagem', 'Recepção', 'Outro'];
