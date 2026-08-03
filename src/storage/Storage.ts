import type { GameMode } from '../config';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  shakeSensitivity: 'low' | 'medium' | 'high';
  hapticFeedback: boolean;
}

export interface LeaderboardEntry {
  mode: GameMode;
  score: number;
  date: string;
}

const SETTINGS_KEY = 'kolormix_settings';
const LEADERBOARD_KEY = 'kolormix_leaderboard';
const PB_KEY = 'kolormix_pb';

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  shakeSensitivity: 'medium',
  hapticFeedback: true,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveScore(mode: GameMode, score: number): LeaderboardEntry[] {
  const entries = loadLeaderboard();
  entries.push({ mode, score, date: new Date().toISOString() });
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function getPersonalBest(mode: GameMode): number {
  try {
    const raw = localStorage.getItem(PB_KEY);
    if (!raw) return 0;
    const pb: Record<string, number> = JSON.parse(raw);
    return pb[mode] ?? 0;
  } catch {
    return 0;
  }
}

export function updatePersonalBest(mode: GameMode, score: number): boolean {
  const current = getPersonalBest(mode);
  if (score <= current) return false;
  const raw = localStorage.getItem(PB_KEY);
  const pb: Record<string, number> = raw ? JSON.parse(raw) : {};
  pb[mode] = score;
  localStorage.setItem(PB_KEY, JSON.stringify(pb));
  return true;
}
