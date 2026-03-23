export function AudioLevelIndicator({ active }: { active: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-sm font-medium ${active ? 'text-[#A55445]' : 'text-[#675F59]'}`}>
        {active ? '지금 말하면 친구가 듣고 있어!' : '버튼을 누르고 짧게 한마디 해줘'}
      </p>
      <p className="mt-1 text-xs text-[#9A8F83]">{active ? '다 말했으면 다시 눌러 마무리해줘.' : '예: 안녕! 같이 놀자!'}</p>
    </div>
  );
}
