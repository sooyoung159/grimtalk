import { Card } from '@/components/common/card';
import { CharacterCard as T } from '@/types/character';
import { CharacterTraits } from './character-traits';

export function CharacterCard({ character, assistantText }: { character: T; assistantText?: string }) {
  const firstGreeting = character.greeting?.trim() || assistantText?.trim() || '안녕! 만나서 반가워!';
  const followUpQuestion = character.question?.trim() || '우리 다음엔 어떤 이야기를 해볼까?';

  return (
    <Card variant="character" className="space-y-4">
      <div>
        <p className="text-xs text-[#8B8177]">이름</p>
        <h3 className="text-xl font-bold">{character.name}</h3>
      </div>

      <div>
        <p className="text-xs text-[#8B8177]">정체</p>
        <p className="text-sm text-[#675F59]">{character.identity}</p>
      </div>

      <CharacterTraits traits={character.traits} />

      <div>
        <p className="mb-1 text-xs text-[#8B8177]">첫 인사</p>
        <p className="rounded-2xl bg-[#FFF9F0] p-3 text-sm">“{firstGreeting}”</p>
      </div>

      <div>
        <p className="mb-1 text-xs text-[#8B8177]">친구의 질문</p>
        <p className="text-sm text-[#4A433E]">{followUpQuestion}</p>
      </div>

      {assistantText?.trim() && (
        <div>
          <p className="mb-1 text-xs text-[#8B8177]">실제 응답</p>
          <p className="text-sm text-[#4A433E]">{assistantText}</p>
        </div>
      )}
    </Card>
  );
}
