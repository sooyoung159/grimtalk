import type { ConversationMessage } from '@/stores/conversation-store';
import { Card } from '@/components/common/card';

export function RecentConversationCard({ messages }: { messages: ConversationMessage[] }) {
  if (!messages.length) return null;

  return (
    <Card variant="base" className="space-y-2.5 p-3.5">
      <p className="text-xs font-semibold tracking-wide text-[#8B8177]">방금 대화</p>

      <div className="space-y-2">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                isUser ? 'bg-[#F7F2EC] text-[#4A433E]' : 'bg-[#FFF7E8] text-[#3F3933]'
              }`}
            >
              <p className="mb-0.5 text-[11px] font-semibold text-[#8B8177]">{isUser ? '내가 말한 것' : '친구가 한 말'}</p>
              <p>{m.text}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
