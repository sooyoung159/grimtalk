'use client';
import { motion } from 'framer-motion';

export function RecordButton({ isRecording, onClick }: { isRecording: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      animate={isRecording ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ repeat: isRecording ? Infinity : 0, duration: 1.1 }}
      className={`relative h-[98px] w-[98px] rounded-full text-white shadow-lg transition ${
        isRecording ? 'bg-[#FF7F66] shadow-[0_14px_28px_rgba(255,127,102,0.35)]' : 'bg-[#FF8B6E] shadow-[0_14px_28px_rgba(255,139,110,0.3)]'
      }`}
      aria-label={isRecording ? '녹음 멈추기' : '녹음 시작하기'}
    >
      <span className={`absolute inset-0 rounded-full border-2 ${isRecording ? 'border-[#FFD1C5]' : 'border-[#FFDCD2]'}`} />
      <span className="relative text-2xl leading-none">{isRecording ? '■' : '●'}</span>
    </motion.button>
  );
}
