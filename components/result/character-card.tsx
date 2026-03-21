import { Card } from '@/components/common/card';
import { CharacterCard as T } from '@/types/character';
import { CharacterTraits } from './character-traits';

export function CharacterCard({ character }: { character: T }) {
  return <Card variant="character" className="space-y-3"><h3 className="text-xl font-bold">{character.name}</h3><p className="text-sm text-[#675F59]">{character.identity}</p><CharacterTraits traits={character.traits} /><p className="rounded-2xl bg-[#FFF9F0] p-3 text-sm">“{character.greeting}”</p><p className="text-sm text-[#4A433E]">{character.question}</p></Card>;
}
