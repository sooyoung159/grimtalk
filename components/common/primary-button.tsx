'use client';
import { motion } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { fullWidth?: boolean; loading?: boolean; }
export function PrimaryButton({ className, fullWidth = true, loading, children, ...props }: Props) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
      <button
        disabled={loading || props.disabled}
        className={cn('h-[60px] rounded-full bg-[#FFD95A] px-6 text-[16px] font-semibold text-[#2F2A26] shadow-[0_10px_24px_rgba(255,217,90,0.28)] disabled:opacity-50', fullWidth && 'w-full', className)}
        {...props}
      >
        {loading ? '잠깐만...' : children}
      </button>
    </motion.div>
  );
}
