import type { ConversationMessage } from '@/stores/conversation-store';

export function RecentConversationCard({ messages }: { messages: ConversationMessage[] }) {
  if (!messages.length) return null;

  return (
    <details className="rounded-[22px] border border-[#EFE7DC] bg-white/80 px-4 py-3 text-sm text-[#675F59]">
      <summary className="cursor-pointer list-none text-xs font-semibold tracking-wide text-[#8B8177]">
        방금 나눈 말 보기
      </summary>

      <div className="mt-3 space-y-2">
        {messages.filter((m) => m.text.trim() !== '...').map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                isUser ? 'bg-[#F7F2EC] text-[#4A433E]' : 'bg-[#FFF7E8] text-[#3F3933]'
              }`}
            >
              <p className="mb-1 text-[11px] font-semibold text-[#8B8177]">{isUser ? '내가 한 말' : '친구가 한 말'}</p>
              <p>{m.text}</p>
            </div>
          );
        })}
      </div>
    </details>
  );
}
