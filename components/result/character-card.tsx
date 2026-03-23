import { Card } from '@/components/common/card';
import { CharacterCard as T } from '@/types/character';
import { CharacterTraits } from './character-traits';

export function CharacterCard({ character, assistantText }: { character: T; assistantText?: string }) {
  const firstGreeting = character.greeting?.trim() || assistantText?.trim() || '안녕! 만나서 반가워!';
  const followUpQuestion = character.question?.trim() || '우리 다음엔 어떤 이야기를 해볼까?';

  return (
    <Card variant="character" className="space-y-5 border-[#F3E2B4] bg-[#FFFEFB]">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-[#8B8177]">이름</p>
        <h3 className="text-2xl font-bold leading-tight text-[#2F2A26]">{character.name}</h3>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-[#8B8177]">정체</p>
        <p className="text-sm leading-relaxed text-[#675F59]">{character.identity}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-[#8B8177]">성격</p>
        <CharacterTraits traits={character.traits} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-[#8B8177]">첫 인사</p>
        <div className="relative rounded-[22px] border border-[#F3E2B4] bg-[#FFF9EC] px-4 py-3 text-[15px] leading-relaxed text-[#3D3732]">
          <span className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-[#F3E2B4] bg-[#FFF9EC]" />
          “{firstGreeting}”
        </div>
      </div>

      <div className="rounded-2xl bg-[#FFFDF6] px-4 py-3">
        <p className="mb-1 text-xs font-semibold tracking-wide text-[#8B8177]">친구의 질문</p>
        <p className="text-sm leading-relaxed text-[#4A433E]">{followUpQuestion}</p>
        <p className="mt-2 text-xs text-[#9A8F83]">이어서 한마디 해보자! 마이크 버튼을 눌러도 좋아.</p>
      </div>

      {assistantText?.trim() && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold tracking-wide text-[#8B8177]">실제 응답</p>
          <div className="rounded-2xl border border-[#EFE7DC] bg-[#FFFBF4] px-4 py-3">
            <p className="text-sm leading-7 text-[#4A433E]">“{assistantText}”</p>
          </div>
        </div>
      )}
    </Card>
  );
}
