// Arcade game list. Metadata only: each game's code is a separate file that
// downloads the first time someone starts it.

import type { GameModule } from './types';

export interface GameInfo {
  id: string;
  title: string;
  blurb: string;
  credit: string;
  help: string;
  load: () => Promise<{ default: GameModule }>;
}

export const GAMES: GameInfo[] = [
  {
    id: 'snake',
    title: 'Packet Snake',
    blurb: 'Grow a data packet through the pipes.',
    credit: 'Inspired by Snake, which I played growing up.',
    help: 'Arrow keys or WASD to steer. Swipe on phones.',
    load: () => import('./games/snake'),
  },
  {
    id: 'sweeper',
    title: 'Bug Sweeper',
    blurb: 'Clear the lot without stepping on a bug.',
    credit: 'Inspired by Minesweeper, which I played growing up.',
    help: 'Click to dig. Right-click, or switch to flag mode, to flag a bug.',
    load: () => import('./games/sweeper'),
  },
  {
    id: 'cat',
    title: 'Trap the Cat',
    blurb: 'Block the paths before the cat escapes.',
    credit: 'Inspired by Chat Noir, which I played growing up.',
    help: 'Click a tile to block it. Surround the cat to win.',
    load: () => import('./games/cat'),
  },
  {
    id: 'rally',
    title: 'Rally',
    blurb: 'First to 7 points on the city court.',
    credit: 'Inspired by the browser tennis games I played growing up, and a little Pong.',
    help: 'W and S, or the arrow keys, to move. Drag on phones.',
    load: () => import('./games/rally'),
  },
  {
    id: 'blocks',
    title: 'Block Stack',
    blurb: 'Stack, spin, and clear lines.',
    credit: 'Inspired by Tetris, the game that pulled me into competitive Tetris in high school.',
    help: 'Left and right to move, Up or X to rotate, Z to rotate back, Down to soft drop, Space to hard drop, C to hold.',
    load: () => import('./games/blocks'),
  },
  {
    id: 'muncher',
    title: 'Pipe Muncher',
    blurb: 'Eat every packet, dodge the bugs.',
    credit: 'Inspired by Pac-Man, which I played a lot growing up.',
    help: 'Arrow keys or WASD to move. Swipe on phones. Power cells let you chase the bugs.',
    load: () => import('./games/muncher'),
  },
  {
    id: 'duck',
    title: 'Duck Flight',
    blurb: 'Train your duck to fly the distance.',
    credit: 'Inspired by the flying challenge in Duck Life, which I played growing up.',
    help: 'Hold Space, click, or tap to flap. Dodge clouds and grab seeds.',
    load: () => import('./games/duck'),
  },
  {
    id: 'chess',
    title: 'Chess',
    blurb: '2 players on one device, or play the city.',
    credit: 'One of my favourite games growing up.',
    help: 'Click a piece, then a square. Press C to switch between two players and the computer.',
    load: () => import('./games/chess'),
  },
  {
    id: 'tanks',
    title: 'Tank Duel',
    blurb: '2 players, one keyboard, bouncing shells.',
    credit: 'Inspired by Tank Trouble, which I played growing up.',
    help: 'Green: WASD to drive, Q to fire. Blue: arrow keys to drive, M or / to fire. Best on a keyboard.',
    load: () => import('./games/tanks'),
  },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
