import { CONFIG } from '../config';

export class Shake {
  usesRemaining: number;

  constructor(maxUses = CONFIG.SHAKE_MAX_USES) {
    this.usesRemaining = maxUses;
  }

  canShake(): boolean {
    return this.usesRemaining > 0;
  }

  use(): boolean {
    if (!this.canShake()) return false;
    this.usesRemaining--;
    return true;
  }

  reset(maxUses = CONFIG.SHAKE_MAX_USES): void {
    this.usesRemaining = maxUses;
  }
}
