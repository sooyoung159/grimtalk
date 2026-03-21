import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function SecondaryButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('h-[52px] w-full rounded-full border border-[#DED8D4] bg-white/80 px-5 text-[#4A433E]', className)} {...props}>{children}</button>;
}
