import { Chip } from '@/components/common/chip';

export function CharacterTraits({ traits }: { traits: [string, string] }) {
  return <div className="flex gap-2">{traits.map((t) => <Chip key={t} text={t} />)}</div>;
}
