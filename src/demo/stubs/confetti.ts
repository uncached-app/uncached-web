import library from 'canvas-confetti/dist/confetti.module.mjs';
import type { CreateTypes, Options } from 'canvas-confetti';

let target: CreateTypes | null = null;

/** Where the next bursts are drawn; `null` drops them. Origins are relative to this canvas. */
export function setConfettiCanvas(canvas: HTMLCanvasElement | null): void {
  target?.reset();
  target = canvas ? library.create(canvas, { resize: true, disableForReducedMotion: true }) : null;
}

/** Stops every burst still falling. */
export function clearConfetti(): void {
  target?.reset();
}

/**
 * Stands in for `canvas-confetti` in the website build: the library's own
 * canvas covers the whole page, and the demo's bursts belong to its window.
 */
export default function confetti(options?: Options): Promise<null> | null {
  return target ? target(options) : null;
}
