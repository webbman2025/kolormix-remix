import Phaser from 'phaser';
import { CONFIG, type GameMode } from '../config';
import { Grid } from '../game/Grid';
import { Scoring } from '../game/Scoring';
import { Timer } from '../game/Timer';
import { Shake } from '../game/Shake';
import { RunStats } from '../game/RunStats';
import { randomMainSecondary } from '../game/Wildcard';
import {
  getRecipeLabel,
  isMergeAllowedForGoal,
  isPrimaryForGoal,
  isSecondary,
  merge,
} from '../game/ColorMixer';
import { ContrastMode } from '../accessibility/ContrastMode';
import {
  announce,
  announceBonusTime,
  announceCombo,
  announceGameOver,
  announceMerge,
  setupShakeBridge,
  SWIPE_THRESHOLD,
} from '../accessibility/AriaBridge';
import { createTimerBar, TimerBar } from '../ui/TimerBar';
import { ScoreDisplay } from '../ui/ScoreDisplay';
import { GameHeader } from '../ui/GameHeader';
import { PreviewRow } from '../ui/PreviewRow';
import { computeGameLayout, type GameLayout } from '../ui/GameLayout';
import { drawGameBackground } from '../ui/GameBackground';
import { drawGameChrome } from '../ui/GameChrome';
import {
  createGlossyTile,
  paintGlossyTile,
  type GlossyTileParts,
} from '../ui/GlossyTile';
import { spawnExplodeBurst, spawnMegaRewardBurst, spawnWildcardRingWave, flashWildcardReward, tweenTileExplode } from '../ui/ClearEffects';
import {
  getPersonalBest,
  saveScore,
  updatePersonalBest,
} from '../storage/Storage';
import type { Position, TileColor, TileMove, TileSpawn, WildcardSpawn } from '../types';

interface PointerStart {
  col: number;
  row: number;
  x: number;
  y: number;
}

interface GameSceneData {
  mode: GameMode;
}

export class GameScene extends Phaser.Scene {
  private mode: GameMode = 'timed';
  private grid!: Grid;
  private scoring = new Scoring();
  private runStats = new RunStats();
  private timer!: Timer;
  private shake = new Shake();
  private contrast = new ContrastMode();

  private selected: Position | null = null;
  private lastTap: { col: number; row: number; time: number } | null = null;
  private tileSprites: GlossyTileParts[][] = [];
  private pointerStart: PointerStart | null = null;
  private layout!: GameLayout;
  private backgroundObjects: Phaser.GameObjects.GameObject[] = [];
  private chromeObjects: Phaser.GameObjects.GameObject[] = [];
  private trialPbText: Phaser.GameObjects.Text | null = null;
  private busy = false;
  private paused = false;
  private comboIdleTimer: Phaser.Time.TimerEvent | null = null;

