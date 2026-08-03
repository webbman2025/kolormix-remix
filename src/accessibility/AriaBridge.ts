import { CONFIG } from '../config';

export function announce(message: string, assertive = false): void {
  const el = document.getElementById('aria-live');
  if (!el) return;
  el.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

export function setGridAriaLabel(label: string): void {
  const container = document.getElementById('game-container');
  if (container) {
    container.setAttribute('aria-label', label);
  }
}

export function announceTimer(seconds: number): void {
  announce(`${seconds} seconds remaining`);
}

export function announceMerge(result: string, score: number): void {
  announce(`Merged to ${result}. Score ${score}.`);
}

export function announceCombo(): void {
  announce('Combo! 3 merges. Bonus 50 points.', true);
}

export function announceBonusTime(): void {
  announce('Bonus time! 15 seconds added.', true);
}

export function announceGameOver(score: number): void {
  announce(`Game over. Final score ${score}.`, true);
}

export function setupShakeBridge(onShake: () => void, enabled: () => boolean): void {
  window.onDeviceShake = () => {
    if (enabled()) onShake();
  };

  if (typeof window !== 'undefined' && !window.onDeviceShake) {
    let lastShake = 0;
    const threshold = 15;

    window.addEventListener('devicemotion', (e) => {
      if (!enabled()) return;
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt(
        (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2,
      );
      const now = Date.now();
      if (magnitude > threshold && now - lastShake > 1000) {
        lastShake = now;
        onShake();
      }
    });
  }
}

export const SWIPE_THRESHOLD = CONFIG.SWIPE_THRESHOLD_PX;
