export function AudioLevelIndicator({ active }: { active: boolean }) {
  return <div className="text-center text-xs text-[#675F59]">{active ? '녹음 중...' : '버튼을 눌러 말 걸어봐!'}</div>;
}
