'use client';
import { motion } from 'framer-motion';

export function NanaFloating() {
  return (
    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.8 }} className="mx-auto">
      <img src="/assets/nana/nana-wave.png" alt="나나" className="mx-auto h-40 w-40 object-contain" />
    </motion.div>
  );
}
