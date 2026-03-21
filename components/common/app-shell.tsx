'use client';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#FFFDF8] px-5 py-6 md:flex md:justify-center">
      <div className="mx-auto w-full max-w-[460px]">{children}</div>
    </main>
  );
}
