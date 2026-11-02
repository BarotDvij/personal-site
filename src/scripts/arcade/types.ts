// Contract between the arcade shell and each game.

export interface Api {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Keys currently held, normalized: 'ArrowUp', 'Space', 'Enter', 'w', ... */
  held: Set<string>;
  /** True once per press, cleared after each update. */
  pressed(key: string): boolean;
  setScore(score: number, label?: string): void;
  /** Ends the round. The shell shows the message and saves the best score. */
  over(message: string, won?: boolean): void;
  sound: {
    blip(): void;
    good(): void;
    bad(): void;
  };
  reduced: boolean;
}

export type PointerKind = 'down' | 'up' | 'move' | 'alt';

export interface Game {
  update(dt: number): void;
  render(): void;
  pointer?(x: number, y: number, kind: PointerKind): void;
  swipe?(dir: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'): void;
}

export interface GameModule {
  width: number;
  height: number;
  /** Which on-screen controls to show on touch devices. */
  pad: 'dpad' | 'dpad-ab' | 'none';
  /** How best scores compare. 'none' skips saving. */
  best: 'high' | 'low' | 'none';
  create(api: Api): Game;
}
