export interface AccessibilityPrefs {
  highContrast: boolean;
  shapeOverlays: boolean;
  reducedMotion: boolean;
  shakeEnabled: boolean;
  tapOnlyMode: boolean;
  screenReaderOptimized: boolean;
}

const STORAGE_KEY = 'kolormix_a11y';

const DEFAULTS: AccessibilityPrefs = {
  highContrast: false,
  shapeOverlays: false,
  reducedMotion: false,
  shakeEnabled: true,
  tapOnlyMode: false,
  screenReaderOptimized: true,
};

export function loadAccessibilityPrefs(): AccessibilityPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAccessibilityPrefs(prefs: AccessibilityPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export class ContrastMode {
  prefs: AccessibilityPrefs;

  constructor() {
    this.prefs = loadAccessibilityPrefs();
  }

  isHighContrast(): boolean {
    return this.prefs.highContrast;
  }

  showShapes(): boolean {
    return this.prefs.shapeOverlays || this.prefs.highContrast;
  }

  isReducedMotion(): boolean {
    return this.prefs.reducedMotion;
  }

  isTapOnly(): boolean {
    return this.prefs.tapOnlyMode;
  }

  isShakeEnabled(): boolean {
    return this.prefs.shakeEnabled && !this.prefs.tapOnlyMode;
  }

  update(partial: Partial<AccessibilityPrefs>): void {
    this.prefs = { ...this.prefs, ...partial };
    saveAccessibilityPrefs(this.prefs);
  }
}
