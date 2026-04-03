import { CharacterCard as T } from '@/types/character';
import { AudioPlayer } from './audio-player';
import { ResultActions } from './result-actions';
import type { ConversationMessage } from '@/stores/conversation-store';

export function ResultScreen({ imageUrl, character, assistantText, audioUrl, recentMessages, onTalkAgain, onRestart }: { imageUrl?: string | null; character: T; assistantText: string; audioUrl?: string | null; recentMessages?: ConversationMessage[]; onTalkAgain: () => void; onRestart: () => void; }) {
  const allMessages = recentMessages ?? [];
  const isContinueTurn = allMessages.length > 2;

  // 현재 턴의 user/assistant 텍스트
  const reversedMessages = [...allMessages].reverse();
  const latestUser = reversedMessages.find((m) => m.role === 'user' && m.text.trim() !== '...');
  const latestAssistant = reversedMessages.find((m) => m.role === 'assistant' && m.text.trim() !== '...');
  const currentReply = latestAssistant?.text?.trim() || assistantText?.trim() || character.greeting || '안녕!';
  const currentUserText = latestUser?.text?.trim();

  // 이전 대화들 (현재 턴 제외)
  const previousMessages = allMessages.length > 2
    ? allMessages.slice(0, -2).filter((m) => m.text.trim() !== '...')
    : [];

  return (
    <div className="space-y-4 animate-result-enter">
      {/* 상단: 캐릭터 이름 + 작은 이미지 */}
      <div className="flex items-center gap-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="그림 친구"
            className="h-14 w-14 shrink-0 rounded-[16px] border border-[#F2ECE6] object-cover shadow-[0_4px_12px_rgba(103,95,89,0.10)]"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-[#8B8177]">그림 친구</p>
          <h2 className="text-[22px] font-bold leading-tight text-[#2F2A26]">{character.name}</h2>
          {character.identity && (
            <p className="mt-0.5 truncate text-xs text-[#9A8F83]">{character.identity}</p>
          )}
        </div>
      </div>

      {/* 대화 영역 — 메인 콘텐츠 */}
      <div className="space-y-2.5">
        {/* 이전 대화 (있으면) */}
        {previousMessages.length > 0 && (
          <div className="space-y-2 pb-2">
            {previousMessages.map((m) => (
              <MessageBubble key={m.id} role={m.role} text={m.text} faded />
            ))}
            <div className="mx-4 border-b border-dashed border-[#EFE7DC]" />
          </div>
        )}

        {/* 내가 한 말 */}
        {currentUserText && (
          <MessageBubble role="user" text={currentUserText} />
        )}

        {/* 친구의 대답 — 핵심 영역 */}
        <div className="relative">
          <div className="rounded-[22px] border border-[#F3E2B4] bg-gradient-to-br from-[#FFFEFB] to-[#FFF9EC] px-5 py-4 shadow-[0_8px_24px_rgba(255,217,90,0.12)]">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#B5A88D]">{character.name}의 말</p>
            <p className="text-[17px] leading-[1.7] text-[#2F2A26]">
              {currentReply}
            </p>
          </div>
        </div>

        {/* 오디오 플레이어 — 대화 바로 아래 */}
        <AudioPlayer audioUrl={audioUrl} />
      </div>

      {/* 액션 버튼 */}
      <div className="pt-1">
        <ResultActions onTalkAgain={onTalkAgain} onRestart={onRestart} />
      </div>

      {/* 캐릭터 상세 (접힌 상태) */}
      {(character.identity || character.traits?.some(Boolean)) && (
        <details className="rounded-[22px] border border-[#EFE7DC] bg-white/80 px-4 py-3 text-sm text-[#675F59]">
          <summary className="cursor-pointer list-none text-xs font-semibold tracking-wide text-[#8B8177]">
            이 친구 더 알아보기
          </summary>
          <div className="mt-3 space-y-2">
            {character.identity && <p className="leading-relaxed">{character.identity}</p>}
            {character.traits?.some(Boolean) && (
              <div className="flex flex-wrap gap-2">
                {character.traits.filter(Boolean).map((t) => (
                  <span key={t} className="rounded-full bg-[#FFF7E8] px-3 py-1 text-xs font-medium text-[#8B7E5A]">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

/* 대화 버블 컴포넌트 */
function MessageBubble({ role, text, faded }: { role: 'user' | 'assistant'; text: string; faded?: boolean }) {
  const isUser = role === 'user';
  const opacity = faded ? 'opacity-60' : '';

  if (isUser) {
    return (
      <div className={`flex justify-end ${opacity}`}>
        <div className="max-w-[85%] rounded-[20px] rounded-br-[6px] bg-[#F0EBE5] px-4 py-3">
          <p className="text-[14px] leading-relaxed text-[#4A433E]">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-start ${opacity}`}>
      <div className="max-w-[85%] rounded-[20px] rounded-bl-[6px] bg-[#FFF7E8] px-4 py-3">
        <p className="text-[14px] leading-relaxed text-[#3F3933]">{text}</p>
      </div>
    </div>
  );
}
