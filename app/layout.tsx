import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '그림톡',
  description: '내 그림이 말을 시작해요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
