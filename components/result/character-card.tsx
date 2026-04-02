import { Card } from '@/components/common/card';
import { CharacterCard as T } from '@/types/character';
import { CharacterTraits } from './character-traits';
import type { ConversationMessage } from '@/stores/conversation-store';

export function CharacterCard({ character, assistantText, messages, turnMode = 'first_turn' }: { character: T; assistantText?: string; messages?: ConversationMessage[]; turnMode?: 'first_turn' | 'continue_turn' }) {
  const firstGreeting = character.greeting?.trim() || '안녕! 만나서 반가워!';
  const followUpQuestion = character.question?.trim();
  const identity = character.identity?.trim();
  const hasTraits = character.traits?.some(Boolean);
  const reversedMessages = [...(messages ?? [])].reverse();
  const latestUserMessage = reversedMessages.find((m) => m.role === 'user' && m.text.trim() !== '...');
  const latestAssistantMessage = reversedMessages.find((m) => m.role === 'assistant' && m.text.trim() !== '...');
  const currentReply = latestAssistantMessage?.text?.trim() || assistantText?.trim() || firstGreeting;
  const currentUserText = latestUserMessage?.text?.trim();
  const showDetails = Boolean(identity || hasTraits || (assistantText?.trim() && assistantText.trim() !== firstGreeting));

  if (turnMode === 'continue_turn') {
    return (
      <div className="space-y-3">
        <Card variant="character" className="space-y-4 border-[#F3E2B4] bg-[#FFFEFB]">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-[#8B8177]">그림 친구 이름</p>
            <h3 className="text-[30px] font-bold leading-none tracking-tight text-[#2F2A26]">{character.name}</h3>
          </div>

          {currentUserText && (
            <div className="rounded-[20px] bg-[#F7F2EC] px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-[#8B8177]">내가 방금 한 말</p>
              <p className="mt-1 text-sm leading-relaxed text-[#4A433E]">{currentUserText}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="relative rounded-[24px] border border-[#F3E2B4] bg-[#FFF9EC] px-4 py-4 text-[16px] leading-relaxed text-[#3D3732] shadow-[0_10px_24px_rgba(255,217,90,0.10)]">
              <span className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-[#F3E2B4] bg-[#FFF9EC]" />
              “{currentReply}”
            </div>
          </div>
        </Card>

        {Boolean(identity || hasTraits) && (
          <details className="rounded-[22px] border border-[#EFE7DC] bg-white/80 px-4 py-3 text-sm text-[#675F59]">
            <summary className="cursor-pointer list-none text-xs font-semibold tracking-wide text-[#8B8177]">
              이 친구 더 알아보기
            </summary>

            <div className="mt-3 space-y-3">
              {identity && <p className="leading-relaxed">{identity}</p>}
              {hasTraits && <CharacterTraits traits={character.traits} />}
            </div>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card variant="character" className="space-y-4 border-[#F3E2B4] bg-[#FFFEFB]">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold tracking-wide text-[#8B8177]">그림 친구 이름</p>
          <h3 className="text-[30px] font-bold leading-none tracking-tight text-[#2F2A26]">{character.name}</h3>
        </div>

        <div className="space-y-2">
          <div className="relative rounded-[24px] border border-[#F3E2B4] bg-[#FFF9EC] px-4 py-4 text-[16px] leading-relaxed text-[#3D3732] shadow-[0_10px_24px_rgba(255,217,90,0.10)]">
            <span className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-[#F3E2B4] bg-[#FFF9EC]" />
            “{firstGreeting}”
          </div>
        </div>

        {followUpQuestion && (
          <div className="rounded-[20px] bg-[#FFFDF6] px-4 py-3">
            <p className="text-sm leading-relaxed text-[#4A433E]">{followUpQuestion}</p>
          </div>
        )}
      </Card>

      {showDetails && (
        <details className="rounded-[22px] border border-[#EFE7DC] bg-white/80 px-4 py-3 text-sm text-[#675F59]">
          <summary className="cursor-pointer list-none text-xs font-semibold tracking-wide text-[#8B8177]">
            이 친구 더 알아보기
          </summary>

          <div className="mt-3 space-y-3">
            {identity && <p className="leading-relaxed">{identity}</p>}

            {hasTraits && <CharacterTraits traits={character.traits} />}

            {assistantText?.trim() && assistantText.trim() !== firstGreeting && (
              <div className="rounded-2xl bg-[#FFFBF4] px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-[#8B8177]">실제 응답 텍스트</p>
                <p className="mt-1 leading-7 text-[#4A433E]">“{assistantText}”</p>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
