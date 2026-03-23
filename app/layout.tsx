import './globals.css';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://grimtalk.vercel.app';
const title = '그림톡';
const description = '내 그림이 말을 시작해요';

const ogImage = '/assets/nana/nana-wave.png';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: title,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: `${title} 대표 이미지`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
