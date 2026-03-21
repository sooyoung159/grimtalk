import { Chip } from '@/components/common/chip';

export function ExampleSpeechChips({ items }: { items: string[] }) {
  return <div className="flex flex-wrap gap-2">{items.map((i) => <Chip key={i} text={i} />)}</div>;
}
