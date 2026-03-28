'use client';

import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export function ConfettiCelebration() {
  useEffect(() => {
    const duration = 3000;
    const start = Date.now();
    const end = start + duration;
    const colors = ['#043625', '#EBE3C6', '#EFEEEA', '#EF6C00'];

    // Initial burst
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 }, colors });

    // Continuous spray from sides
    const frame = () => {
      const elapsed = Date.now() - start;
      // Fade out particle count over time
      const progress = elapsed / duration;
      const count = Math.max(1, Math.round(4 * (1 - progress)));

      confetti({ particleCount: count, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: count, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return null;
}
