'use client';
import { motion } from 'framer-motion';

export function NanaThinking() {
  return (
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="mx-auto">
      <img src="/assets/nana/nana-thinking.png" alt="생각 중인 나나" className="mx-auto h-36 w-36 object-contain" />
    </motion.div>
  );
}
