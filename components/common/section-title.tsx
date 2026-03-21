import { SectionTitleProps } from '@/types/ui';

export function SectionTitle({ title, description, align = 'left' }: SectionTitleProps) {
  return <header className={align === 'center' ? 'text-center' : ''}><h2 className="text-[24px] font-bold text-[#2F2A26]">{title}</h2>{description && <p className="mt-2 text-sm text-[#675F59]">{description}</p>}</header>;
}
