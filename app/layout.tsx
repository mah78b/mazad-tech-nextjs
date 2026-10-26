import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مزاد تك | مزادات الكمبيوتر والهاردوير',
  description: 'منصة مزادات متخصصة في الكمبيوتر والهاردوير في مصر.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
