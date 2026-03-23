'use client';
import { motion } from 'framer-motion';

const STARS = [
  { text: '✦', delay: 0, size: 'text-sm' },
  { text: '✨', delay: 0.15, size: 'text-base' },
  { text: '✧', delay: 0.3, size: 'text-xs' },
  { text: '✨', delay: 0.45, size: 'text-sm' },
] as const;

export function LoadingStars() {
  return (
    <div className="flex items-center justify-center gap-2 text-[#D3B97A]">
      {STARS.map((star, idx) => (
        <motion.span
          key={`${star.text}-${idx}`}
          className={star.size}
          animate={{ opacity: [0.15, 0.95, 0.2], y: [0, -3, 0], scale: [0.9, 1.05, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: star.delay, ease: 'easeInOut' }}
        >
          {star.text}
        </motion.span>
      ))}
    </div>
  );
}
