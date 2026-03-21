import { cn } from '@/lib/utils/cn';

export function Card({ children, variant = 'base', className }: { children: React.ReactNode; variant?: 'base' | 'hero' | 'character' | 'speech'; className?: string }) {
  const variants = {
    base: 'bg-white/90 rounded-[24px] p-6 border border-[#EFEAE6] shadow-[0_6px_18px_rgba(103,95,89,0.08)]',
    hero: 'bg-gradient-to-b from-[#FFFDF8] to-[#FFF7EC] rounded-[28px] p-7 shadow-[0_18px_40px_rgba(103,95,89,0.12)]',
    character: 'bg-white/95 rounded-[28px] p-6 border border-[#FFE58A] shadow-[0_12px_28px_rgba(103,95,89,0.10)]',
    speech: 'bg-[#FFF9F0] rounded-[24px] p-4 border border-[#FFE58A]',
  };
  return <div className={cn(variants[variant], className)}>{children}</div>;
}
