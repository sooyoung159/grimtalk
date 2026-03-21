'use client';
import { motion } from 'framer-motion';

export function RecordButton({ isRecording, onClick }: { isRecording: boolean; onClick: () => void }) {
  return (
    <motion.button onClick={onClick} animate={isRecording ? { scale: [1, 1.04, 1] } : { scale: 1 }} transition={{ repeat: isRecording ? Infinity : 0, duration: 1 }}
      className="h-[92px] w-[92px] rounded-full bg-[#FF8B6E] text-white shadow-lg">
      {isRecording ? '■' : '●'}
    </motion.button>
  );
}
