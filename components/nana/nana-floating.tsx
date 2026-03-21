'use client';
import { motion } from 'framer-motion';

export function NanaFloating() {
  return (
    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.8 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF3BF] text-2xl shadow">
      ⭐
    </motion.div>
  );
}