  private timerBar!: TimerBar;
  private scoreDisplay!: ScoreDisplay;
  private header!: GameHeader;
  private previewRow!: PreviewRow;
  private overlayGroup: Phaser.GameObjects.GameObject[] = [];
  private pendingWildcardSpawn = false;
  private wildcardRewardAnchor: Position | null = null;
  private wildcardRewardColor: TileColor | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.mode = data.mode ?? 'timed';
  }

  create(): void {
    this.layout = computeGameLayout(this.scale.width, this.scale.height);
    this.backgroundObjects = drawGameBackground(
      this,
      this.layout.width,
      this.layout.height,
    );
    this.chromeObjects = drawGameChrome(this, this.layout);

    this.grid = new Grid();
    this.scoring = new Scoring();
    this.runStats.reset();
    this.shake = new Shake();

    const hasTimer = this.mode !== 'classic';
    this.timer = new Timer({
      onWarning30: () => {
        this.timerBar.setWarning();
        announce('30 seconds remaining.');
      },
      onCritical10: () => {
        this.timerBar.setCritical();
        announce('Warning. 10 seconds remaining.', true);
      },
      onBonusAwarded: () => {
        this.timerBar.pulse();
        announceBonusTime();
      },
      onExpire: () => this.endGame('Time up!'),
    });

    if (hasTimer) this.timer.start();

    this.header = new GameHeader(this, this.layout, () => this.togglePauseMenu(), () =>
      this.handleShake(),
    );
    this.header.setShakeUses(this.shake.usesRemaining);

    this.scoreDisplay = new ScoreDisplay(this, this.layout);
    this.scoreDisplay.setScore(0);
    this.previewRow = new PreviewRow(this, this.layout);

    this.timerBar = createTimerBar(this, this.layout);
    this.timerBar.setActive(hasTimer);
    if (hasTimer) {
      this.timerBar.updateProgress(this.timer.getProgress());
    }

    this.buildTileSprites();
    this.setupPointerUp();
    setupShakeBridge(() => this.handleShake(), () =>
      this.contrast.isShakeEnabled() && !this.busy && !this.paused,
    );

    if (this.mode === 'trial') {
      const pb = getPersonalBest('trial');
      this.trialPbText = this.add
        .text(
          this.layout.width / 2,
          this.layout.previewY + Math.round(36 * this.layout.uiScale),
          `PB: ${String(pb).padStart(8, '0')}`,
          {
            fontFamily: 'monospace',
            fontSize: `${Math.round(11 * this.layout.uiScale)}px`,
            color: '#ffcc00',
          },
        )
        .setOrigin(0.5)
        .setDepth(20);
    }

    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.layout = computeGameLayout(gameSize.width, gameSize.height);
    this.backgroundObjects.forEach((object) => object.destroy());
    this.chromeObjects.forEach((object) => object.destroy());
    this.backgroundObjects = drawGameBackground(
      this,
      this.layout.width,
      this.layout.height,
    );
    this.chromeObjects = drawGameChrome(this, this.layout);
    this.applyLayout();
  }

  private applyLayout(): void {
    this.header.applyLayout(this.layout);
    this.scoreDisplay.applyLayout(this.layout);
    this.previewRow.applyLayout(this.layout);
    this.timerBar.applyLayout(this.layout);
    this.timerBar.setActive(this.mode !== 'classic');
    if (this.mode !== 'classic') {
      this.timerBar.updateProgress(this.timer.getProgress());
    }
    this.relayoutTiles();
    this.trialPbText?.setPosition(
      this.layout.width / 2,
      this.layout.previewY + Math.round(36 * this.layout.uiScale),
    );
    this.trialPbText?.setFontSize(Math.round(11 * this.layout.uiScale));
  }

  private relayoutTiles(): void {
    const { gridLeft, gridTop, tileSize, tileGap } = this.layout;
    const startX = gridLeft + tileSize / 2;

    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const x = startX + col * (tileSize + tileGap);
        const y = gridTop + tileSize / 2 + row * (tileSize + tileGap);
        const parts = this.tileSprites[row][col];
        this.positionTile(parts, x, y, tileSize);
        this.paintCell(parts, col, row);
      }
    }
  }

  private positionTile(parts: GlossyTileParts, x: number, y: number, size: number): void {
    this.tweens.killTweensOf(parts.container);
    parts.container.setAlpha(1);
    parts.container.setScale(1);
    parts.container.setData('anchorX', x);
    parts.container.setData('anchorY', y);
    parts.container.setPosition(x, y);
    parts.hitArea.setSize(size, size);
  }

  private snapTileToAnchor(parts: GlossyTileParts): void {
    const x = parts.container.getData('anchorX') as number | undefined;
    const y = parts.container.getData('anchorY') as number | undefined;
    if (x === undefined || y === undefined) return;
    this.tweens.killTweensOf(parts.container);
    parts.container.setPosition(x, y);
  }

  private snapAllTilesToGrid(): void {
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        this.snapTileToAnchor(this.tileSprites[row][col]);
      }
    }
  }

  private getTilePosition(col: number, row: number): { x: number; y: number } {
    const { gridLeft, gridTop, tileSize, tileGap } = this.layout;
    const startX = gridLeft + tileSize / 2;
    return {
      x: startX + col * (tileSize + tileGap),
      y: gridTop + tileSize / 2 + row * (tileSize + tileGap),
    };
  }

  update(_time: number, delta: number): void {
    if (this.paused) return;

    if (this.mode !== 'classic') {
      this.timer.tick(performance.now());
      this.timerBar.updateProgress(this.timer.getProgress());
      this.timerBar.tick(delta, this.contrast.isReducedMotion());
    }
  }

  private buildTileSprites(): void {
    const { gridLeft, gridTop, tileSize, tileGap } = this.layout;
    const startX = gridLeft + tileSize / 2;

    this.tileSprites = [];
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      const rowSprites: GlossyTileParts[] = [];
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const x = startX + col * (tileSize + tileGap);
        const y = gridTop + tileSize / 2 + row * (tileSize + tileGap);
        rowSprites.push(this.createTile(x, y, col, row));
      }
      this.tileSprites.push(rowSprites);
    }
  }

  private createTile(x: number, y: number, col: number, row: number): GlossyTileParts {
    const parts = createGlossyTile(this, x, y, this.layout.tileSize);
    this.positionTile(parts, x, y, this.layout.tileSize);
    this.paintCell(parts, col, row);

    parts.hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.busy || this.paused) return;
      this.pointerStart = { col, row, x: pointer.x, y: pointer.y };
    });

    return parts;
  }

  private paintCell(
    parts: GlossyTileParts,
    col: number,
    row: number,
    clearableKeys?: Set<string>,
  ): void {
    const color = this.grid.getCell(col, row);
    const isSelected = this.selected?.col === col && this.selected?.row === row;
    const isValidTarget =
      !!this.selected &&
      !isSelected &&
      this.grid.isAdjacent(this.selected, { col, row }) &&
      !!color &&
      this.canMergeCells(this.selected, { col, row });
    const isClearable =
      clearableKeys?.has(`${col},${row}`) ??
      this.isClearable(col, row);

    paintGlossyTile(this, parts, this.layout.tileSize, color, {
      selected: isSelected,
      validTarget: isValidTarget,
      clearable: isClearable,
      wildcardBonus: this.grid.isWildcardBonus(col, row),
      wildcardReward: this.grid.isWildcardReward(col, row),
      highContrast: this.contrast.isHighContrast(),
    });
  }

  private setupPointerUp(): void {
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.busy || this.paused || !this.pointerStart) return;

      const { col, row, x, y } = this.pointerStart;
      this.pointerStart = null;

      const dx = pointer.x - x;
      const dy = pointer.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!this.contrast.isTapOnly() && dist >= SWIPE_THRESHOLD) {
        const target: Position = Math.abs(dx) > Math.abs(dy)
          ? { col: col + (dx > 0 ? 1 : -1), row }
          : { col, row: row + (dy > 0 ? 1 : -1) };
        if (this.grid.inBounds(target.col, target.row)) {
          this.tryMerge({ col, row }, target);
          return;
        }
      }

      this.handleTap(col, row);
    });
  }

  private refreshGrid(): void {
    this.snapAllTilesToGrid();
    const clearableKeys = this.grid.getClearableClusterKeys();
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        this.paintCell(this.tileSprites[row][col], col, row, clearableKeys);
      }
    }
  }

  private getCurrentGoal(): TileColor | null {
    return this.previewRow.getCurrentGoal();
  }

  private announceCurrentGoal(): void {
    const goal = this.getCurrentGoal();
    if (goal) announce(`Current goal: ${getRecipeLabel(goal)}. Mix that first.`);
  }

  private canMergeCells(from: Position, to: Position): boolean {
    const a = this.grid.getCell(from.col, from.row);
    const b = this.grid.getCell(to.col, to.row);
    if (!a || !b || isSecondary(a) || isSecondary(b)) return false;
    return isMergeAllowedForGoal(a, b, this.getCurrentGoal());
  }

  private selectTile(col: number, row: number): void {
    if (this.grid.isWildcardBonus(col, row)) {
      this.tryOpenWildcardBonus(col, row);
      return;
    }
    if (this.grid.isWildcardReward(col, row)) {
      this.tryCollectWildcardReward(col, row);
      return;
    }
    const color = this.grid.getCell(col, row);
    if (!color || isSecondary(color) || !isPrimaryForGoal(color, this.getCurrentGoal())) {
      this.shakeTile(col, row);
      if (color && isSecondary(color)) {
        announce('Secondary tiles cannot be mixed. Double-tap 3+ of the same color to clear.');
      } else {
        this.announceCurrentGoal();
      }
      return;
    }
    this.selected = { col, row };
    this.refreshGrid();
    announce(this.grid.getAriaLabel(col, row) + ', selected');
  }

  private handleTap(col: number, row: number): void {
    const cluster = this.grid.getSameSecondaryCluster(col, row);
    const inRewardChain =
      this.grid.isWildcardReward(col, row) ||
      this.clusterTouchesWildcardReward(cluster);

    if (inRewardChain) {
      if (this.isDoubleTap(col, row)) {
        this.lastTap = null;
        if (this.tryDoubleTapClear(col, row)) return;
        this.shakeTile(col, row);
        return;
      }
      if (this.grid.isWildcardReward(col, row)) {
        if (this.tryCollectWildcardReward(col, row)) return;
        this.recordTap(col, row);
        return;
      }
    }

    if (this.grid.isWildcardBonus(col, row)) {
      if (this.tryOpenWildcardBonus(col, row)) return;
      return;
    }

    if (!this.grid.getCell(col, row)) return;

    if (this.isDoubleTap(col, row)) {
      this.lastTap = null;
      if (this.tryDoubleTapClear(col, row)) return;
      this.shakeTile(col, row);
      announce('Need 3 or more connected tiles of the same secondary color.');
      return;
    }
    this.recordTap(col, row);

    if (!this.selected) {
      this.selectTile(col, row);
      return;
    }

    if (this.selected.col === col && this.selected.row === row) {
      this.selected = null;
      this.refreshGrid();
      return;
    }

    if (!this.grid.isAdjacent(this.selected, { col, row })) {
      this.selectTile(col, row);
      return;
    }

    const merged = this.tryMerge(this.selected, { col, row });
    if (!merged) this.shakeTile(col, row);
  }

  private isDoubleTap(col: number, row: number): boolean {
    if (!this.lastTap) return false;
    const sameCell = this.lastTap.col === col && this.lastTap.row === row;
    const quick = performance.now() - this.lastTap.time < CONFIG.DOUBLE_TAP_MS;
    return sameCell && quick;
  }

  private recordTap(col: number, row: number): void {
    this.lastTap = { col, row, time: performance.now() };
  }

  private isClearable(col: number, row: number): boolean {
    if (this.grid.isWildcardBonus(col, row)) return false;
    const color = this.grid.getCell(col, row);
    if (!color || !isSecondary(color)) return false;
    return this.grid.getSameSecondaryCluster(col, row).length >= CONFIG.SECONDARY_CLEAR_MIN;
  }

  private clusterTouchesWildcardReward(cluster: Position[]): boolean {
    return this.grid.clusterHasWildcardReward(cluster);
  }

  private tryOpenWildcardBonus(col: number, row: number): boolean {
    if (!this.grid.isWildcardBonus(col, row) || this.busy) return false;

    const anchor = this.wildcardRewardAnchor ?? { col, row };
    this.grid.clearWildcardRewardFlags();
    const waves = this.grid.planWildcardBonusChain(anchor, { col, row });
    this.runStats.recordWildcardChain(waves.length);
    const spawns = waves.flat();
    if (spawns.length === 0) return false;

    this.wildcardRewardAnchor = null;
    this.wildcardRewardColor = null;
    this.selected = null;
    this.busy = true;

    const openBonus = this.scoring.recordWildcardCollect();
    this.scoreDisplay.setScore(this.scoring.score);
    const primaryColor = waves[0][0]?.color ?? spawns[0].color;
    if (waves.length > 1) {
      announce(
        `Wildcard chain! ${spawns.length} tiles appeared. Double-tap to collect!`,
        true,
      );
    } else {
      announce(
        `Wildcard! ${waves[0].length} ${primaryColor} tiles appeared. Tap any to collect!`,
        true,
      );
    }

    const tile = this.tileSprites[row][col];
    this.scoreDisplay.showFloat(
      tile.container.x,
      tile.container.y,
      `+${openBonus} ★×${spawns.length}`,
      this,
      this.layout.uiScale,
    );

    if (this.contrast.isReducedMotion()) {
      for (const wave of waves) {
        this.grid.applyWildcardWave(wave);
      }
      this.refreshGrid();
      this.busy = false;
      return true;
    }

    this.playWildcardChainReveal(waves, () => {
      this.busy = false;
      const chain = this.grid.getSameSecondaryCluster(spawns[0].col, spawns[0].row);
      if (chain.length > spawns.length) {
        announce(
          `Chain! ${chain.length} connected tiles — double-tap to collect.`,
          true,
        );
      }
      this.refreshGrid();
    });
    return true;
  }

  private static readonly WILDCARD_CHAIN_PAUSE_MS = 520;

  private playWildcardChainReveal(
    waves: WildcardSpawn[][],
    onComplete: () => void,
  ): void {
    if (waves.length === 0) {
      onComplete();
      return;
    }

    let waveIndex = 0;
    const playNext = () => {
      if (waveIndex >= waves.length) {
        onComplete();
        return;
      }

      const wave = waves[waveIndex++];
      this.grid.applyWildcardWave(wave);
      this.refreshGrid();

      this.playWildcardSpawnReveal(wave, () => {
        if (waveIndex < waves.length) {
          this.time.delayedCall(GameScene.WILDCARD_CHAIN_PAUSE_MS, playNext);
        } else {
          playNext();
        }
      });
    };

    playNext();
  }

  private playWildcardSpawnReveal(
    spawns: WildcardSpawn[],
    onComplete: () => void,
  ): void {
    if (spawns.length === 0) {
      onComplete();
      return;
    }

    const center = spawns.reduce(
      (acc, spawn) => {
        const pos = this.getTilePosition(spawn.col, spawn.row);
        return { x: acc.x + pos.x, y: acc.y + pos.y };
      },
      { x: 0, y: 0 },
    );
    center.x /= spawns.length;
    center.y /= spawns.length;

    if (!this.contrast.isReducedMotion()) {
      spawnWildcardRingWave(this, center.x, center.y, this.layout.uiScale);
      flashWildcardReward(this);
      this.cameras.main.shake(220, 0.007 * this.layout.uiScale);
    }

    if (this.contrast.isReducedMotion()) {
      onComplete();
      return;
    }

    let pending = spawns.length;
    const done = () => {
      pending--;
      if (pending === 0) onComplete();
    };

    spawns.forEach((spawn, index) => {
      const parts = this.tileSprites[spawn.row][spawn.col];
      const target = this.getTilePosition(spawn.col, spawn.row);
      parts.container.setDepth(24);
      parts.container.setPosition(center.x, center.y);
      parts.container.setScale(0);

      this.tweens.add({
        targets: parts.container,
        x: target.x,
        y: target.y,
        scale: 1,
        delay: index * 35,
        duration: 460,
        ease: 'Back.easeOut',
        onComplete: () => {
          parts.container.setDepth(5);
          done();
        },
      });
    });
  }

  private tryCollectWildcardReward(col: number, row: number): boolean {
    if (!this.grid.isWildcardReward(col, row) || this.busy) return false;

    const group = this.grid.getSameSecondaryCluster(col, row);
    if (!this.clusterTouchesWildcardReward(group)) return false;

    this.busy = true;
    this.pointerStart = null;
    this.lastTap = null;
    this.selected = null;
    this.snapAllTilesToGrid();

    this.recordClearGoals(group);

    const color = this.grid.getCell(col, row);
    const bonus = this.scoring.recordWildcardRewardClear(group.length);
    this.scoreDisplay.setScore(this.scoring.score);
    announce(
      group.length > CONFIG.WILDCARD_BANK_SIZE
        ? `Chain collected! ${group.length} tiles, +${bonus} points!`
        : `Wildcard reward! +${bonus} points!`,
      true,
    );

    const tile = this.tileSprites[row][col];
    this.scoreDisplay.showFloat(
      tile.container.x,
      tile.container.y,
      `+${bonus} JACKPOT!`,
      this,
      this.layout.uiScale,
    );

    this.grid.clearWildcardRewardFlags();

    if (this.contrast.isReducedMotion()) {
      this.grid.clearClusterWithGravity(group);
      this.relayoutTiles();
      this.finishClear();
      return true;
    }

    this.playWildcardRewardCollect(group, color, () => {
      const { moves, spawns } = this.grid.clearClusterWithGravity(group);
      this.playGravityDrop(moves, spawns, () => {
        this.relayoutTiles();
        this.finishClear();
      });
    });
    return true;
  }

  private playWildcardRewardCollect(
    group: Position[],
    color: TileColor | null,
    onComplete: () => void,
  ): void {
    if (group.length === 0) {
      onComplete();
      return;
    }

    const center = group.reduce(
      (acc, pos) => {
        const p = this.getTilePosition(pos.col, pos.row);
        return { x: acc.x + p.x, y: acc.y + p.y };
      },
      { x: 0, y: 0 },
    );
    center.x /= group.length;
    center.y /= group.length;

    flashWildcardReward(this);
    spawnWildcardRingWave(this, center.x, center.y, this.layout.uiScale);
    spawnMegaRewardBurst(this, center.x, center.y, color, this.layout.uiScale);
    this.cameras.main.shake(320, 0.012 * this.layout.uiScale);

    let pending = group.length;
    const done = () => {
      pending--;
      if (pending === 0) onComplete();
    };

    for (const { col, row } of group) {
      const parts = this.tileSprites[row][col];
      const pos = this.getTilePosition(col, row);
      spawnMegaRewardBurst(this, pos.x, pos.y, color, this.layout.uiScale);
      spawnExplodeBurst(this, pos.x, pos.y, color, this.layout.uiScale);

      tweenTileExplode(this, parts.container, done);
    }
  }

  private recordClearGoals(cluster: Position[]): void {
    if (cluster.length === 0) return;

    const color = this.grid.getCell(cluster[0].col, cluster[0].row);
    if (!color) return;

    this.previewRow.onClear(color, cluster.length);

    if (this.previewRow.isAllComplete()) {
      announce('All objectives complete!', true);
    }
  }

  private clearAnimSafetyTimer: Phaser.Time.TimerEvent | null = null;

  private tryDoubleTapClear(col: number, row: number): boolean {
    const cluster = this.grid.getSameSecondaryCluster(col, row);
    if (cluster.length < CONFIG.SECONDARY_CLEAR_MIN || this.busy) return false;

    if (this.clusterTouchesWildcardReward(cluster)) {
      return this.tryClearRewardChain(col, row, cluster);
    }

    this.pendingWildcardSpawn =
      cluster.length >= CONFIG.WILDCARD_CLEAR_THRESHOLD &&
      this.grid.canSpawnSealedWildcard();
    if (this.pendingWildcardSpawn) {
      this.wildcardRewardAnchor = { col, row };
      this.wildcardRewardColor = this.grid.getCell(col, row);
      this.runStats.recordClearForWildcard(cluster.length);
    }

    this.busy = true;
    this.pointerStart = null;
    this.lastTap = null;
    this.selected = null;
    this.snapAllTilesToGrid();

    this.recordClearGoals(cluster);

    const bonus = this.scoring.recordClear();
    this.scoreDisplay.setScore(this.scoring.score);
    announce(`Cleared ${cluster.length} tiles! Bonus ${bonus} points.`, true);

    const tile = this.tileSprites[row][col];
    this.scoreDisplay.showFloat(
      tile.container.x,
      tile.container.y,
      `+${bonus} CLEAR!`,
      this,
      this.layout.uiScale,
    );

    if (this.contrast.isReducedMotion()) {
      this.grid.clearClusterWithGravity(cluster);
      this.relayoutTiles();
      this.finishClear();
      return true;
    }

    this.startClearAnimSafety();

    this.playClusterExplode(cluster, () => {
      const { moves, spawns } = this.grid.clearClusterWithGravity(cluster);
      this.playGravityDrop(moves, spawns, () => {
        this.relayoutTiles();
        this.finishClear();
      });
    });
    return true;
  }

  private tryClearRewardChain(
    col: number,
    row: number,
    cluster: Position[],
  ): boolean {
    this.busy = true;
    this.pointerStart = null;
    this.lastTap = null;
    this.selected = null;
    this.snapAllTilesToGrid();

    this.recordClearGoals(cluster);

    const color = this.grid.getCell(col, row);
    const bonus = this.scoring.recordWildcardRewardClear(cluster.length);
    this.scoreDisplay.setScore(this.scoring.score);
    announce(`Chain clear! ${cluster.length} tiles, +${bonus} points!`, true);

    const tile = this.tileSprites[row][col];
    this.scoreDisplay.showFloat(
      tile.container.x,
      tile.container.y,
      `+${bonus} CHAIN!`,
      this,
      this.layout.uiScale,
    );

    this.grid.clearWildcardRewardFlags();

    if (this.contrast.isReducedMotion()) {
      this.grid.clearClusterWithGravity(cluster);
      this.relayoutTiles();
      this.finishClear();
      return true;
    }

    this.startClearAnimSafety();
    this.playWildcardRewardCollect(cluster, color, () => {
      const { moves, spawns } = this.grid.clearClusterWithGravity(cluster);
      this.playGravityDrop(moves, spawns, () => {
        this.relayoutTiles();
        this.finishClear();
      });
    });
    return true;
  }

  private startClearAnimSafety(): void {
    this.clearAnimSafetyTimer?.destroy();
    const maxMs = 4000;
    this.clearAnimSafetyTimer = this.time.delayedCall(maxMs, () => {
      if (!this.busy) return;
      this.tweens.killAll();
      this.relayoutTiles();
      this.finishClear();
    });
  }

  private finishClear(): void {
    this.clearAnimSafetyTimer?.destroy();
    this.clearAnimSafetyTimer = null;
    this.busy = false;

    if (this.pendingWildcardSpawn && this.wildcardRewardAnchor) {
      this.pendingWildcardSpawn = false;
      const { col, row } = this.wildcardRewardAnchor;
      const disguise = this.wildcardRewardColor ?? randomMainSecondary();
      this.wildcardRewardColor = null;
      if (
        this.grid.canSpawnSealedWildcard() &&
        !this.grid.isWildcardBonus(col, row) &&
        this.grid.spawnWildcardBonusAt(col, row, disguise)
      ) {
        this.runStats.recordWildcardCreated();
        announce('Wildcard bonus appeared! Tap it for 9 grouped secondary tiles.', true);
        this.refreshGrid();
      }
    }

    if (this.grid.isGameOver()) {
      this.endGame('Grid full!');
      return;
    }

    if (this.previewRow.isAllComplete()) {
      this.endGame('All objectives complete!');
    }
  }

  private playClusterExplode(cluster: Position[], onComplete: () => void): void {
    if (cluster.length === 0) {
      onComplete();
      return;
    }

    this.cameras.main.shake(140, 0.004 * this.layout.uiScale);
    let pending = cluster.length;

    for (const { col, row } of cluster) {
      const parts = this.tileSprites[row][col];
      const color = this.grid.getCell(col, row);
      const pos = this.getTilePosition(col, row);
      spawnExplodeBurst(this, pos.x, pos.y, color, this.layout.uiScale);

      tweenTileExplode(this, parts.container, () => {
        pending--;
        if (pending === 0) onComplete();
      });
    }
  }

  private playGravityDrop(
    moves: TileMove[],
    spawns: TileSpawn[],
    onComplete: () => void,
  ): void {
    const total = moves.length + spawns.length;
    if (total === 0) {
      onComplete();
      return;
    }

    let pending = total;
    const done = () => {
      pending--;
      if (pending === 0) onComplete();
    };

    const { tileSize, tileGap, uiScale } = this.layout;
    const step = tileSize + tileGap;
    const dropDuration = Math.round(380 * uiScale);
    const stagger = Math.round(36 * uiScale);

    const spawnKeys = new Set(spawns.map((s) => `${s.col},${s.row}`));

    // Hide emptied source slots (unless that slot also receives a spawn).
    for (const move of moves) {
      const srcKey = `${move.col},${move.fromRow}`;
      if (!spawnKeys.has(srcKey)) {
        this.tileSprites[move.fromRow][move.col].container.setAlpha(0);
      }
    }

    // Animate into each destination slot — avoids reusing the same sprite for move-out + spawn-in.
    for (const move of moves) {
      const parts = this.tileSprites[move.toRow][move.col];
      const fromPos = this.getTilePosition(move.col, move.fromRow);
      const toPos = this.getTilePosition(move.col, move.toRow);

      this.paintCell(parts, move.col, move.toRow);
      parts.container.setPosition(fromPos.x, fromPos.y);
      parts.container.setAlpha(1);
      parts.container.setScale(1);

      this.tweens.add({
        targets: parts.container,
        x: toPos.x,
        y: toPos.y,
        delay: move.toRow * stagger,
        duration: dropDuration,
        ease: 'Bounce.easeOut',
        onComplete: done,
      });
    }

    for (const spawn of spawns) {
      const parts = this.tileSprites[spawn.row][spawn.col];
      const target = this.getTilePosition(spawn.col, spawn.row);
      const startY = target.y - step * (spawn.row + 1.5);

      this.paintCell(parts, spawn.col, spawn.row);
      parts.container.setPosition(target.x, startY);
      parts.container.setAlpha(1);
      parts.container.setScale(1);

      this.tweens.add({
        targets: parts.container,
        y: target.y,
        delay: spawn.row * stagger,
        duration: dropDuration,
        ease: 'Bounce.easeOut',
        onComplete: done,
      });
    }
  }

  private tryMerge(from: Position, to: Position): boolean {
    if (this.busy) return false;

    const a = this.grid.getCell(from.col, from.row);
    const b = this.grid.getCell(to.col, to.row);
    if (!a || !b || isSecondary(a) || isSecondary(b) || !isMergeAllowedForGoal(a, b, this.getCurrentGoal())) {
      this.shakeTile(to.col, to.row);
      if (a && b && merge(a, b)) this.announceCurrentGoal();
      return false;
    }

    this.resetComboIdle();

    const result = this.grid.attemptMerge(from, to);
    if (!result) {
      this.shakeTile(to.col, to.row);
      return false;
    }

    this.busy = true;
    this.snapAllTilesToGrid();
    const { isCombo } = this.scoring.recordMerge();
    this.scoreDisplay.setScore(this.scoring.score);

    const goalCompleted = this.previewRow.onMergeResult(result);
    if (goalCompleted) {
      const next = this.previewRow.getCurrentGoal();
      if (next) announce(`Goal complete! Next: ${next}.`);
    }

    announceMerge(result, this.scoring.score);

    const tile = this.tileSprites[to.row][to.col];
    if (isCombo) {
      announceCombo();
      if (this.mode !== 'classic') this.timer.addBonus();
      this.scoreDisplay.showFloat(
        tile.container.x,
        tile.container.y - 30 * this.layout.uiScale,
        '+50 COMBO!',
        this,
        this.layout.uiScale,
      );
    } else {
      this.scoreDisplay.showFloat(
        tile.container.x,
        tile.container.y,
        '+10',
        this,
        this.layout.uiScale,
      );
    }

    const duration = this.contrast.isReducedMotion() ? 50 : 200;
    this.time.delayedCall(duration, () => {
      this.selected = null;
      this.snapAllTilesToGrid();
      this.refreshGrid();
      this.busy = false;

      if (this.grid.isGameOver()) {
        this.endGame('Grid full!');
      }
    });
    return true;
  }

  private shakeTile(col: number, row: number): void {
    if (this.busy) return;
    const parts = this.tileSprites[row][col];
    this.snapTileToAnchor(parts);
    const anchor = this.getTilePosition(col, row);
    const offset = Math.round(6 * this.layout.uiScale);
    this.tweens.add({
      targets: parts.container,
      x: anchor.x + offset,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.snapTileToAnchor(parts),
    });
  }

  private resetComboIdle(): void {
    if (this.comboIdleTimer) this.comboIdleTimer.destroy();
    this.comboIdleTimer = this.time.delayedCall(CONFIG.COMBO_IDLE_MS, () => {
      if (this.busy || this.paused) return;
      this.scoring.resetCombo();
      this.refreshGrid();
    });
  }

  private handleShake(): void {
    if (this.busy || this.paused || !this.shake.canShake()) return;
    if (!this.shake.use()) return;

    this.busy = true;
    this.scoring.resetCombo();
    this.selected = null;
    this.pendingWildcardSpawn = false;
    this.wildcardRewardAnchor = null;
    this.wildcardRewardColor = null;
    this.header.setShakeUses(this.shake.usesRemaining);
    this.grid.shuffleTiles();
    announce('Board shuffled.');

    const duration = this.contrast.isReducedMotion() ? 50 : 350;
    this.time.delayedCall(duration, () => {
      this.refreshGrid();
      this.busy = false;
    });
  }

  private togglePauseMenu(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.timer.pause();
      this.game.loop.sleep();
      this.showPauseOverlay();
    } else {
      this.timer.resume();
      this.game.loop.wake();
      this.clearOverlay();
    }
  }

  private showPauseOverlay(): void {
    const { width, height } = this.scale;
    const items = ['RESUME', 'ACCESSIBILITY', 'RESTART', 'QUIT'];
    const panel = this.add
      .rectangle(width / 2, height / 2, width * 0.8, 280, 0x1a0a2e, 0.95)
      .setStrokeStyle(2, 0xff00ff)
      .setDepth(50);
    this.overlayGroup.push(panel);

    this.add
      .text(width / 2, height / 2 - 100, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ff00ff',
      })
      .setOrigin(0.5)
      .setDepth(51);

    items.forEach((label, i) => {
      const y = height / 2 - 40 + i * 44;
      const btn = this.add
        .rectangle(width / 2, y, 200, 36, 0x330066)
        .setInteractive({ useHandCursor: true })
        .setDepth(51);
      const txt = this.add
        .text(width / 2, y, label, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#fff',
        })
        .setOrigin(0.5)
        .setDepth(52);
      this.overlayGroup.push(btn, txt);

      btn.on('pointerdown', () => {
        if (label === 'RESUME') this.togglePauseMenu();
        else if (label === 'RESTART') this.scene.restart({ mode: this.mode });
        else if (label === 'QUIT') this.scene.start('MenuScene');
        else if (label === 'ACCESSIBILITY') {
          this.contrast.update({ highContrast: !this.contrast.isHighContrast() });
          this.refreshGrid();
        }
      });
    });
  }

  private clearOverlay(): void {
    this.overlayGroup.forEach((o) => o.destroy());
    this.overlayGroup = [];
  }

  private endGame(reason: string): void {
    this.paused = true;
    this.timer.pause();
    this.game.loop.sleep();

    let timeBonus = 0;
    if (this.mode !== 'classic') {
      timeBonus = this.scoring.addTimeBonus(this.timer.getRemainingSeconds());
    }

    const isNewRecord = updatePersonalBest(this.mode, this.scoring.score);
    saveScore(this.mode, this.scoring.score);
    announceGameOver(this.scoring.score);

    const { width, height } = this.scale;
    this.add
      .rectangle(width / 2, height / 2, width * 0.85, 340, 0x1a0a2e, 0.95)
      .setStrokeStyle(2, 0xff00ff)
      .setDepth(60);

    const recordText = isNewRecord ? '\n★ NEW RECORD ★' : '';
    const chainLabel =
      this.runStats.bestWildcardChainWaves === 1 ? 'wave' : 'waves';
    this.add
      .text(
        width / 2,
        height / 2 - 50,
        `${reason}\n\nSCORE: ${String(this.scoring.score).padStart(8, '0')}\nBest chain: ${this.runStats.bestWildcardChainWaves} ${chainLabel}\nWildcards earned: ${this.runStats.wildcardsCreated}\nBest ★ clear: ${this.runStats.bestClearForWildcard} tiles\nTime bonus: +${timeBonus}${recordText}`,
        {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(61);

    const replay = this.add
      .text(width / 2, height / 2 + 100, '[ REPLAY ]', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#00ffff',
      })
      .setOrigin(0.5)
      .setDepth(61)
      .setInteractive({ useHandCursor: true });

    const menu = this.add
      .text(width / 2, height / 2 + 140, '[ MENU ]', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ff00ff',
      })
      .setOrigin(0.5)
      .setDepth(61)
      .setInteractive({ useHandCursor: true });

    replay.on('pointerdown', () => this.scene.restart({ mode: this.mode }));
    menu.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
