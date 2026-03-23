'use client';
import { motion } from 'framer-motion';

export function NanaThinking() {
  return (
    <motion.div
      animate={{ y: [0, -5, 0], rotate: [0, -1.2, 0, 1.2, 0] }}
      transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
      className="mx-auto relative w-fit"
    >
      <img src="/assets/nana/nana-thinking.png" alt="생각 중인 나나" className="mx-auto h-36 w-36 object-contain" />

      <motion.span
        className="absolute right-2 top-3 text-sm"
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.05, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      >
        ✨
      </motion.span>
      <motion.span
        className="absolute left-3 top-7 text-xs"
        animate={{ opacity: [0.1, 0.9, 0.1], y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: 0.2 }}
      >
        ✦
      </motion.span>
    </motion.div>
  );
}
