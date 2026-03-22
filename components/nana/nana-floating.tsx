'use client';
import { motion } from 'framer-motion';

export function NanaFloating() {
  return (
    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.8 }} className="mx-auto">
      <img src="/assets/nana/nana-wave.png" alt="나나" className="mx-auto h-48 w-48 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]" />
    </motion.div>
  );
}
