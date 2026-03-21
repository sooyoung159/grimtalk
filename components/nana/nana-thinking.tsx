'use client';
import { motion } from 'framer-motion';

export function NanaThinking() {
  return <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} className="mx-auto text-6xl">✨</motion.div>;
}
