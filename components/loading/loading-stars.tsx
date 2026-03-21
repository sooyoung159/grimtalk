'use client';
import { motion } from 'framer-motion';

export function LoadingStars() {
  return <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-center text-2xl">✨ ✨ ✨</motion.div>;
}
