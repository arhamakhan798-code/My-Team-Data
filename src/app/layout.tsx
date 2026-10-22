import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Our Team',
  description: 'Meet the people behind our work — a team directory powered by Google Sheets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
